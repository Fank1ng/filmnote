import { cacheGet, cacheSet } from './cache';
import { IMDB_TOP100_SEED } from './imdb-top100-seed';
import { fetchTmdb } from './tmdb';
import type { Env } from './worker-types';

const IMDB_TOP_URL = 'https://www.imdb.com/chart/top/';
const IMDB_TOP100_KV_KEY = 'list:imdb_top100:v1';
const IMDB_TOP100_MEM_KEY = 'list:imdb_top100:v1';
const IMDB_TOP100_LIMIT = 100;
const MAX_IMDB_NEW_MAPPINGS = 20;

export function isValidImdbTopPayload(payload) {
  return !!(
    payload &&
    Array.isArray(payload.results) &&
    payload.results.length >= IMDB_TOP100_LIMIT &&
    payload.results[0] &&
    payload.results[0].imdb_rank === 1
  );
}

function normalizeImdbTopMovie(movie, imdbId, rank) {
  return {
    ...movie,
    media_type: 'movie',
    imdb_id: imdbId || movie.imdb_id || '',
    imdb_rank: rank || movie.imdb_rank || 0,
    top_source: 'imdb_top250'
  };
}

function seedImdbTopPayload() {
  const results = (IMDB_TOP100_SEED || [])
    .slice(0, IMDB_TOP100_LIMIT)
    .map((movie, index) => normalizeImdbTopMovie(movie, movie.imdb_id, index + 1));
  if (results.length < IMDB_TOP100_LIMIT) return null;
  return {
    results,
    source: 'seed',
    updated_at: null,
    seed_count: results.length
  };
}

export async function loadImdbTopPayload(env) {
  const cached = cacheGet(IMDB_TOP100_MEM_KEY);
  if (isValidImdbTopPayload(cached)) return cached;

  if (env && env.TMDB_CACHE) {
    try {
      const payload = await env.TMDB_CACHE.get(IMDB_TOP100_KV_KEY, { type: 'json' });
      if (isValidImdbTopPayload(payload)) {
        cacheSet(IMDB_TOP100_MEM_KEY, payload);
        return payload;
      }
    } catch (e) {}
  }

  return seedImdbTopPayload();
}

export async function fallbackTmdbTopRated(env) {
  const results = [];
  for (let page = 1; page <= 10 && results.length < IMDB_TOP100_LIMIT; page++) {
    const data = await fetchTmdb(`/movie/top_rated?language=zh-CN&page=${page}`, env);
    if (data.results && data.results.length) {
      data.results.forEach(r => { if ((r.vote_count || 0) >= 500) results.push(r); });
    } else break;
  }
  return {
    results: results.slice(0, IMDB_TOP100_LIMIT),
    source: 'tmdb_fallback',
    updated_at: null
  };
}

function extractJsonLdImdbIds(html) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const ids = [];
  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const items = Array.isArray(parsed?.itemListElement) ? parsed.itemListElement : [];
      for (const item of items) {
        const url = item?.item?.url || item?.url || '';
        const id = String(url).match(/\/title\/(tt\d+)\//)?.[1];
        if (id) ids.push(id);
      }
    } catch (e) {}
  }
  return ids;
}

function extractImdbTopIds(html) {
  const seen = new Set();
  const ids = [];
  const add = id => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };

  extractJsonLdImdbIds(html).forEach(add);

  const structuredMatches = [
    ...html.matchAll(/"titleId"\s*:\s*"(tt\d+)"/g),
    ...html.matchAll(/"id"\s*:\s*"(tt\d+)"/g)
  ];
  structuredMatches.forEach(match => add(match[1]));

  if (ids.length < IMDB_TOP100_LIMIT) {
    [...html.matchAll(/\/title\/(tt\d+)\//g)].forEach(match => add(match[1]));
  }

  return ids.slice(0, IMDB_TOP100_LIMIT);
}

async function fetchImdbTopIds() {
  const res = await fetch(IMDB_TOP_URL, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 FilmNote/1.0 (+https://filmnote.lccf1223.workers.dev)'
    }
  });
  const html = await res.text();
  if (!res.ok || !html) {
    throw new Error(`IMDb Top250 fetch failed (${res.status})`);
  }
  const ids = extractImdbTopIds(html);
  if (ids.length < IMDB_TOP100_LIMIT) {
    throw new Error(`IMDb Top250 parse returned ${ids.length} ids`);
  }
  return ids;
}

async function mapImdbIdToTmdbMovie(imdbId, rank, env) {
  const data = await fetchTmdb(`/find/${imdbId}?external_source=imdb_id&language=zh-CN`, env);
  const movie = (data.movie_results || [])[0];
  if (!movie || !movie.id) return null;
  return normalizeImdbTopMovie(movie, imdbId, rank);
}

export async function refreshImdbTop100(env) {
  if (!env || !env.TMDB_CACHE) {
    throw new Error('TMDB_CACHE is not configured');
  }

  const ids = await fetchImdbTopIds();
  const previous = await loadImdbTopPayload(env);
  const previousByImdbId = new Map((previous?.results || [])
    .filter(movie => movie.imdb_id && movie.id)
    .map(movie => [movie.imdb_id, movie]));
  const results = [];
  let newMappings = 0;

  for (let index = 0; index < ids.length; index++) {
    const imdbId = ids[index];
    const rank = index + 1;
    const existing = previousByImdbId.get(imdbId);
    if (existing) {
      results.push(normalizeImdbTopMovie(existing, imdbId, rank));
      continue;
    }

    if (newMappings >= MAX_IMDB_NEW_MAPPINGS) continue;
    newMappings++;
    try {
      const mapped = await mapImdbIdToTmdbMovie(imdbId, rank, env);
      if (mapped) results.push(mapped);
    } catch (e) {}
  }

  results.sort((a, b) => (a.imdb_rank || 0) - (b.imdb_rank || 0));
  if (results.length < IMDB_TOP100_LIMIT) {
    throw new Error(`IMDb Top100 refresh produced ${results.length} valid movies`);
  }

  const payload = {
    results: results.slice(0, IMDB_TOP100_LIMIT),
    source: 'imdb_top250',
    updated_at: new Date().toISOString(),
    mapped_new: newMappings
  };
  await env.TMDB_CACHE.put(IMDB_TOP100_KV_KEY, JSON.stringify(payload));
  cacheSet(IMDB_TOP100_MEM_KEY, payload);
  return payload;
}
