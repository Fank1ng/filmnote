// FilmNote Cloudflare Worker — TMDB proxy + recommendation + KV persistence
const TMDB_BASE = 'https://api.themoviedb.org/3';
const DEFAULT_ALLOWED_ORIGINS = [
  'null',
  'https://fank1ng.github.io',
  'https://filmnote.lccf1223.workers.dev',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
];
const MAX_PREFETCH_IDS = 50;
const MAX_TITLE_IDS = 100;
const MAX_CREDIT_IDS = 50;
const MAX_RECOMMEND_ENTRIES = 1000;
const MAX_JSON_BYTES = 256 * 1024;
const REC_CACHE_VERSION = 'v3';

function getTmdbKey(env) {
  return env && env.TMDB_API_KEY;
}

function isTmdbReadToken(value) {
  return typeof value === 'string' && value.split('.').length === 3;
}

// L1 memory cache (fast, isolate-scoped, LRU eviction)
const memCache = new Map();
const MEM_MAX = 500;

function cacheGet(key) {
  if (!memCache.has(key)) return undefined;
  const val = memCache.get(key);
  memCache.delete(key);
  memCache.set(key, val);  // move to end (most-recently-used)
  return val;
}

function cacheSet(key, value) {
  if (memCache.size >= MEM_MAX) memCache.delete(memCache.keys().next().value);
  memCache.set(key, value);
}

function getAllowedOrigins(env) {
  const configured = env && env.ALLOWED_ORIGINS;
  if (!configured) return DEFAULT_ALLOWED_ORIGINS;
  return configured.split(',').map(o => o.trim()).filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request && request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);
  const allowOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, request, env, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...corsHeaders(request, env),
    },
  });
}

function errorResponse(message, request, env, status = 400, extra = {}) {
  return jsonResponse({ error: message, ...extra }, request, env, status);
}

async function readJsonBody(request, maxBytes = MAX_JSON_BYTES) {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len && len > maxBytes) throw new Error('Request body too large');
  const text = await request.text();
  if (text.length > maxBytes) throw new Error('Request body too large');
  return JSON.parse(text);
}

function normalizeIds(ids, limit) {
  if (!Array.isArray(ids) || !ids.length) return null;
  return [...new Set(ids.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0))]
    .slice(0, limit);
}

function sanitizeEntries(entries) {
  if (!Array.isArray(entries)) return null;
  return entries.slice(0, MAX_RECOMMEND_ENTRIES).map(e => ({
    user_id: e.user_id,
    type: e.type === 'series' ? 'series' : 'movie',
    tmdb_id: Number.isFinite(Number(e.tmdb_id)) ? Number(e.tmdb_id) : null,
    total_score: Number.isFinite(Number(e.total_score)) ? Number(e.total_score) : null,
    score: Number.isFinite(Number(e.score)) ? Number(e.score) : null,
    created_at: e.created_at || '',
  }));
}

function sanitizeBlockedFeedback(blockedMovies, blockedIds) {
  if (Array.isArray(blockedMovies)) {
    return blockedMovies.slice(0, 500)
      .map(m => ({
        tmdb_id: Number.isFinite(Number(m.tmdb_id)) ? Number(m.tmdb_id) : null,
        reason: String(m.reason || '').slice(0, 60)
      }))
      .filter(m => m.tmdb_id);
  }
  const ids = normalizeIds(blockedIds, 500) || [];
  return ids.map(id => ({ tmdb_id: id, reason: '' }));
}

// KV expiration: permanent for static data, TTL for dynamic lists
function getKvTtl(path) {
  if (/\/movie\/\d+(\?|$)/.test(path) || /\/tv\/\d+(\?|$)/.test(path)) return null; // details: permanent
  if (/\/credits/.test(path)) return null; // credits: permanent
  if (/\/keywords/.test(path)) return null; // keywords: permanent
  if (/\/recommendations|\/similar/.test(path)) return 604800; // 7 days
  if (/\/discover|\/top_rated/.test(path)) return 604800;
  if (/\/search|\/trending/.test(path)) return 86400; // 1 day
  return 86400;
}

// Fetch TMDB data through L1(memory) → L2(KV) → L3(TMDB API)
async function fetchTmdb(path, env) {
  const tmdbKey = getTmdbKey(env);
  if (!tmdbKey) {
    return { success: false, status_code: 500, status_message: 'TMDB_API_KEY is not configured' };
  }
  const kvKey = 'p:' + path;

  // L1: memory
  const cached = cacheGet(kvKey);
  if (cached !== undefined) return cached;

  // L2: KV
  if (env && env.TMDB_CACHE) {
    try {
      const kvData = await env.TMDB_CACHE.get(kvKey, { type: 'json' });
      if (kvData) {
        cacheSet(kvKey, kvData);
        return kvData;
      }
    } catch(e) { /* KV miss, proceed to TMDB */ }
  }

  // L3: TMDB API
  const useBearerToken = isTmdbReadToken(tmdbKey);
  const sep = path.includes('?') ? '&' : '?';
  const url = useBearerToken ? TMDB_BASE + path : TMDB_BASE + path + sep + 'api_key=' + tmdbKey;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  let res;
  try {
    res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        ...(useBearerToken ? { 'Authorization': 'Bearer ' + tmdbKey } : {})
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({
    success: false,
    status_code: res.status,
    status_message: 'Invalid TMDB response',
  }));

  if (res.ok) {
    // Store in L1
    cacheSet(kvKey, data);

    // Store in L2 (KV) if available
    if (env && env.TMDB_CACHE) {
      const ttl = getKvTtl(path);
      const opts = ttl ? { expirationTtl: ttl } : {};
      try { await env.TMDB_CACHE.put(kvKey, JSON.stringify(data), opts); } catch(e) {}
    }
  }
  return res.ok ? data : {
    success: false,
    status_code: res.status,
    status_message: data.status_message || res.statusText || 'TMDB request failed',
  };
}

function normalizeTmdbMovieDetail(details, credits) {
  if (!details || details.success === false) return null;
  const director = (credits?.crew || []).find(c => c.job === 'Director');
  return {
    id: details.id || null,
    title: details.title || details.name || '',
    original_title: details.original_title || details.original_name || '',
    overview: details.overview || '',
    overview_missing: !details.overview,
    release_date: details.release_date || details.first_air_date || '',
    year: parseInt(String(details.release_date || details.first_air_date || '').slice(0, 4)) || null,
    poster_path: details.poster_path || '',
    genres: (details.genres || []).map(g => g.name).filter(Boolean),
    genre_ids: (details.genres || []).map(g => g.id).filter(Boolean),
    vote_average: details.vote_average || 0,
    vote_count: details.vote_count || 0,
    popularity: details.popularity || 0,
    runtime: details.runtime || 0,
    director: director ? director.name : '',
    cast: (credits?.cast || []).slice(0, 8).map(c => c.name).filter(Boolean),
    original_language: details.original_language || '',
    fetched_at: Date.now()
  };
}

