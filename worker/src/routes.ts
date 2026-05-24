// FilmNote Cloudflare Worker route handlers
import { getMemCacheSize } from './cache';
import { corsHeaders, errorResponse, getAllowedOrigins, jsonResponse, readJsonBody } from './http';
import { fallbackTmdbTopRated, isValidImdbTopPayload, loadImdbTopPayload, refreshImdbTop100 } from './imdb-top100';
import { loadRecommendations, makeRecKey, REC_CACHE_VERSION } from './recommendations';
import { MAX_CREDIT_IDS, MAX_PREFETCH_IDS, MAX_SEARCH_INDEX_ITEMS, MAX_TITLE_IDS, normalizeIds, normalizeSearchIndexItems, sanitizeBlockedFeedback, sanitizeEntries } from './request-normalizers';
import { fetchMediaDetailBundle, fetchSearchIndexItem, fetchTmdb, getTmdbKey, isTmdbReadToken } from './tmdb';
import type { Env, ScheduledController, WorkerExecutionContext } from './worker-types';

// ── Route handlers ──
export async function handleRequest(request: Request, env: Env, ctx: WorkerExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (url.pathname === '/health') {
      return jsonResponse({
        status: 'ok',
        memCache: getMemCacheSize(),
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
      const mediaType = url.searchParams.get('type') === 'series' || url.searchParams.get('type') === 'tv'
        ? 'series'
        : 'movie';
      const { details, credits, movie } = await fetchMediaDetailBundle(mediaType, tmdbId, env);
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
        const itemList = normalizeSearchIndexItems(body.items, MAX_PREFETCH_IDS);
        const legacyIds = normalizeIds(body.tmdb_ids, MAX_PREFETCH_IDS);
        const unique = itemList || (legacyIds ? legacyIds.map(id => ({ media_type: 'movie', tmdb_id: id, key: String(id) })) : null);
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
            batch.map(item => fetchMediaDetailBundle(item.media_type, item.tmdb_id, env))
          );
          results.forEach(r => { r.status === 'fulfilled' ? cached++ : errors++; });
          if (returnOverviews) {
            for (let j = 0; j < batch.length; j++) {
              const detailResult = results[j];
              if (detailResult.status === 'fulfilled') {
                const movie = detailResult.value.movie;
                if (movie) {
                  const key = batch[j].key;
                  details[key] = movie;
                  if (movie.overview) overviews[key] = movie.overview;
                }
              }
            }
          }
        }

        const resp: {
          cached: number;
          errors: number;
          total: number;
          overviews?: Record<string, string>;
          details?: Record<string, unknown>;
        } = { cached, errors, total: unique.length };
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

    // ── Batch multilingual search index endpoint (movie + series) ──
    if (url.pathname === '/search-index' && request.method === 'POST') {
      try {
        const body = await readJsonBody(request);
        const items = normalizeSearchIndexItems(body.items, MAX_SEARCH_INDEX_ITEMS);
        if (!items) {
          return errorResponse('Missing or invalid items', request, env, 400);
        }
        const results = {};
        let errors = 0;
        for (let i = 0; i < items.length; i += 5) {
          const batch = items.slice(i, i + 5);
          const settled = await Promise.allSettled(batch.map(async item => {
            const fields = await fetchSearchIndexItem(item, env);
            if (fields && Object.values(fields).some(v => String(v || '').trim())) results[item.key] = fields;
          }));
          errors += settled.filter(r => r.status === 'rejected').length;
        }
        return jsonResponse({ results, total: items.length, errors }, request, env);
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
      const payload = await loadImdbTopPayload(env);
      if (isValidImdbTopPayload(payload)) {
        return jsonResponse(payload, request, env);
      }
      return jsonResponse(await fallbackTmdbTopRated(env), request, env);
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
        const mode: 'single' | 'couple' = body.mode === 'couple' ? 'couple' : 'single';
        const partnerUserId = typeof body.partnerUserId === 'string' ? body.partnerUserId.slice(0, 120) : '';
        const cleanEntries = sanitizeEntries(entries);
        const cleanBlockedFeedback = sanitizeBlockedFeedback(blockedMovies, blockedIds);
        const cleanBlockedIds = cleanBlockedFeedback.map(m => m.tmdb_id);
        const cleanExcludeIds = Array.isArray(excludeIds) ? normalizeIds(excludeIds, 200) || [] : [];

        if (!cleanEntries || !userId) {
          return errorResponse('Missing entries or userId', request, env, 400);
        }
        if (mode === 'couple' && !partnerUserId) {
          return errorResponse('Missing partnerUserId for couple recommendations', request, env, 400);
        }

        const recOptions = { mode, partnerUserId };
        const recKey = makeRecKey(userId, cleanEntries, cleanBlockedIds, cleanExcludeIds, cleanBlockedFeedback, recOptions);
        const cacheKeyUrl = 'https://rec-cache.local/recommend/' + recKey;
        const cacheKey = new Request(cacheKeyUrl, { method: 'GET' });
        const cache = caches.default;

        // Check Cache API
        let cachedRes = await cache.match(cacheKey);
        if (cachedRes) {
          const data = await cachedRes.json() as Record<string, unknown>;
          return jsonResponse({ ...data, cached: true }, request, env, 200, { 'X-Rec-Cache': 'HIT' });
        }

        const result = await loadRecommendations(env, cleanEntries, userId, cleanBlockedIds, cleanExcludeIds, cleanBlockedFeedback, recOptions);

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
}

export function handleScheduled(event: ScheduledController, env: Env, ctx: WorkerExecutionContext): void {
    ctx.waitUntil(refreshImdbTop100(env).catch(error => {
      console.error('IMDb Top100 refresh failed', {
        message: error?.message || String(error),
        cron: event?.cron || ''
      });
    }));
}
