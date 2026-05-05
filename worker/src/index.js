// FilmNote Cloudflare Worker — TMDB proxy + recommendation + KV persistence
const TMDB_KEY = 'bedbd15b921f0127d7d8921337ea5a06';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const GENRE_MAP = {
  28:'动作',12:'冒险',16:'动画',35:'喜剧',80:'犯罪',99:'纪录',18:'剧情',10751:'家庭',
  14:'奇幻',36:'历史',27:'恐怖',10402:'音乐',9648:'悬疑',10749:'爱情',878:'科幻',
  10770:'电视电影',53:'惊悚',10752:'战争',37:'西部'
};

// L1 memory cache (fast, isolate-scoped)
const memCache = new Map();
const MEM_MAX = 500;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// KV expiration: permanent for static data, TTL for dynamic lists
function getKvTtl(path) {
  if (/\/movie\/\d+$|\/tv\/\d+$/.test(path)) return null; // details: permanent
  if (/\/credits/.test(path)) return null; // credits: permanent
  if (/\/keywords/.test(path)) return null; // keywords: permanent
  if (/\/recommendations|\/similar/.test(path)) return 604800; // 7 days
  if (/\/discover|\/top_rated/.test(path)) return 604800;
  if (/\/search|\/trending/.test(path)) return 86400; // 1 day
  return 86400;
}