async function fetchMovieDetailBundle(tmdbId, env) {
  const [detailsZh, creditsZh] = await Promise.all([
    fetchTmdb(`/movie/${tmdbId}?language=zh-CN`, env),
    fetchTmdb(`/movie/${tmdbId}/credits?language=zh-CN`, env)
  ]);
  if (detailsZh?.success === false) {
    return { details: detailsZh, credits: creditsZh, movie: null };
  }

  let details = detailsZh || {};
  const needsOverviewFallback = !details.overview;
  if (needsOverviewFallback) {
    const fallbacks = await Promise.allSettled([
      fetchTmdb(`/movie/${tmdbId}?language=zh-TW`, env),
      fetchTmdb(`/movie/${tmdbId}?language=en-US`, env)
    ]);
    const fallbackDetail = fallbacks
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .find(d => d && d.success !== false && d.overview);
    if (fallbackDetail) {
      details = {
        ...fallbackDetail,
        ...details,
        overview: fallbackDetail.overview,
        tagline: details.tagline || fallbackDetail.tagline || '',
        runtime: details.runtime || fallbackDetail.runtime || 0,
      };
    }
  }

  return {
    details,
    credits: creditsZh,
    movie: normalizeTmdbMovieDetail(details, creditsZh)
  };
}

// ── Scoring helpers ──
function getEntryTotalScore(entry) { return entry.total_score || 5; }
function jaccard(a, b) {
  if (!a.length || !b.length) return 0;
  const sa = new Set(a), sb = new Set(b);
  let intersection = 0;
  for (const v of sa) { if (sb.has(v)) intersection++; }
  return intersection / (sa.size + sb.size - intersection);
}

// Shared normalization (used by Phase1, Phase2, Final rescore)
function computeBaseScores(r, maxPop, maxVote, now) {
  const voteNorm = (r.vote_average || 0) / maxVote;
  const popNorm = Math.min((r.popularity || 0) / maxPop, 1);
  const releaseYear = parseInt((r.release_date || '').slice(0, 4)) || 0;
  const ageYears = releaseYear ? now.getFullYear() - releaseYear : 10;
  const freshness = ageYears <= 2 ? 1 : ageYears <= 5 ? 0.7 : ageYears <= 10 ? 0.35 : 0;
  const sourceNorm = (r._sourceScore || 5) / 10;
  return { voteNorm, popNorm, releaseYear, ageYears, freshness, sourceNorm };
}

function computeGenreScore(genreIds, sourceGenres, genrePref, jaccardWeight) {
  if (!sourceGenres.length || !genreIds.length) return 0;
  let score = jaccard(sourceGenres, genreIds);
  let prefBoost = 0;
  genreIds.forEach(g => { prefBoost += (genrePref[g] || 0); });
  const prefPart = Math.min(prefBoost / Math.max(genreIds.length, 1), 1);
  return score * jaccardWeight + prefPart * (1 - jaccardWeight);
}

function computeAffinityScore(candidateNames, topNames) {
  let score = 0;
  for (const name of candidateNames) {
    const idx = topNames.indexOf(name);
    if (idx >= 0) score = Math.max(score, 1 - idx / topNames.length);
  }
  return score;
}

function computeDecadeBonus(releaseYear, decadeProfile) {
  if (!releaseYear) return 0;
  const decade = Math.floor(releaseYear / 10) * 10;
  const decAvg = decadeProfile[decade];
  return decAvg !== undefined ? Math.min(decAvg / 10, 1) : 0.3;
}

function buildAvoidGenreSet(avoidSeeds) {
  const s = new Set();
  for (const seed of avoidSeeds) {
    (seed._fetchedGenres || []).forEach(g => s.add(g));
  }
  return s;
}

function buildAvoidKwSets(avoidSeeds) {
  return avoidSeeds.map(as => as._keywords?.length ? new Set(as._keywords) : null);
}

function computeAvoidPenalty(candidate, avoidSeeds, avoidGenreSet, fullGenres, candidateKeywords, avoidKwSets) {
  if (!avoidSeeds.length) return 0;
  let gOverlap = 0, kwOverlap = 0;
  for (let i = 0; i < avoidSeeds.length; i++) {
    const as = avoidSeeds[i];
    if (as._fetchedGenres && as._fetchedGenres.length && fullGenres && fullGenres.length) {
      const olap = fullGenres.filter(g => avoidGenreSet.has(g)).length;
      gOverlap = Math.max(gOverlap, olap / Math.max(as._fetchedGenres.length, 1));
    }
    if (candidateKeywords && candidateKeywords.length && avoidKwSets[i]) {
      const olap = candidateKeywords.filter(k => avoidKwSets[i].has(k)).length;
      kwOverlap = Math.max(kwOverlap, olap / Math.max(as._keywords.length, 1));
    }
  }
  const combinedOverlap = Math.max(gOverlap * 0.5 + kwOverlap * 0.5, gOverlap);
  return combinedOverlap > 0.4 ? Math.min(combinedOverlap * 0.15, 0.15) : 0;
}

function addWeighted(obj, key, weight) {
  if (key === undefined || key === null || key === '') return;
  obj[String(key)] = (obj[String(key)] || 0) + weight;
}

function getFeedbackFlags(reason) {
  const text = String(reason || '').trim().toLowerCase();
  const variant = /版本|翻拍|重制|重拍|改编|系列|续集|前传|衍生|同.?故事|其他版|remake|reboot|sequel|prequel|version/.test(text);
  const seen = /已看|看过|已阅|看了|seen|watched/.test(text);
  const tooPopular = /太热门|热门|爆款|网红|大众|跟风|popular|mainstream/.test(text);
  const tooObscure = /太冷门|冷门|小众|没人看|评分人数少|投票少|太糊|obscure|niche/.test(text);
  const tooOld = /太旧|老片|年代太久|古早|太老|old/.test(text);
  const director = /导演|主创|作者|director/.test(text);
  const genre = /类型|题材|风格|不喜欢|恐怖|血腥|爱情|动画|科幻|动作|喜剧|文艺|genre|style/.test(text);
  const hasReason = text.length > 0;
  return {
    hasReason,
    seenOnly: seen && !variant && !genre && !director && !tooPopular && !tooObscure && !tooOld,
    variant,
    tooPopular,
    tooObscure,
    tooOld,
    director,
    genre,
    general: hasReason && !seen,
  };
}

async function buildFeedbackProfile(blockedFeedback, env, advanced) {
  const profile = {
    count: 0,
    genreWeight: {},
    keywordWeight: {},
    directorWeight: {},
    tooPopular: 0,
    tooObscure: 0,
    tooOld: 0,
  };
  const actionable = (blockedFeedback || [])
    .map(item => ({ ...item, flags: getFeedbackFlags(item.reason) }))
    .filter(item => item.flags.hasReason && !item.flags.seenOnly)
    .slice(0, 40);

  if (!actionable.length) return profile;
  profile.count = actionable.length;

  await Promise.all(actionable.map(async item => {
    const flags = item.flags;
    if (flags.tooPopular) profile.tooPopular++;
    if (flags.tooObscure) profile.tooObscure++;
    if (flags.tooOld) profile.tooOld++;

    const movieSpecific = flags.genre || flags.variant || flags.director || (
      flags.general && !flags.tooPopular && !flags.tooObscure && !flags.tooOld
    );
    if (!movieSpecific) return;

    try {
      const [detail, credits, keywords] = await Promise.all([
        fetchTmdb(`/movie/${item.tmdb_id}?language=zh-CN`, env),
        flags.director ? fetchTmdb(`/movie/${item.tmdb_id}/credits?language=zh-CN`, env) : Promise.resolve(null),
        (advanced || flags.variant) ? fetchTmdb(`/movie/${item.tmdb_id}/keywords`, env) : Promise.resolve(null),
      ]);
      const baseWeight = flags.variant ? 0.75 : 1;
      if (flags.genre || flags.variant || flags.general) {
        (detail.genres || []).forEach(g => addWeighted(profile.genreWeight, g.id, baseWeight));
      }
      if ((flags.variant || flags.general) && keywords && keywords.keywords) {
        keywords.keywords.forEach(k => addWeighted(profile.keywordWeight, k.id, baseWeight));
      }
      if (flags.director && credits) {
        (credits.crew || [])
          .filter(c => c.job === 'Director')
          .forEach(c => addWeighted(profile.directorWeight, c.name, 1));
      }
    } catch (e) { /* feedback profile is best-effort */ }
  }));

  return profile;
}

