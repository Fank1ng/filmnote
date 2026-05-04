// FilmNote Cloudflare Worker — TMDB API proxy with caching
// Deploy to Cloudflare Workers, then update TMDB_PROXY in index.html

const TMDB_KEY = 'bedbd15b921f0127d7d8921337ea5a06';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const CACHE_TTL = {
  movie_detail: 86400,    // 24h — movie details rarely change
  credits: 86400,         // 24h
  recommendations: 86400, // 24h
  similar: 86400,         // 24h
  discover: 3600,         // 1h
  search: 3600,           // 1h
  trending: 3600,         // 1h
  top_rated: 86400,       // 24h
  default: 3600,
};

function getCacheTtl(url) {
  if (url.includes('/credits')) return CACHE_TTL.credits;
  if (url.includes('/recommendations')) return CACHE_TTL.recommendations;
  if (url.includes('/similar')) return CACHE_TTL.similar;
  if (url.includes('/discover')) return CACHE_TTL.discover;
  if (url.includes('/search')) return CACHE_TTL.search;
  if (url.includes('/trending')) return CACHE_TTL.trending;
  if (url.includes('/top_rated')) return CACHE_TTL.top_rated;
  if (/\/movie\/\d+$/.test(url) || /\/tv\/\d+$/.test(url)) return CACHE_TTL.movie_detail;
  return CACHE_TTL.default;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', ts: Date.now() }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    // TMDB proxy: /tmdb/search/movie?query=... → https://api.themoviedb.org/3/search/movie?api_key=...&query=...
    if (url.pathname.startsWith('/tmdb/')) {
      const tmdbPath = url.pathname.replace('/tmdb', '');
      const tmdbUrl = new URL(TMDB_BASE + tmdbPath);
      // Copy all query params and inject API key
      for (const [k, v] of url.searchParams) {
        tmdbUrl.searchParams.set(k, v);
      }
      tmdbUrl.searchParams.set('api_key', TMDB_KEY);

      const cacheKey = new Request(tmdbUrl.toString(), { method: 'GET' });
      const cache = caches.default;

      // Try cache first
      let response = await cache.match(cacheKey);
      if (response) {
        // Clone and add CORS headers
        const body = await response.text();
        return new Response(body, {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=' + getCacheTtl(tmdbUrl.pathname),
            ...corsHeaders(),
          },
        });
      }

      // Fetch from TMDB
      const tmdbRes = await fetch(tmdbUrl.toString());
      const body = await tmdbRes.text();

      response = new Response(body, {
        status: tmdbRes.status,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=' + getCacheTtl(tmdbUrl.pathname),
          ...corsHeaders(),
        },
      });

      // Cache successful responses
      if (tmdbRes.ok && tmdbRes.status !== 429) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }

      return response;
    }

    // Fallback
    return new Response('FilmNote Worker — use /tmdb/* for TMDB API proxy', {
      status: 404,
      headers: corsHeaders(),
    });
  },
};