// Fetch TMDB data through L1(memory) → L2(KV) → L3(TMDB API)
async function fetchTmdb(path, env) {
  const kvKey = 'p:' + path;

  // L1: memory
  if (memCache.has(kvKey)) return memCache.get(kvKey);

  // L2: KV
  if (env && env.TMDB_CACHE) {
    try {
      const kvData = await env.TMDB_CACHE.get(kvKey, { type: 'json' });
      if (kvData) {
        if (memCache.size >= MEM_MAX) memCache.delete(memCache.keys().next().value);
        memCache.set(kvKey, kvData);
        return kvData;
      }
    } catch(e) { /* KV miss, proceed to TMDB */ }
  }

  // L3: TMDB API
  const sep = path.includes('?') ? '&' : '?';
  const url = TMDB_BASE + path + sep + 'api_key=' + TMDB_KEY;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  const data = await res.json();

  if (res.ok) {
    // Store in L1
    if (memCache.size >= MEM_MAX) memCache.delete(memCache.keys().next().value);
    memCache.set(kvKey, data);

    // Store in L2 (KV) if available
    if (env && env.TMDB_CACHE) {
      const ttl = getKvTtl(path);
      const opts = ttl ? { expirationTtl: ttl } : {};
      try { await env.TMDB_CACHE.put(kvKey, JSON.stringify(data), opts); } catch(e) {}
    }
  }
  return data;
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
async function collectCandidates(seeds, profile, partnerProfile, env, advanced, ratedKeys) {
  const allRecs = [];
  const seen = new Set();

  const addRecs = (results, sourceEntry, route) => {
    if (!results) return;
    for (const r of results) {
      const key = 'tmdb_' + r.id;
      if (seen.has(key) || ratedKeys.has(key)) continue;
      seen.add(key);
      r._sourceScore = sourceEntry ? sourceEntry.score : 0;
      r._sourceGenres = sourceEntry ? (sourceEntry._fetchedGenres || []) : [];
      r._route = route;
      allRecs.push(r);
    }
  };

  // Route 1: Per-seed recommendations + similar
  for (const seed of seeds) {
    try {
      const d = await fetchTmdb(`/movie/${seed.tmdb_id}/recommendations?language=zh-CN&page=1`, env);
      addRecs(d.results, seed, 'rec');
    } catch (e) { }
    try {
      const d = await fetchTmdb(`/movie/${seed.tmdb_id}/similar?language=zh-CN&page=1`, env);
      addRecs(d.results, seed, 'similar');
    } catch (e) { }
    if (advanced) {
      try {
        const d = await fetchTmdb(`/movie/${seed.tmdb_id}/recommendations?language=zh-CN&page=2`, env);
        addRecs(d.results, seed, 'rec2');
      } catch (e) { }
    }
  }

  // Route 2: Genre discovery
  const topGenres = Object.keys(profile.genrePref).slice(0, 4);
  for (let i = 0; i < topGenres.length; i += 2) {
    const pair = topGenres.slice(i, i + 2).join(',');
    try {
      const d = await fetchTmdb(`/discover/movie?language=zh-CN&with_genres=${pair}&sort_by=vote_average.desc&vote_count.gte=100&page=1`, env);
      addRecs(d.results, null, 'genre');
    } catch (e) { }
  }

  // Route 3: Keyword discovery (advanced only)
  if (advanced && profile.topKeywords.length) {
    const kwBatches = [];
    for (let i = 0; i < Math.min(profile.topKeywords.length, 15); i += 3) {
      kwBatches.push(profile.topKeywords.slice(i, i + 3).join('|'));
    }
    for (const kw of kwBatches.slice(0, 5)) {
      try {
        const d = await fetchTmdb(`/discover/movie?language=zh-CN&with_keywords=${kw}&sort_by=vote_average.desc&vote_count.gte=50&page=1`, env);
        addRecs(d.results, null, 'keyword');
      } catch (e) { }
    }
  }

  // Route 4: Quality pool
  const qualVotes = advanced ? 300 : 200;
  try {
    const d = await fetchTmdb(`/discover/movie?language=zh-CN&sort_by=vote_average.desc&vote_count.gte=${qualVotes}&page=1`, env);
    addRecs(d.results, null, 'quality');
  } catch (e) { }

  // Route 5: Director search
  const dirCount = advanced ? 5 : 2;
  for (const dir of profile.topDirectors.slice(0, dirCount)) {
    try {
      const d = await fetchTmdb(`/search/movie?language=zh-CN&query=${encodeURIComponent(dir)}&page=1`, env);
      addRecs(d.results, null, 'director');
    } catch (e) { }
  }

  // Route 6: Actor discovery (advanced only)
  if (advanced && profile.topActors.length) {
    for (const actor of profile.topActors.slice(0, 5)) {
      try {
        const personRes = await fetchTmdb(`/search/person?query=${encodeURIComponent(actor)}`, env);
        const personId = personRes.results?.[0]?.id;
        if (personId) {
          const d = await fetchTmdb(`/discover/movie?language=zh-CN&with_cast=${personId}&sort_by=vote_average.desc&vote_count.gte=50&page=1`, env);
          addRecs(d.results, null, 'actor');
        }
      } catch (e) { }
    }
  }

  // Route 7: Language discovery (advanced)
  if (advanced && profile.langPref && profile.langPref !== 'en') {
    try {
      const d = await fetchTmdb(`/discover/movie?language=zh-CN&with_original_language=${profile.langPref}&sort_by=vote_average.desc&vote_count.gte=50&page=1`, env);
      addRecs(d.results, null, 'language');
    } catch (e) { }
  }

  // Route 8: Partner seed recommendations (advanced)
  if (advanced && partnerProfile) {
    const pSeeds = seeds.filter(s => s._isPartnerSeed).slice(0, 1);
    for (const ps of pSeeds) {
      try {
        const d = await fetchTmdb(`/movie/${ps.tmdb_id}/recommendations?language=zh-CN&page=1`, env);
        addRecs(d.results, ps, 'partner_rec');
      } catch (e) { }
    }
  }

  return allRecs;
}

// ── Phase 1: cheap scoring using list-response data (genre_ids only) ──
function scorePhase1(candidates, profile, avoidSeeds, advanced) {
  const maxPop = Math.max(...candidates.map(r => r.popularity || 0), 1);
  const maxVote = Math.max(...candidates.map(r => r.vote_average || 0), 1);
  const now = new Date();

  // Build avoid-genre set
  const avoidGenreSet = new Set();
  avoidSeeds.forEach(s => {
    (s._fetchedGenres || []).forEach(g => avoidGenreSet.add(g));
  });

  candidates.forEach(r => {
    const voteNorm = (r.vote_average || 0) / maxVote;
    const popNorm = Math.min((r.popularity || 0) / maxPop, 1);
    const releaseYear = parseInt((r.release_date || '').slice(0, 4)) || 0;
    const ageYears = releaseYear ? now.getFullYear() - releaseYear : 10;
    const freshness = ageYears <= 2 ? 1 : ageYears <= 5 ? 0.7 : ageYears <= 10 ? 0.35 : 0;
    const sourceNorm = (r._sourceScore || 5) / 10;

    // Genre match: Jaccard with seed's genres, weighted by user genre preference
    let genreScore = 0;
    if (r._sourceGenres.length && r.genre_ids) {
      genreScore = jaccard(r._sourceGenres, r.genre_ids);
      // Boost by user genre preference weight
      let prefBoost = 0;
      r.genre_ids.forEach(g => { prefBoost += (profile.genrePref[g] || 0); });
      genreScore = genreScore * 0.7 + Math.min(prefBoost / Math.max(r.genre_ids.length, 1), 1) * 0.3;
    }

    // Decade
    let decadeBonus = 0;
    if (releaseYear) {
      const decade = Math.floor(releaseYear / 10) * 10;
      const decAvg = profile.decadeProfile[decade];
      decadeBonus = decAvg !== undefined ? Math.min(decAvg / 10, 1) : 0.3;
    }

    // Director bonus (cheap: route-based)
    const directorBonus = r._route === 'director' ? 0.8 : 0;

    // Explore bonus: reward genres outside user's top preferences
    let exploreBonus = 0;
    if (advanced && r.genre_ids) {
      const unfamiliar = r.genre_ids.filter(g => !(g in profile.genrePref));
      exploreBonus = Math.min(unfamiliar.length / Math.max(r.genre_ids.length, 1), 1) * 0.3;
    }

    // Avoid penalty
    let avoidPenalty = 0;
    if (avoidSeeds.length && r.genre_ids) {
      for (const as of avoidSeeds) {
        if (!as._fetchedGenres || !as._fetchedGenres.length) continue;
        const overlap = r.genre_ids.filter(g => avoidGenreSet.has(g)).length;
        const ratio = overlap / Math.max(as._fetchedGenres.length, 1);
        if (ratio > 0.5) avoidPenalty = Math.max(avoidPenalty, 0.12 * ratio);
      }
    }

    if (advanced) {
      r._score = 0.22 * genreScore + 0.18 * voteNorm + 0.15 * sourceNorm + 0.13 * decadeBonus
                + 0.10 * directorBonus + 0.08 * popNorm + 0.07 * freshness + 0.07 * exploreBonus - avoidPenalty;
    } else {
      r._score = 0.28 * genreScore + 0.20 * voteNorm + 0.18 * sourceNorm + 0.12 * decadeBonus
                + 0.10 * directorBonus + 0.07 * popNorm + 0.05 * freshness;
    }
  });
}

// ── Phase 2: enrich top candidates with full details + rescore ──
async function enrichAndScorePhase2(candidates, profile, partnerProfile, avoidSeeds, advanced) {
  if (!candidates.length) return;

  const avoidGenreSet = new Set();
  avoidSeeds.forEach(s => { (s._fetchedGenres || []).forEach(g => avoidGenreSet.add(g)); });

  // Build partner keyword set
  const partnerKeywordSet = new Set(partnerProfile ? partnerProfile.topKeywords : []);
  const partnerGenreSet = new Set(partnerProfile ? Object.keys(partnerProfile.genrePref) : []);

  // Enrich all candidates
  await Promise.all(candidates.map(async r => {
    try {
      const [detail, credits, keywords] = await Promise.all([
        fetchTmdb(`/movie/${r.id}?language=zh-CN`, env),
        advanced ? fetchTmdb(`/movie/${r.id}/credits?language=zh-CN`, env) : Promise.resolve(null),
        fetchTmdb(`/movie/${r.id}/keywords`, env)
      ]);
      r._detail = detail;
      r._credits = credits;
      r._keywords = keywords ? (keywords.keywords || []).map(k => k.id) : [];
    } catch (e) { r._keywords = []; }
  }));

  // Rescore
  const maxPop = Math.max(...candidates.map(r => r.popularity || 0), 1);
  const maxVote = Math.max(...candidates.map(r => r.vote_average || 0), 1);
  const now = new Date();

  candidates.forEach(r => {
    const voteNorm = (r.vote_average || 0) / maxVote;
    const popNorm = Math.min((r.popularity || 0) / maxPop, 1);
    const releaseYear = parseInt((r.release_date || '').slice(0, 4)) || 0;
    const ageYears = releaseYear ? now.getFullYear() - releaseYear : 10;
    const freshness = ageYears <= 2 ? 1 : ageYears <= 5 ? 0.7 : ageYears <= 10 ? 0.35 : 0;
    const sourceNorm = (r._sourceScore || 5) / 10;

    // Keyword match: Jaccard with user's top keywords
    let kwScore = 0;
    if (r._keywords && r._keywords.length && profile.topKeywords.length) {
      kwScore = jaccard(r._keywords, profile.topKeywords);
    }

    // Genre match with full genre data
    let genreScore = 0;
    const fullGenres = r._detail ? (r._detail.genres || []).map(g => g.id) : (r.genre_ids || []);
    if (fullGenres.length && r._sourceGenres.length) {
      genreScore = jaccard(fullGenres, r._sourceGenres);
      let prefBoost = 0;
      fullGenres.forEach(g => { prefBoost += (profile.genrePref[g] || 0); });
      genreScore = genreScore * 0.6 + Math.min(prefBoost / Math.max(fullGenres.length, 1), 1) * 0.4;
    }

    // Director affinity: check if candidate director is in user's top directors
    let dirScore = 0;
    if (r._credits && profile.topDirectors.length) {
      const dirs = (r._credits.crew || []).filter(c => c.job === 'Director').map(c => c.name);
      for (const d of dirs) {
        const idx = profile.topDirectors.indexOf(d);
        if (idx >= 0) { dirScore = Math.max(dirScore, 1 - idx / profile.topDirectors.length); }
      }
    }

    // Actor affinity
    let actorScore = 0;
    if (r._credits && profile.topActors && profile.topActors.length) {
      const cast = (r._credits.cast || []).slice(0, 5).map(c => c.name);
      for (const a of cast) {
        const idx = profile.topActors.indexOf(a);
        if (idx >= 0) { actorScore = Math.max(actorScore, 1 - idx / profile.topActors.length); }
      }
    }

    // Decade
    let decadeBonus = 0;
    if (releaseYear) {
      const decade = Math.floor(releaseYear / 10) * 10;
      const decAvg = profile.decadeProfile[decade];
      decadeBonus = decAvg !== undefined ? Math.min(decAvg / 10, 1) : 0.3;
    }

    // Partner signal
    let partnerSignal = 0;
    if (partnerProfile && r._keywords) {
      const pKwOverlap = r._keywords.filter(k => partnerKeywordSet.has(k)).length;
      const pGenreOverlap = fullGenres.filter(g => partnerGenreSet.has(g)).length;
      partnerSignal = Math.min((pKwOverlap / Math.max(r._keywords.length, 1)) * 0.5 +
                               (pGenreOverlap / Math.max(fullGenres.length, 1)) * 0.5, 1) * 0.07;
    }

    // Avoid penalty (genre + keyword overlap with avoid seeds)
    let avoidPenalty = 0;
    if (avoidSeeds.length) {
      let gOverlap = 0, kwOverlap = 0;
      for (const as of avoidSeeds) {
        if (as._fetchedGenres && as._fetchedGenres.length && fullGenres.length) {
          const olap = fullGenres.filter(g => avoidGenreSet.has(g)).length;
          gOverlap = Math.max(gOverlap, olap / Math.max(as._fetchedGenres.length, 1));
        }
        if (as._keywords && as._keywords.length && r._keywords && r._keywords.length) {
          const asKwSet = new Set(as._keywords);
          const olap = r._keywords.filter(k => asKwSet.has(k)).length;
          kwOverlap = Math.max(kwOverlap, olap / Math.max(as._keywords.length, 1));
        }
      }
      const combinedOverlap = Math.max(gOverlap * 0.5 + kwOverlap * 0.5, gOverlap);
      if (combinedOverlap > 0.4) avoidPenalty = Math.min(combinedOverlap * 0.15, 0.15);
    }

    if (advanced) {
      r._score = 0.16 * kwScore + 0.13 * genreScore + 0.12 * voteNorm + 0.10 * dirScore
               + 0.10 * sourceNorm + 0.09 * actorScore + 0.09 * decadeBonus + partnerSignal
               + 0.05 * Math.min(r._detail && r._detail.original_language === profile.langPref ? 1 : 0.3, 1)
               + 0.04 * popNorm + 0.05 * freshness - avoidPenalty;
    } else {
      r._score = 0.18 * kwScore + 0.20 * genreScore + 0.17 * voteNorm + 0.15 * sourceNorm
               + 0.12 * dirScore + 0.08 * decadeBonus + 0.05 * popNorm + 0.05 * freshness;
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
async function loadRecommendations(env, entries, userId) {
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

  const [profile, partnerProfile] = await Promise.all([
    buildUserProfile(scored, env, advanced),
    partnerId ? buildUserProfile(
      partnerMovies.map(e => ({ ...e, score: getEntryTotalScore(e) })).sort((a, b) => b.score - a.score),
      env, false
    ) : Promise.resolve(null)
  ]);

  // Phase 1: Select seeds
  const { seeds, avoidSeeds } = selectSeeds(scored, partnerMovies, advanced);

  // Enrich seeds with genres (+ keywords for advanced)
  const allSeeds = [...seeds, ...avoidSeeds];
  await enrichEntries(allSeeds, env, advanced);

  // Phase 2: Collect candidates
  const ratedKeys = new Set(myMovies.filter(e => e.tmdb_id).map(e => 'tmdb_' + e.tmdb_id));
  const candidates = await collectCandidates(seeds, profile, partnerProfile, env, advanced, ratedKeys);

  if (!candidates.length) return { movies: [], totalRated };

  // Phase 3: Cheap scoring
  scorePhase1(candidates, profile, avoidSeeds, advanced);
  candidates.sort((a, b) => b._score - a._score);

  // Phase 4+5: Enrich top pool and rescore
  const enrichCount = advanced ? 80 : 30;
  const topPool = candidates.slice(0, enrichCount);

  // Also enrich avoid seeds if they're in the pool
  await enrichEntries(avoidSeeds.filter(s => s.tmdb_id), env, advanced);

  await enrichAndScorePhase2(topPool, profile, partnerProfile, avoidSeeds, advanced);
  topPool.sort((a, b) => b._score - a._score);

  // Phase 6: MMR diversity
  const finalCount = advanced ? 60 : 30;
  const lambda = advanced ? 0.7 : 0.75;
  let final = mmrRerank(topPool, Math.min(finalCount, topPool.length), lambda);

  // Phase 7: Exploration budget (advanced only)
  if (advanced && candidates.length > finalCount) {
    final = applyExplorationBudget(final, candidates, profile, finalCount);
  }

  return { movies: final.slice(0, finalCount), totalRated };
}

// Cache key for recommendations
function makeRecKey(userId, entries) {
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
  return userId + '-' + movieIds.length + '-' + hash;
}

// ── Main Worker ──
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', memCache: memCache.size, ts: Date.now() }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // ── TMDB Proxy ──
    if (url.pathname.startsWith('/tmdb/')) {
      const tmdbPath = url.pathname.replace('/tmdb', '') + url.search;
      const data = await fetchTmdb(tmdbPath, env);
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // ── Prefetch endpoint (warm KV for movie details + credits) ──
    if (url.pathname === '/prefetch' && request.method === 'POST') {
      try {
        const body = await request.json();
        const ids = body.tmdb_ids;
        if (!Array.isArray(ids) || !ids.length) {
          return new Response(JSON.stringify({ error: 'Missing or invalid tmdb_ids' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
          });
        }
        const unique = [...new Set(ids.filter(id => Number.isFinite(id) && id > 0))];
        let cached = 0, errors = 0;

        for (let i = 0; i < unique.length; i += 5) {
          const batch = unique.slice(i, i + 5);
          const results = await Promise.allSettled(
            batch.flatMap(id => [
              fetchTmdb(`/movie/${id}?language=zh-CN`, env),
              fetchTmdb(`/movie/${id}/credits?language=zh-CN`, env),
              fetchTmdb(`/movie/${id}/keywords`, env)
            ])
          );
          results.forEach(r => { r.status === 'fulfilled' ? cached++ : errors++; });
        }

        return new Response(JSON.stringify({ cached, errors, total: unique.length }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }
    }

    // ── Trending endpoint ──
    if (url.pathname === '/trending' && request.method === 'GET') {
      const data = await fetchTmdb('/trending/movie/week?language=zh-CN', env);
      const results = (data.results || []).sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 12);
      return new Response(JSON.stringify({ results }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
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
      return new Response(JSON.stringify({ results: results.slice(0, 100) }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // ── Search endpoint (with auto-credits for director) ──
    if (url.pathname === '/search' && request.method === 'GET') {
      const q = url.searchParams.get('q');
      const type = url.searchParams.get('type') || 'movie';
      if (!q) {
        return new Response(JSON.stringify({ error: 'Missing query' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }
      const data = await fetchTmdb(`/search/${type}?query=${encodeURIComponent(q)}&language=zh-CN`, env);
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // ── Recommendation endpoint ──
    if (url.pathname === '/recommend' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { entries, userId } = body;

        if (!entries || !userId) {
          return new Response(JSON.stringify({ error: 'Missing entries or userId' }), {
            status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
          });
        }

        const recKey = makeRecKey(userId, entries);
        const cacheKeyUrl = 'https://rec-cache.local/recommend/' + recKey;
        const cacheKey = new Request(cacheKeyUrl, { method: 'GET' });
        const cache = caches.default;

        // Check Cache API
        let cachedRes = await cache.match(cacheKey);
        if (cachedRes) {
          const data = await cachedRes.json();
          return new Response(JSON.stringify({ ...data, cached: true }), {
            headers: { 'Content-Type': 'application/json', 'X-Rec-Cache': 'HIT', ...corsHeaders() },
          });
        }

        const result = await loadRecommendations(env, entries, userId);

        if (result.movies) {
          const resToCache = new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
          });
          ctx.waitUntil(cache.put(cacheKey, resToCache));
        }

        return new Response(JSON.stringify({ ...result, cached: false }), {
          headers: { 'Content-Type': 'application/json', 'X-Rec-Cache': 'MISS', ...corsHeaders() },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
        });
      }
    }

    return new Response('FilmNote Worker', { status: 404, headers: corsHeaders() });
  },
};