function computeFeedbackPenalty(candidate, feedbackProfile, fullGenres, candidateKeywords, directors, releaseYear, popNorm) {
  if (!feedbackProfile || !feedbackProfile.count) return 0;
  let penalty = 0;

  const genres = (fullGenres || candidate.genre_ids || []).map(g => String(g));
  if (genres.length) {
    let genreHit = 0;
    genres.forEach(g => { genreHit += feedbackProfile.genreWeight[g] || 0; });
    penalty += Math.min(genreHit / Math.max(genres.length, 1), 1) * 0.10;
  }

  const keywords = (candidateKeywords || []).map(k => String(k));
  if (keywords.length) {
    let keywordHit = 0;
    keywords.forEach(k => { keywordHit += feedbackProfile.keywordWeight[k] || 0; });
    penalty += Math.min(keywordHit / Math.max(keywords.length, 1), 1) * 0.08;
  }

  if (directors && directors.length) {
    const directorHit = directors.some(name => feedbackProfile.directorWeight[String(name)]);
    if (directorHit) penalty += 0.12;
  }

  const feedbackScale = n => Math.min(n / Math.max(feedbackProfile.count, 1), 1);
  if (feedbackProfile.tooPopular && popNorm > 0.65) {
    penalty += feedbackScale(feedbackProfile.tooPopular) * Math.min((popNorm - 0.65) / 0.35, 1) * 0.08;
  }
  if (feedbackProfile.tooObscure && ((candidate.vote_count || 0) < 120 || popNorm < 0.12)) {
    const obscurity = (candidate.vote_count || 0) < 120 ? 1 : Math.min((0.12 - popNorm) / 0.12, 1);
    penalty += feedbackScale(feedbackProfile.tooObscure) * obscurity * 0.08;
  }
  if (feedbackProfile.tooOld && releaseYear) {
    const age = new Date().getFullYear() - releaseYear;
    if (age > 15) penalty += feedbackScale(feedbackProfile.tooOld) * Math.min((age - 15) / 35, 1) * 0.08;
  }

  return Math.min(penalty, 0.24);
}

// ── User profile builder ──
async function buildUserProfile(scored, env, advanced) {
  const profileSize = advanced ? 40 : 15;
  const topRated = scored.filter(e => e.tmdb_id).slice(0, profileSize);
  const keywordWeight = {};     // keyword_id → weighted score sum
  const genreWeight = {};       // genre_id → weighted score sum
  const directorWeight = {};    // director_name → weighted score sum
  const actorWeight = {};       // actor_name → weighted score sum
  const decadeScores = {};      // decade → {total, count}
  const langWeight = {};        // language → weighted score
  let totalWeight = 0;

  await Promise.all(topRated.map(async e => {
    const w = e.score;
    try {
      const [detail, credits, keywords] = await Promise.all([
        fetchTmdb(`/movie/${e.tmdb_id}?language=zh-CN`, env),
        fetchTmdb(`/movie/${e.tmdb_id}/credits?language=zh-CN`, env),
        advanced ? fetchTmdb(`/movie/${e.tmdb_id}/keywords`, env) : Promise.resolve(null)
      ]);
      // Genres
      (detail.genres || []).forEach(g => {
        genreWeight[g.id] = (genreWeight[g.id] || 0) + w;
      });
      // Credits: directors + actors
      if (credits) {
        (credits.crew || []).filter(c => c.job === 'Director').forEach(c => {
          directorWeight[c.name] = (directorWeight[c.name] || 0) + w;
        });
        (credits.cast || []).slice(0, 5).forEach(c => {
          actorWeight[c.name] = (actorWeight[c.name] || 0) + w;
        });
      }
      // Keywords (advanced only)
      if (keywords && keywords.keywords) {
        keywords.keywords.forEach(k => {
          keywordWeight[k.id] = (keywordWeight[k.id] || 0) + w;
        });
      }
      // Decade
      const yr = parseInt((detail.release_date || '').slice(0, 4));
      if (yr) {
        const decade = Math.floor(yr / 10) * 10;
        if (!decadeScores[decade]) decadeScores[decade] = { total: 0, count: 0 };
        decadeScores[decade].total += w;
        decadeScores[decade].count++;
      }
      // Language
      if (detail.original_language) {
        langWeight[detail.original_language] = (langWeight[detail.original_language] || 0) + w;
      }
      totalWeight += w;
    } catch (e) { /* skip problematic movie */ }
  }));

  // Normalize to preference scores
  const norm = (obj, topN) => {
    const entries = Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);
    const max = entries.length ? entries[0][1] : 1;
    return Object.fromEntries(entries.map(([k, v]) => [k, v / max]));
  };

  const decadeProfile = {};
  for (const [dec, v] of Object.entries(decadeScores)) {
    decadeProfile[dec] = v.count ? v.total / v.count : 5;
  }

  const topLang = Object.entries(langWeight).sort((a, b) => b[1] - a[1])[0];
  const langPref = topLang ? topLang[0] : null;

  return {
    genrePref: norm(genreWeight, 12),
    keywordPref: advanced ? norm(keywordWeight, 30) : {},
    topKeywords: advanced ? Object.keys(norm(keywordWeight, 30)) : [],
    topDirectors: Object.keys(norm(directorWeight, advanced ? 8 : 3)),
    topActors: advanced ? Object.keys(norm(actorWeight, 10)) : [],
    decadeProfile,
    langPref,
    totalWeight
  };
}

// ── Seed selection ──
function selectSeeds(scored, partnerMovies, advanced) {
  const high = scored.filter(e => e.score >= 8);
  const mid = scored.filter(e => e.score >= 6 && e.score < 8);
  const low = scored.filter(e => e.score < 4);

  const highCnt = advanced ? 5 : 4;
  const midCnt = advanced ? 3 : 2;
  const hiPicks = high.slice(0, highCnt);
  const shuffledMid = [...mid].sort(() => Math.random() - 0.5);
  const midPicks = shuffledMid.slice(0, midCnt);

  // Recency seed: most recently rated high-score movie
  const recentHi = [...high].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))[0];
  const hasRecency = recentHi && !hiPicks.some(s => s.tmdb_id === recentHi.tmdb_id);

  let seeds = [...hiPicks, ...midPicks];
  if (hasRecency) seeds.push({ ...recentHi, _isRecency: true });

  // Partner seed (advanced only)
  if (advanced && partnerMovies.length) {
    const partnerScored = partnerMovies
      .map(e => ({ ...e, score: getEntryTotalScore(e) }))
      .sort((a, b) => b.score - a.score);
    const partnerHi = partnerScored.filter(e => e.score >= 8);
    if (partnerHi.length) {
      const pPick = partnerHi[Math.floor(Math.random() * Math.min(partnerHi.length, 5))];
      if (!seeds.some(s => s.tmdb_id === pPick.tmdb_id)) {
        seeds.push({ ...pPick, _isPartnerSeed: true });
      }
    }
  }

  // Avoid seeds
  const shuffledLow = [...low].sort(() => Math.random() - 0.5);
  const avoidSeeds = advanced ? shuffledLow.slice(0, 2) : [];

  seeds.sort(() => Math.random() - 0.5);
  return { seeds, avoidSeeds };
}

