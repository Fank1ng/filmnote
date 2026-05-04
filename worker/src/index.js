// FilmNote Cloudflare Worker — TMDB API proxy + recommendation engine
const TMDB_KEY = 'bedbd15b921f0127d7d8921337ea5a06';
const TMDB_BASE = 'https://api.themoviedb.org/3';

const GENRE_MAP = {
  28:'动作',12:'冒险',16:'动画',35:'喜剧',80:'犯罪',99:'纪录',18:'剧情',10751:'家庭',
  14:'奇幻',36:'历史',27:'恐怖',10402:'音乐',9648:'悬疑',10749:'爱情',878:'科幻',
  10770:'电视电影',53:'惊悚',10752:'战争',37:'西部'
};

// ── Memory caches ──
const tmdbCache = new Map();
const MAX_CACHE = 500;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

// ── TMDB fetch helper ──
async function cachedTmdbFetch(urlStr) {
  if (tmdbCache.has(urlStr)) {
    const entry = tmdbCache.get(urlStr);
    if (Date.now() - entry.ts < entry.ttl) return entry.data;
    tmdbCache.delete(urlStr);
  }
  const res = await fetch(urlStr, { headers: { 'Accept': 'application/json' } });
  const data = await res.json();
  if (res.ok) {
    const ttl = getCacheTtl(urlStr);
    if (tmdbCache.size >= MAX_CACHE) tmdbCache.delete(tmdbCache.keys().next().value);
    tmdbCache.set(urlStr, { data, ts: Date.now(), ttl });
  }
  return data;
}

function getCacheTtl(url) {
  if (/\/credits|recommendations|similar|top_rated/.test(url)) return 86400000;
  if (/\/movie\/\d+$|\/tv\/\d+$/.test(url)) return 86400000;
  return 3600000;
}

// ── Scoring helpers ──
function getEntryTotalScore(entry) {
  return entry.total_score || 5;
}

