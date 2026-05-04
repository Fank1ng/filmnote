// FilmNote Cloudflare Worker — TMDB API proxy with caching
const TMDB_KEY = 'bedbd15b921f0127d7d8921337ea5a06';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// In-memory cache: { urlString: { data, ts } }
const memCache = new Map();
const CACHE_MAX = 500; // max entries before eviction

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function getCacheTtl(url) {
  if (url.includes('/credits') || url.includes('/recommendations') || url.includes('/similar')) return 86400000;
  if (url.includes('/movie/') || url.includes('/tv/')) return 86400000;
  if (url.includes('/top_rated')) return 86400000;
  return 3600000; // 1h for search/discover/trending
}

function checkMemCache(url) {
  const entry = memCache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.ts > getCacheTtl(url)) {
    memCache.delete(url);
    return null;
  }
  return entry.data;
}

function setMemCache(url, data) {
  // Evict oldest if over max
  if (memCache.size >= CACHE_MAX) {
    const firstKey = memCache.keys().next().value;
    memCache.delete(firstKey);
  }
  memCache.set(url, { data, ts: Date.now() });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', cacheSize: memCache.size, ts: Date.now() }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    if (url.pathname.startsWith('/tmdb/')) {
      const tmdbPath = url.pathname.replace('/tmdb', '');
      const fullUrl = new URL(TMDB_BASE + tmdbPath);
      for (const [k, v] of url.searchParams) {
        fullUrl.searchParams.set(k, v);
      }
      fullUrl.searchParams.set('api_key', TMDB_KEY);
      const cacheKey = fullUrl.toString();

      // Check memory cache
      const cached = checkMemCache(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached), {
          headers: {
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            ...corsHeaders(),
          },
        });
      }

      // Fetch from TMDB
      const tmdbRes = await fetch(cacheKey, {
        headers: { 'Accept': 'application/json' },
      });
      const data = await tmdbRes.json();

      if (tmdbRes.ok) {
        setMemCache(cacheKey, data);
      }

      return new Response(JSON.stringify(data), {
        status: tmdbRes.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          ...corsHeaders(),
        },
      });
    }

    return new Response('FilmNote Worker', { status: 404, headers: corsHeaders() });
  },
};