// ── Fetch genres+keywords for seeds / profile movies ──
async function enrichEntries(entries, env, advanced) {
  await Promise.all(entries.map(async e => {
    if (e._fetchedGenres) return;
    try {
      const [detail, keywords] = await Promise.all([
        fetchTmdb(`/movie/${e.tmdb_id}?language=zh-CN`, env),
        advanced ? fetchTmdb(`/movie/${e.tmdb_id}/keywords`, env) : Promise.resolve(null)
      ]);
      e._fetchedGenres = (detail.genres || []).map(g => g.id);
      e._detail = detail;
      if (keywords && keywords.keywords) {
        e._keywords = keywords.keywords.map(k => k.id);
      }
    } catch (e) { e._fetchedGenres = []; }
  }));
}

// ── Candidate collection ──
async function collectCandidates(seeds, profile, partnerProfile, env, advanced, ratedKeys, blockedKeys) {
  const allRecs = [];
  const seen = new Set();

  const addRecs = (results, sourceEntry, route) => {
    if (!results) return;
    for (const r of results) {
      const key = 'tmdb_' + r.id;
      if (seen.has(key) || ratedKeys.has(key) || (blockedKeys && blockedKeys.has(key))) continue;
      seen.add(key);
      r._sourceScore = sourceEntry ? sourceEntry.score : 0;
      r._sourceGenres = sourceEntry ? (sourceEntry._fetchedGenres || []) : [];
      r._route = route;
      allRecs.push(r);
    }
  };

  // Route 1: Per-seed recommendations + similar (all seeds in parallel)
  await Promise.all(seeds.map(async seed => {
    const fetches = [
      fetchTmdb(`/movie/${seed.tmdb_id}/recommendations?language=zh-CN&page=1`, env).catch(() => null),
      fetchTmdb(`/movie/${seed.tmdb_id}/similar?language=zh-CN&page=1`, env).catch(() => null),
    ];
    if (advanced) {
      fetches.push(fetchTmdb(`/movie/${seed.tmdb_id}/recommendations?language=zh-CN&page=2`, env).catch(() => null));
    }
    const results = await Promise.all(fetches);
    if (results[0]) addRecs(results[0].results, seed, 'rec');
    if (results[1]) addRecs(results[1].results, seed, 'similar');
    if (advanced && results[2]) addRecs(results[2].results, seed, 'rec2');
  }));

  // Routes 2-8: Run all discovery routes in parallel
  const routePromises = [];

  // Route 2: Genre discovery
  const topGenres = Object.keys(profile.genrePref).slice(0, 4);
  for (let i = 0; i < topGenres.length; i += 2) {
    const pair = topGenres.slice(i, i + 2).join(',');
    routePromises.push(
      fetchTmdb(`/discover/movie?language=zh-CN&with_genres=${pair}&sort_by=vote_average.desc&vote_count.gte=100&page=1`, env)
        .then(d => addRecs(d.results, null, 'genre')).catch(() => {})
    );
  }

  // Route 3: Keyword discovery (advanced only)
  if (advanced && profile.topKeywords.length) {
    const kwBatches = [];
    for (let i = 0; i < Math.min(profile.topKeywords.length, 15); i += 3) {
      kwBatches.push(profile.topKeywords.slice(i, i + 3).join('|'));
    }
    for (const kw of kwBatches.slice(0, 5)) {
      routePromises.push(
        fetchTmdb(`/discover/movie?language=zh-CN&with_keywords=${kw}&sort_by=vote_average.desc&vote_count.gte=50&page=1`, env)
          .then(d => addRecs(d.results, null, 'keyword')).catch(() => {})
      );
    }
  }

  // Route 4: Quality pool
  const qualVotes = advanced ? 300 : 200;
  routePromises.push(
    fetchTmdb(`/discover/movie?language=zh-CN&sort_by=vote_average.desc&vote_count.gte=${qualVotes}&page=1`, env)
      .then(d => addRecs(d.results, null, 'quality')).catch(() => {})
  );

  // Route 5: Director search (each director in parallel)
  const dirCount = advanced ? 5 : 2;
  for (const dir of profile.topDirectors.slice(0, dirCount)) {
    routePromises.push(
      fetchTmdb(`/search/movie?language=zh-CN&query=${encodeURIComponent(dir)}&page=1`, env)
        .then(d => addRecs(d.results, null, 'director')).catch(() => {})
    );
  }

  // Route 6: Actor discovery (advanced only)
  if (advanced && profile.topActors.length) {
    for (const actor of profile.topActors.slice(0, 5)) {
      routePromises.push((async () => {
        try {
          const personRes = await fetchTmdb(`/search/person?query=${encodeURIComponent(actor)}`, env);
          const personId = personRes.results?.[0]?.id;
          if (personId) {
            const d = await fetchTmdb(`/discover/movie?language=zh-CN&with_cast=${personId}&sort_by=vote_average.desc&vote_count.gte=50&page=1`, env);
            addRecs(d.results, null, 'actor');
          }
        } catch (e) { }
      })());
    }
  }

  // Route 7: Language discovery (advanced)
  if (advanced && profile.langPref && profile.langPref !== 'en') {
    routePromises.push(
      fetchTmdb(`/discover/movie?language=zh-CN&with_original_language=${profile.langPref}&sort_by=vote_average.desc&vote_count.gte=50&page=1`, env)
        .then(d => addRecs(d.results, null, 'language')).catch(() => {})
    );
  }

  // Route 8: Partner seed recommendations (advanced)
  if (advanced && partnerProfile) {
    const pSeeds = seeds.filter(s => s._isPartnerSeed).slice(0, 1);
    for (const ps of pSeeds) {
      routePromises.push(
        fetchTmdb(`/movie/${ps.tmdb_id}/recommendations?language=zh-CN&page=1`, env)
          .then(d => addRecs(d.results, ps, 'partner_rec')).catch(() => {})
      );
    }
  }

  await Promise.all(routePromises);

  return allRecs;
}