// ── Recommendation engine ──
async function loadRecommendations(entries, userId) {
  const myMovies = entries.filter(e => e.user_id === userId && e.tmdb_id && e.type === 'movie');
  const totalRated = entries.filter(e => e.user_id === userId && e.type === 'movie').length;

  if (totalRated < 25) return { movies: null, totalRated };

  const scored = myMovies.map(e => ({ ...e, score: getEntryTotalScore(e) })).sort((a, b) => b.score - a.score);
  if (!scored.length) return { movies: [], totalRated };

  const advanced = totalRated >= 100;

  // Seed selection
  let seeds, avoidSeeds = [];
  if (advanced) {
    const highScore = scored.filter(e => e.score >= 8).slice(0, 5);
    const midScore = scored.filter(e => e.score >= 6 && e.score < 8);
    const shuffledMid = [...midScore].sort(() => Math.random() - 0.5);
    const midPicks = shuffledMid.slice(0, 3);
    const lowScore = scored.filter(e => e.score < 4);
    const shuffledLow = [...lowScore].sort(() => Math.random() - 0.5);
    avoidSeeds = shuffledLow.slice(0, 2);
    seeds = [...highScore, ...midPicks];
  } else {
    const highScore = scored.filter(e => e.score >= 8).slice(0, 3);
    const midScore = scored.filter(e => e.score >= 6 && e.score < 8);
    const shuffled = [...midScore].sort(() => Math.random() - 0.5);
    const randomPicks = shuffled.slice(0, 2);
    seeds = [...highScore, ...randomPicks];
  }
  seeds.sort(() => Math.random() - 0.5);

  // Fetch genre info for all seeds in parallel
  const seedGenres = {};
  const allSeeds = [...seeds, ...avoidSeeds];
  await Promise.all(allSeeds.map(async seed => {
    try {
      const url = `${TMDB_BASE}/movie/${seed.tmdb_id}?api_key=${TMDB_KEY}&language=zh-CN`;
      const d = await cachedTmdbFetch(url);
      seedGenres[seed.tmdb_id] = (d.genres || []).map(g => g.id);
      seed._fetchedGenres = seedGenres[seed.tmdb_id];
    } catch (e) { seed._fetchedGenres = []; }
  }));

  const userGenreSig = new Set();
  Object.values(seedGenres).forEach(arr => arr.forEach(g => userGenreSig.add(g)));

  const avoidGenreSet = new Set();
  avoidSeeds.forEach(s => { if (s._fetchedGenres) s._fetchedGenres.forEach(g => avoidGenreSet.add(g)); });

  // Advanced: build user profile
  let topDirectors = [], decadeProfile = {};
  if (advanced) {
    const topRated = scored.filter(e => e.tmdb_id).slice(0, 30);
    const directorCount = {};
    const decadeScores = {};
    await Promise.all(topRated.map(async e => {
      try {
        const url = `${TMDB_BASE}/movie/${e.tmdb_id}?api_key=${TMDB_KEY}&language=zh-CN`;
        const d = await cachedTmdbFetch(url);
        if (d.credits && d.credits.crew) {
          d.credits.crew.filter(c => c.job === 'Director').forEach(c => {
            directorCount[c.name] = (directorCount[c.name] || 0) + 1;
          });
        }
        const yr = parseInt((d.release_date || '').slice(0, 4));
        if (yr) {
          const decade = Math.floor(yr / 10) * 10;
          if (!decadeScores[decade]) decadeScores[decade] = { total: 0, count: 0 };
          decadeScores[decade].total += e.score;
          decadeScores[decade].count++;
        }
        (d.genres || []).forEach(g => userGenreSig.add(g.id));
      } catch (e) { }
    }));
    topDirectors = Object.entries(directorCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
    for (const [dec, v] of Object.entries(decadeScores)) {
      decadeProfile[dec] = v.count ? v.total / v.count : 5;
    }
  }

  // Candidate collection
  const allRecs = [];
  const seen = new Set();
  const ratedKeys = new Set(myMovies.filter(e => e.tmdb_id).map(e => 'tmdb_' + e.tmdb_id));
  const addRecs = (results, sourceEntry) => {
    for (const r of results) {
      const key = 'tmdb_' + r.id;
      if (seen.has(key) || ratedKeys.has(key)) continue;
      seen.add(key);
      r._sourceScore = sourceEntry ? sourceEntry.score : 0;
      r._sourceGenres = sourceEntry ? (sourceEntry._fetchedGenres || sourceEntry.genre_ids || []) : [];
      allRecs.push(r);
    }
  };

  for (const seed of seeds) {
    try {
      const url1 = `${TMDB_BASE}/movie/${seed.tmdb_id}/recommendations?api_key=${TMDB_KEY}&language=zh-CN&page=1`;
      const d1 = await cachedTmdbFetch(url1);
      if (d1.results) addRecs(d1.results, seed);
    } catch (e) { }
    if (advanced) {
      try {
        const url1b = `${TMDB_BASE}/movie/${seed.tmdb_id}/recommendations?api_key=${TMDB_KEY}&language=zh-CN&page=2`;
        const d1b = await cachedTmdbFetch(url1b);
        if (d1b.results) addRecs(d1b.results, seed);
      } catch (e) { }
    }
    try {
      const url2 = `${TMDB_BASE}/movie/${seed.tmdb_id}/similar?api_key=${TMDB_KEY}&language=zh-CN&page=1`;
      const d2 = await cachedTmdbFetch(url2);
      if (d2.results) addRecs(d2.results, seed);
    } catch (e) { }
  }

  try {
    const dUrl = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&language=zh-CN&sort_by=vote_average.desc&vote_count.gte=200&page=1`;
    const dData = await cachedTmdbFetch(dUrl);
    if (dData.results) addRecs(dData.results, null);
  } catch (e) { }

  if (advanced && topDirectors.length) {
    for (const dir of topDirectors.slice(0, 3)) {
      try {
        const sUrl = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&language=zh-CN&query=${encodeURIComponent(dir)}&page=1`;
        const sd = await cachedTmdbFetch(sUrl);
        if (sd.results) addRecs(sd.results, null);
      } catch (e) { }
    }
  }

  if (!allRecs.length) return { movies: [], totalRated };

  // Scoring
  const maxPop = Math.max(...allRecs.map(r => r.popularity || 0), 1);
  const maxVote = Math.max(...allRecs.map(r => r.vote_average || 0), 1);
  const now = new Date();

  allRecs.forEach(r => {
    const voteNorm = (r.vote_average || 0) / maxVote;
    const popNorm = (r.popularity || 0) / maxPop;
    const releaseYear = parseInt((r.release_date || '').slice(0, 4)) || 0;
    const ageYears = releaseYear ? now.getFullYear() - releaseYear : 10;
    const freshnessBonus = ageYears <= 2 ? 1 : ageYears <= 5 ? 0.7 : ageYears <= 10 ? 0.35 : 0;
    const sourceScoreNorm = (r._sourceScore || 5) / 10;

    let genreMatch = 0;
    if (r._sourceGenres && r._sourceGenres.length && r.genre_ids) {
      const srcSet = new Set(r._sourceGenres);
      const matchCount = r.genre_ids.filter(g => srcSet.has(g)).length;
      genreMatch = Math.min(matchCount / (r._sourceGenres.length || 1), 1);
    }

    if (advanced) {
      let decadeBonus = 0;
      if (releaseYear) {
        const decade = Math.floor(releaseYear / 10) * 10;
        decadeBonus = decadeProfile[decade] !== undefined ? Math.min(decadeProfile[decade] / 10, 1) : 0.3;
      }
      let avoidPenalty = 0;
      if (avoidSeeds.length && r.genre_ids) {
        for (const as of avoidSeeds) {
          if (!as._fetchedGenres || !as._fetchedGenres.length) continue;
          const avoidSet = new Set(as._fetchedGenres);
          const overlap = r.genre_ids.filter(g => avoidSet.has(g)).length;
          const overlapRatio = overlap / (as._fetchedGenres.length || 1);
          if (overlapRatio > 0.5) avoidPenalty = Math.max(avoidPenalty, 0.15 * overlapRatio);
        }
      }
      r._score = 0.35 * genreMatch + 0.20 * voteNorm + 0.15 * sourceScoreNorm + 0.15 * decadeBonus + 0.10 * popNorm + 0.05 * freshnessBonus - avoidPenalty;
    } else {
      r._score = 0.40 * genreMatch + 0.25 * voteNorm + 0.20 * sourceScoreNorm + 0.10 * popNorm + 0.05 * freshnessBonus;
    }
  });

  allRecs.sort((a, b) => b._score - a._score);
  const poolSize = advanced ? 60 : 30;
  const pool = allRecs.slice(0, poolSize);

  return { movies: pool, totalRated };
}

// ── Cache key for recommendations ──
function makeRecKey(userId, entries) {
  const movieIds = entries
    .filter(e => e.user_id === userId && e.type === 'movie' && e.tmdb_id)
    .map(e => e.tmdb_id + ':' + (e.total_score || 0))
    .sort()
    .join(',');
  // Simple hash
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
      return new Response(JSON.stringify({ status: 'ok', tmdbCache: tmdbCache.size, ts: Date.now() }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // ── TMDB Proxy ──
    if (url.pathname.startsWith('/tmdb/')) {
      const tmdbPath = url.pathname.replace('/tmdb', '');
      const fullUrl = new URL(TMDB_BASE + tmdbPath);
      for (const [k, v] of url.searchParams) fullUrl.searchParams.set(k, v);
      fullUrl.searchParams.set('api_key', TMDB_KEY);
      const cacheKey = fullUrl.toString();

      const data = await cachedTmdbFetch(cacheKey);
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'X-Cache': tmdbCache.has(cacheKey) ? 'HIT' : 'MISS', ...corsHeaders() },
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

        const result = await loadRecommendations(entries, userId);

        // Store in Cache API (TTL: 1 hour)
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