// ── Phase 1: cheap scoring using list-response data (genre_ids only) ──
function scorePhase1(candidates, profile, avoidSeeds, advanced, feedbackProfile) {
  const maxPop = Math.max(...candidates.map(r => r.popularity || 0), 1);
  const maxVote = Math.max(...candidates.map(r => r.vote_average || 0), 1);
  const now = new Date();

  const avoidGenreSet = buildAvoidGenreSet(avoidSeeds);

  candidates.forEach(r => {
    const { voteNorm, popNorm, releaseYear, freshness, sourceNorm } = computeBaseScores(r, maxPop, maxVote, now);

    const genreScore = computeGenreScore(r.genre_ids || [], r._sourceGenres || [], profile.genrePref, 0.7);
    const decadeBonus = computeDecadeBonus(releaseYear, profile.decadeProfile);

    // Director bonus (cheap: route-based)
    const directorBonus = r._route === 'director' ? 0.8 : 0;

    // Explore bonus: reward genres outside user's top preferences
    let exploreBonus = 0;
    if (advanced && r.genre_ids) {
      const unfamiliar = r.genre_ids.filter(g => !(g in profile.genrePref));
      exploreBonus = Math.min(unfamiliar.length / Math.max(r.genre_ids.length, 1), 1) * 0.3;
    }

    // Avoid penalty (genre-only in Phase1)
    let avoidPenalty = 0;
    if (avoidSeeds.length && r.genre_ids) {
      for (const as of avoidSeeds) {
        if (!as._fetchedGenres || !as._fetchedGenres.length) continue;
        const overlap = r.genre_ids.filter(g => avoidGenreSet.has(g)).length;
        const ratio = overlap / Math.max(as._fetchedGenres.length, 1);
        if (ratio > 0.5) avoidPenalty = Math.max(avoidPenalty, 0.12 * ratio);
      }
    }

    const feedbackPenalty = computeFeedbackPenalty(r, feedbackProfile, r.genre_ids || [], null, [], releaseYear, popNorm);

    if (advanced) {
      r._score = 0.22 * genreScore + 0.18 * voteNorm + 0.15 * sourceNorm + 0.13 * decadeBonus
                + 0.10 * directorBonus + 0.08 * popNorm + 0.07 * freshness + 0.07 * exploreBonus - avoidPenalty - feedbackPenalty;
    } else {
      r._score = 0.28 * genreScore + 0.20 * voteNorm + 0.18 * sourceNorm + 0.12 * decadeBonus
                + 0.10 * directorBonus + 0.07 * popNorm + 0.05 * freshness - feedbackPenalty;
    }
  });
}

// ── Phase 2: enrich top candidates with full details + rescore ──
async function enrichAndScorePhase2(candidates, profile, partnerProfile, avoidSeeds, advanced, feedbackProfile, env) {
  if (!candidates.length) return;

  const avoidGenreSet = buildAvoidGenreSet(avoidSeeds);
  const avoidKwSets = buildAvoidKwSets(avoidSeeds);

  // Build partner keyword set
  const partnerKeywordSet = new Set(partnerProfile ? partnerProfile.topKeywords : []);
  const partnerGenreSet = new Set(partnerProfile ? Object.keys(partnerProfile.genrePref) : []);

  // Enrich all candidates with detail + credits (keywords deferred to after MMR)
  await Promise.all(candidates.map(async r => {
    try {
      const [detail, credits] = await Promise.all([
        fetchTmdb(`/movie/${r.id}?language=zh-CN`, env),
        advanced ? fetchTmdb(`/movie/${r.id}/credits?language=zh-CN`, env) : Promise.resolve(null),
      ]);
      r._detail = detail;
      r._credits = credits;
    } catch (e) { /* skip */ }
  }));

  // Rescore
  const maxPop = Math.max(...candidates.map(r => r.popularity || 0), 1);
  const maxVote = Math.max(...candidates.map(r => r.vote_average || 0), 1);
  const now = new Date();

  candidates.forEach(r => {
    const { voteNorm, popNorm, releaseYear, freshness, sourceNorm } = computeBaseScores(r, maxPop, maxVote, now);

    // Keyword match (may not be available in Phase2)
    let kwScore = 0;
    if (r._keywords && r._keywords.length && profile.topKeywords.length) {
      kwScore = jaccard(r._keywords, profile.topKeywords);
    }

    const fullGenres = r._detail ? (r._detail.genres || []).map(g => g.id) : (r.genre_ids || []);
    const genreScore = computeGenreScore(fullGenres, r._sourceGenres || [], profile.genrePref, 0.6);

    // Director affinity
    const dirs = (r._credits && profile.topDirectors.length)
      ? (r._credits.crew || []).filter(c => c.job === 'Director').map(c => c.name)
      : [];
    const dirScore = computeAffinityScore(dirs, profile.topDirectors);

    // Actor affinity
    const cast = (r._credits && profile.topActors && profile.topActors.length)
      ? (r._credits.cast || []).slice(0, 5).map(c => c.name)
      : [];
    const actorScore = computeAffinityScore(cast, profile.topActors || []);

    const decadeBonus = computeDecadeBonus(releaseYear, profile.decadeProfile);

    // Partner signal
    let partnerSignal = 0;
    if (partnerProfile && r._keywords) {
      const pKwOverlap = r._keywords.filter(k => partnerKeywordSet.has(k)).length;
      const pGenreOverlap = fullGenres.filter(g => partnerGenreSet.has(g)).length;
      partnerSignal = Math.min((pKwOverlap / Math.max(r._keywords.length, 1)) * 0.5 +
                               (pGenreOverlap / Math.max(fullGenres.length, 1)) * 0.5, 1) * 0.07;
    }

    const avoidPenalty = computeAvoidPenalty(r, avoidSeeds, avoidGenreSet, fullGenres, r._keywords, avoidKwSets);
    const feedbackPenalty = computeFeedbackPenalty(r, feedbackProfile, fullGenres, r._keywords, dirs, releaseYear, popNorm);

    if (advanced) {
      // Phase 2 scoring without keywords (added after MMR in final rescore)
      r._score = 0.18 * genreScore + 0.14 * voteNorm + 0.12 * dirScore
               + 0.12 * sourceNorm + 0.11 * actorScore + 0.11 * decadeBonus
               + 0.06 * Math.min(r._detail && r._detail.original_language === profile.langPref ? 1 : 0.3, 1)
               + 0.05 * popNorm + 0.06 * freshness - avoidPenalty - feedbackPenalty;
    } else {
      // Phase 2 scoring without keywords (added after MMR in final rescore)
      r._score = 0.26 * genreScore + 0.21 * voteNorm + 0.18 * sourceNorm
               + 0.14 * dirScore + 0.10 * decadeBonus + 0.06 * popNorm + 0.05 * freshness - feedbackPenalty;
    }
  });
}

// ── MMR diversity re-ranking ──
function mmrRerank(candidates, targetCount, lambda) {
  if (candidates.length <= targetCount) return candidates;
  const selected = [];
  const remaining = [...candidates];

  while (remaining.length > 0 && selected.length < targetCount) {
    let bestIdx = 0, bestMMR = -Infinity;

    for (let i = 0; i < Math.min(remaining.length, 200); i++) {
      const relevance = remaining[i]._score || 0;
      let maxSim = 0;

      for (const s of selected.slice(-15)) {
        const gSim = jaccard(remaining[i].genre_ids || [], s.genre_ids || []);
        const kwSim = (remaining[i]._keywords && s._keywords)
          ? jaccard(remaining[i]._keywords, s._keywords) : 0;
        maxSim = Math.max(maxSim, Math.max(gSim, kwSim));
      }

      const mmr = lambda * relevance - (1 - lambda) * maxSim;
      if (mmr > bestMMR) { bestMMR = mmr; bestIdx = i; }
    }

    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  return selected;
}

// ── Exploration budget (advanced mode) ──
function applyExplorationBudget(selected, allCandidates, profile, targetCount) {
  const exploreCount = Math.max(Math.floor(targetCount * 0.15), 3);
  const selectedSet = new Set(selected.map(s => s.id));

  // Find candidates outside user's comfort zone
  const explorers = allCandidates
    .filter(c => !selectedSet.has(c.id))
    .map(c => {
      let novelty = 0;
      // Bonus for genres the user doesn't usually watch
      if (c.genre_ids) {
        c.genre_ids.forEach(g => { if (!(g in profile.genrePref)) novelty += 0.3; });
      }
      // Bonus for older decades
      const yr = parseInt((c.release_date || '').slice(0, 4)) || 0;
      if (yr) {
        const decade = Math.floor(yr / 10) * 10;
        const decAvg = profile.decadeProfile[decade];
        if (decAvg === undefined || decAvg < 5) novelty += 0.3;
      }
      // Bonus for high quality
      if ((c.vote_average || 0) >= 7.5) novelty += 0.2;
      return { ...c, _novelty: novelty + (c._score || 0) * 0.5 };
    })
    .sort((a, b) => b._novelty - a._novelty)
    .slice(0, exploreCount);

  // Replace last exploreCount items with explorers
  const result = selected.slice(0, targetCount - exploreCount);
  return [...result, ...explorers];
}

// ── Recommendation engine ──
function attachRecommendationReasons(movies, profile, partnerProfile) {
  const routeLabels = {
    rec: '来自你的高分片相似推荐',
    rec2: '来自你的高分片延展推荐',
    similar: '和你喜欢的电影类型相近',
    genre: '符合你的常看类型',
    keyword: '命中你的偏好关键词',
    quality: '高口碑候选',
    director: '贴近你喜欢的创作者',
    actor: '贴近你喜欢的演员阵容',
    language: '符合你常看的语种',
    partner_rec: '结合朋友的高分片偏好',
  };
  const partnerGenres = partnerProfile ? new Set(Object.keys(partnerProfile.genrePref)) : null;
  return movies.map(m => {
    const reasons = [];
    if (routeLabels[m._route]) reasons.push(routeLabels[m._route]);
    if ((m._sourceScore || 0) >= 8) reasons.push('源自你给过高分的片');
    const releaseYear = parseInt((m.release_date || '').slice(0, 4));
    if (releaseYear) {
      const decade = Math.floor(releaseYear / 10) * 10;
      if ((profile.decadeProfile[decade] || 0) >= 7) reasons.push(`${decade}s 是你的高分年代`);
    }
    if (m._detail?.original_language && m._detail.original_language === profile.langPref) {
      reasons.push('语种偏好匹配');
    }
    if (partnerGenres && (m.genre_ids || []).some(g => partnerGenres.has(String(g)))) {
      reasons.push('也贴近朋友的类型偏好');
    }
    return {
      id: m.id,
      title: m.title,
      original_title: m.original_title,
      overview: m.overview,
      release_date: m.release_date,
      poster_path: m.poster_path,
      genre_ids: m.genre_ids || [],
      vote_average: m.vote_average || 0,
      vote_count: m.vote_count || 0,
      popularity: m.popularity || 0,
      original_language: m.original_language,
      reasons: [...new Set(reasons)].slice(0, 3),
    };
  });
}

// ── Post-MMR: enrich final pool with keywords and compute final scores ──
async function enrichKeywordsAndFinalScore(final, profile, partnerProfile, avoidSeeds, advanced, feedbackProfile, env) {
  if (!final.length) return;

  // Fetch keywords for all final candidates
  await Promise.all(final.map(async r => {
    try {
      const kw = await fetchTmdb(`/movie/${r.id}/keywords`, env);
      r._keywords = kw ? (kw.keywords || []).map(k => k.id) : [];
    } catch (e) { r._keywords = []; }
  }));

  // Build sets for partner / avoid calculations
  const partnerKeywordSet = new Set(partnerProfile ? partnerProfile.topKeywords : []);
  const partnerGenreSet = new Set(partnerProfile ? Object.keys(partnerProfile.genrePref) : []);
  const avoidGenreSet = buildAvoidGenreSet(avoidSeeds);
  const avoidKwSets = buildAvoidKwSets(avoidSeeds);

  const maxPop = Math.max(...final.map(r => r.popularity || 0), 1);
  const maxVote = Math.max(...final.map(r => r.vote_average || 0), 1);
  const now = new Date();

  final.forEach(r => {
    const { voteNorm, popNorm, releaseYear, freshness, sourceNorm } = computeBaseScores(r, maxPop, maxVote, now);

    // Keyword match (now available)
    let kwScore = 0;
    if (r._keywords && r._keywords.length && profile.topKeywords.length) {
      kwScore = jaccard(r._keywords, profile.topKeywords);
    }

    const fullGenres = r._detail ? (r._detail.genres || []).map(g => g.id) : (r.genre_ids || []);
    const genreScore = computeGenreScore(fullGenres, r._sourceGenres || [], profile.genrePref, 0.6);

    // Director affinity
    const dirs = (r._credits && profile.topDirectors.length)
      ? (r._credits.crew || []).filter(c => c.job === 'Director').map(c => c.name)
      : [];
    const dirScore = computeAffinityScore(dirs, profile.topDirectors);

    // Actor affinity
    const cast = (r._credits && profile.topActors && profile.topActors.length)
      ? (r._credits.cast || []).slice(0, 5).map(c => c.name)
      : [];
    const actorScore = computeAffinityScore(cast, profile.topActors || []);

    const decadeBonus = computeDecadeBonus(releaseYear, profile.decadeProfile);

    // Partner signal
    let partnerSignal = 0;
    if (partnerProfile && r._keywords) {
      const pKwOverlap = r._keywords.filter(k => partnerKeywordSet.has(k)).length;
      const pGenreOverlap = fullGenres.filter(g => partnerGenreSet.has(g)).length;
      partnerSignal = Math.min((pKwOverlap / Math.max(r._keywords.length, 1)) * 0.5 +
                               (pGenreOverlap / Math.max(fullGenres.length, 1)) * 0.5, 1) * 0.07;
    }

    const avoidPenalty = computeAvoidPenalty(r, avoidSeeds, avoidGenreSet, fullGenres, r._keywords, avoidKwSets);
    const feedbackPenalty = computeFeedbackPenalty(r, feedbackProfile, fullGenres, r._keywords, dirs, releaseYear, popNorm);

    // Full scoring WITH keywords
    if (advanced) {
      r._score = 0.16 * kwScore + 0.13 * genreScore + 0.12 * voteNorm + 0.10 * dirScore
               + 0.10 * sourceNorm + 0.09 * actorScore + 0.09 * decadeBonus + partnerSignal
               + 0.05 * Math.min(r._detail && r._detail.original_language === profile.langPref ? 1 : 0.3, 1)
               + 0.04 * popNorm + 0.05 * freshness - avoidPenalty - feedbackPenalty;
    } else {
      r._score = 0.18 * kwScore + 0.20 * genreScore + 0.17 * voteNorm + 0.15 * sourceNorm
               + 0.12 * dirScore + 0.08 * decadeBonus + 0.05 * popNorm + 0.05 * freshness - feedbackPenalty;
    }
  });

  final.sort((a, b) => b._score - a._score);
}

async function loadRecommendations(env, entries, userId, blockedIds, excludeIds, blockedFeedback) {
  const myMovies = entries.filter(e => e.user_id === userId && e.tmdb_id && e.type === 'movie');
  const totalRated = entries.filter(e => e.user_id === userId && e.type === 'movie').length;

  if (totalRated < 25) return { movies: null, totalRated };

  const scored = myMovies.map(e => ({ ...e, score: getEntryTotalScore(e) })).sort((a, b) => b.score - a.score);
  if (!scored.length) return { movies: [], totalRated };

  const advanced = totalRated >= 100;

  // Phase 0: Build profiles
  const partnerId = entries.find(e => e.user_id !== userId && e.tmdb_id)?.user_id;
  const partnerMovies = partnerId
    ? entries.filter(e => e.user_id === partnerId && e.tmdb_id && e.type === 'movie')
    : [];

  const [profile, partnerProfile, feedbackProfile] = await Promise.all([
    buildUserProfile(scored, env, advanced),
    partnerId ? buildUserProfile(
      partnerMovies.map(e => ({ ...e, score: getEntryTotalScore(e) })).sort((a, b) => b.score - a.score),
      env, false
    ) : Promise.resolve(null),
    buildFeedbackProfile(blockedFeedback, env, advanced)
  ]);

  // Phase 1: Select seeds
  const { seeds, avoidSeeds } = selectSeeds(scored, partnerMovies, advanced);

  // Enrich seeds with genres (+ keywords for advanced)
  const allSeeds = [...seeds, ...avoidSeeds];
  await enrichEntries(allSeeds, env, advanced);

  // Phase 2: Collect candidates
  const ratedKeys = new Set(myMovies.filter(e => e.tmdb_id).map(e => 'tmdb_' + e.tmdb_id));
  const blockedKeys = blockedIds && blockedIds.length
    ? new Set(blockedIds.map(id => 'tmdb_' + id))
    : new Set();
  const candidates = await collectCandidates(seeds, profile, partnerProfile, env, advanced, ratedKeys, blockedKeys);

  if (!candidates.length) return { movies: [], totalRated };

  // Phase 3: Cheap scoring
  scorePhase1(candidates, profile, avoidSeeds, advanced, feedbackProfile);
  candidates.sort((a, b) => b._score - a._score);

  // Phase 4+5: Enrich top pool and rescore
  const enrichCount = advanced ? 60 : 20;
  const topPool = candidates.slice(0, enrichCount);

  // Also enrich avoid seeds if they're in the pool
  await enrichEntries(avoidSeeds.filter(s => s.tmdb_id), env, advanced);

  await enrichAndScorePhase2(topPool, profile, partnerProfile, avoidSeeds, advanced, feedbackProfile, env);
  topPool.sort((a, b) => b._score - a._score);

  // Phase 6: MMR diversity (using Phase2 scores without keywords)
  const finalCount = advanced ? 60 : 30;
  const lambda = advanced ? 0.7 : 0.75;
  let final = mmrRerank(topPool, Math.min(finalCount, topPool.length), lambda);

  // Phase 7: Exploration budget (advanced only)
  if (advanced && candidates.length > finalCount) {
    final = applyExplorationBudget(final, candidates, profile, finalCount);
  }

  // Phase 8: Enrich final pool with keywords and compute full scores
  await enrichKeywordsAndFinalScore(final, profile, partnerProfile, avoidSeeds, advanced, feedbackProfile, env);

  // Filter out previously shown movies (freshness)
  if (excludeIds && excludeIds.length) {
    const excludeSet = new Set(excludeIds);
    final = final.filter(m => !excludeSet.has(m.id));
  }
  final = attachRecommendationReasons(final, profile, partnerProfile);
  return { movies: final.slice(0, finalCount), totalRated };
}

// Cache key for recommendations
function makeRecKey(userId, entries, blockedIds, excludeIds, blockedFeedback) {
  const movieIds = entries
    .filter(e => e.user_id === userId && e.type === 'movie' && e.tmdb_id)
    .map(e => e.tmdb_id + ':' + (e.total_score || 0))
    .sort()
    .join(',');
  let hash = 0;
  for (let i = 0; i < movieIds.length; i++) {
    hash = ((hash << 5) - hash) + movieIds.charCodeAt(i);
    hash |= 0;
  }
  // Include blocked IDs in cache key so blocking invalidates cache
  const blockedHash = blockedIds && blockedIds.length
    ? 'b:' + [...blockedIds].sort((a, b) => a - b).join(',')
    : '';
  // Include exclude IDs so freshness rotation gets distinct cache entries
  const excludeHash = excludeIds && excludeIds.length
    ? 'x:' + [...excludeIds].sort((a, b) => a - b).join(',')
    : '';
  // Include free-text feedback in cache key so changing "not interested" reasons recalculates scores
  const feedbackHash = blockedFeedback && blockedFeedback.length
    ? 'f:' + blockedFeedback
        .map(m => `${m.tmdb_id}:${String(m.reason || '').trim()}`)
        .sort()
        .join('|')
    : '';
  let keyBase = REC_CACHE_VERSION + '-' + userId + '-' + movieIds.length + '-' + hash;
  if (blockedHash) {
    let bh = 0;
    for (let i = 0; i < blockedHash.length; i++) {
      bh = ((bh << 5) - bh) + blockedHash.charCodeAt(i);
      bh |= 0;
    }
    keyBase += '-b' + bh;
  }
  if (excludeHash) {
    let xh = 0;
    for (let i = 0; i < excludeHash.length; i++) {
      xh = ((xh << 5) - xh) + excludeHash.charCodeAt(i);
      xh |= 0;
    }
    keyBase += '-x' + xh;
  }
  if (feedbackHash) {
    let fh = 0;
    for (let i = 0; i < feedbackHash.length; i++) {
      fh = ((fh << 5) - fh) + feedbackHash.charCodeAt(i);
      fh |= 0;
    }
    keyBase += '-f' + fh;
  }
  return keyBase;
}

// ── Main Worker ──
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        memCache: memCache.size,
        tmdbKeyConfigured: !!getTmdbKey(env),
        tmdbAuthMode: isTmdbReadToken(getTmdbKey(env)) ? 'bearer' : 'api_key',
        kvConfigured: !!(env && env.TMDB_CACHE),
        allowedOrigins: getAllowedOrigins(env),
        recCacheVersion: REC_CACHE_VERSION,
        ts: Date.now()
      }, request, env);
    }

    // ── TMDB Proxy ──
    if (url.pathname.startsWith('/tmdb/')) {
      const tmdbPath = url.pathname.replace('/tmdb', '') + url.search;
      const data = await fetchTmdb(tmdbPath, env);
      const status = data.success === false && data.status_code >= 400 ? data.status_code : 200;
      return jsonResponse(data, request, env, status);
    }

    // ── Combined detail+credits endpoint ──
    const detailMatch = url.pathname.match(/^\/detail\/(\d+)$/);
    if (detailMatch && request.method === 'GET') {
      const tmdbId = parseInt(detailMatch[1]);
      const { details, credits, movie } = await fetchMovieDetailBundle(tmdbId, env);
      if (!movie) {
        const statusCode = details?.status_code;
        const status = statusCode >= 400 && statusCode <= 599 ? statusCode : 502;
        return errorResponse(details?.status_message || 'TMDB detail not found', request, env, status);
      }
      if (url.searchParams.get('raw') === '1') {
        return jsonResponse({ movie, details, credits }, request, env);
      }
      return jsonResponse({ movie }, request, env);
    }

    // ── Prefetch endpoint (warm KV for movie details + credits) ──
    if (url.pathname === '/prefetch' && request.method === 'POST') {
      try {
        const body = await readJsonBody(request);
        const unique = normalizeIds(body.tmdb_ids, MAX_PREFETCH_IDS);
        if (!unique) {
          return errorResponse('Missing or invalid tmdb_ids', request, env, 400);
        }
        const returnOverviews = body.return_overviews === true;
        let cached = 0, errors = 0;
        const overviews = {};
        const details = {};

        for (let i = 0; i < unique.length; i += 5) {
          const batch = unique.slice(i, i + 5);
          const results = await Promise.allSettled(
            batch.map(id => fetchMovieDetailBundle(id, env))
          );
          results.forEach(r => { r.status === 'fulfilled' ? cached++ : errors++; });
          if (returnOverviews) {
            for (let j = 0; j < batch.length; j++) {
              const detailResult = results[j];
              if (detailResult.status === 'fulfilled') {
                const movie = detailResult.value.movie;
                if (movie) {
                  details[batch[j]] = movie;
                  if (movie.overview) overviews[batch[j]] = movie.overview;
                }
              }
            }
          }
        }

        const resp = { cached, errors, total: unique.length };
        if (returnOverviews) {
          resp.overviews = overviews;
          resp.details = details;
        }
        return jsonResponse(resp, request, env);
      } catch (e) {
        const status = e.message === 'Request body too large' ? 413 : 500;
        return errorResponse(e.message, request, env, status);
      }
    }

    // ── Batch original_title endpoint ──
    if (url.pathname === '/titles' && request.method === 'POST') {
      try {
        const body = await readJsonBody(request);
        const unique = normalizeIds(body.tmdb_ids, MAX_TITLE_IDS);
        if (!unique) {
          return errorResponse('Missing or invalid tmdb_ids', request, env, 400);
        }
        const results = {};
        await Promise.all(unique.map(async id => {
          try {
            const detail = await fetchTmdb(`/movie/${id}?language=zh-CN`, env);
            if (detail && detail.original_title) results[id] = detail.original_title;
          } catch (e) {}
        }));
        return jsonResponse({ results }, request, env);
      } catch (e) {
        const status = e.message === 'Request body too large' ? 413 : 500;
        return errorResponse(e.message, request, env, status);
      }
    }

    // ── Batch credits endpoint (en + zh) ──
    if (url.pathname === '/credits' && request.method === 'POST') {
      try {
        const body = await readJsonBody(request);
        const unique = normalizeIds(body.tmdb_ids, MAX_CREDIT_IDS);
        if (!unique) {
          return errorResponse('Missing or invalid tmdb_ids', request, env, 400);
        }
        const results = {};
        for (let i = 0; i < unique.length; i += 5) {
          const batch = unique.slice(i, i + 5);
          await Promise.allSettled(batch.map(async id => {
            try {
              const [creditsEn, creditsZh] = await Promise.all([
                fetchTmdb(`/movie/${id}/credits`, env),
                fetchTmdb(`/movie/${id}/credits?language=zh-CN`, env)
              ]);
              const directorEn = (creditsEn.crew || []).find(c => c.job === 'Director');
              const castEn = (creditsEn.cast || []).slice(0, 6).map(c => c.name);
              const directorZh = (creditsZh.crew || []).find(c => c.job === 'Director');
              const castZh = (creditsZh.cast || []).slice(0, 6).map(c => c.name);
              results[id] = {
                d: directorEn ? directorEn.name : '',
                c: castEn.join('|'),
                d_zh: directorZh ? directorZh.name : '',
                c_zh: castZh.join('|')
              };
            } catch (e) {}
          }));
        }
        return jsonResponse({ results }, request, env);
      } catch (e) {
        const status = e.message === 'Request body too large' ? 413 : 500;
        return errorResponse(e.message, request, env, status);
      }
    }

    // ── Trending endpoint ──
    if (url.pathname === '/trending' && request.method === 'GET') {
      const data = await fetchTmdb('/trending/movie/week?language=zh-CN', env);
      const results = (data.results || []).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 12);
      return jsonResponse({ results }, request, env);
    }

    // ── Top Rated endpoint ──
    if (url.pathname === '/toprated' && request.method === 'GET') {
      const results = [];
      for (let page = 1; page <= 10 && results.length < 100; page++) {
        const data = await fetchTmdb(`/movie/top_rated?language=zh-CN&page=${page}`, env);
        if (data.results && data.results.length) {
          data.results.forEach(r => { if ((r.vote_count || 0) >= 500) results.push(r); });
        } else break;
      }
      return jsonResponse({ results: results.slice(0, 100) }, request, env);
    }

    // ── Search endpoint (with auto-credits for director) ──
    if (url.pathname === '/search' && request.method === 'GET') {
      const q = url.searchParams.get('q');
      const type = url.searchParams.get('type') || 'movie';
      if (!q) {
        return errorResponse('Missing query', request, env, 400);
      }
      if (!['movie', 'tv'].includes(type)) {
        return errorResponse('Invalid search type', request, env, 400);
      }
      if (q.length > 80) {
        return errorResponse('Query is too long', request, env, 400);
      }
      const data = await fetchTmdb(`/search/${type}?query=${encodeURIComponent(q)}&language=zh-CN`, env);
      return jsonResponse(data, request, env);
    }

    // ── Recommendation endpoint ──
    if (url.pathname === '/recommend' && request.method === 'POST') {
      try {
        const body = await readJsonBody(request);
        const { entries, userId, blockedIds, blockedMovies, excludeIds } = body;
        const cleanEntries = sanitizeEntries(entries);
        const cleanBlockedFeedback = sanitizeBlockedFeedback(blockedMovies, blockedIds);
        const cleanBlockedIds = cleanBlockedFeedback.map(m => m.tmdb_id);
        const cleanExcludeIds = Array.isArray(excludeIds) ? normalizeIds(excludeIds, 200) || [] : [];

        if (!cleanEntries || !userId) {
          return errorResponse('Missing entries or userId', request, env, 400);
        }

        const recKey = makeRecKey(userId, cleanEntries, cleanBlockedIds, cleanExcludeIds, cleanBlockedFeedback);
        const cacheKeyUrl = 'https://rec-cache.local/recommend/' + recKey;
        const cacheKey = new Request(cacheKeyUrl, { method: 'GET' });
        const cache = caches.default;

        // Check Cache API
        let cachedRes = await cache.match(cacheKey);
        if (cachedRes) {
          const data = await cachedRes.json();
          return jsonResponse({ ...data, cached: true }, request, env, 200, { 'X-Rec-Cache': 'HIT' });
        }

        const result = await loadRecommendations(env, cleanEntries, userId, cleanBlockedIds, cleanExcludeIds, cleanBlockedFeedback);

        if (result.movies) {
          const resToCache = new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
          });
          ctx.waitUntil(cache.put(cacheKey, resToCache));
        }

        return jsonResponse({ ...result, cached: false }, request, env, 200, { 'X-Rec-Cache': 'MISS' });
      } catch (e) {
        const status = e.message === 'Request body too large' ? 413 : 500;
        return errorResponse(e.message, request, env, status);
      }
    }

    return new Response('FilmNote Worker', { status: 404, headers: corsHeaders(request, env) });
  },
};
