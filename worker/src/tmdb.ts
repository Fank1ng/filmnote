import { cacheGet, cacheSet } from './cache';
import type { Env } from './worker-types';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export function getTmdbKey(env) {
  return env && env.TMDB_API_KEY;
}

export function isTmdbReadToken(value) {
  return typeof value === 'string' && value.split('.').length === 3;
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
export async function fetchTmdb(path, env) {
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

function normalizeTmdbMovieDetail(details, credits, keywords) {
  if (!details || details.success === false) return null;
  const director = (credits?.crew || []).find(c => c.job === 'Director');
  const keywordItems = keywords?.keywords || keywords?.results || [];
  return {
    id: details.id || null,
    media_type: 'movie',
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
    keyword_ids: keywordItems.map(k => k.id).filter(Boolean),
    keyword_names: keywordItems.map(k => k.name).filter(Boolean),
    original_language: details.original_language || '',
    fetched_at: Date.now()
  };
}

function normalizeSeasonDetail(seasonDetail, seasonCredits, seriesCredits) {
  if (!seasonDetail || seasonDetail.success === false) return null;
  const seasonNumber = Number(seasonDetail.season_number || 0);
  const seasonCrew = seasonCredits?.crew?.length ? seasonCredits : null;
  const directorNames = crewNamesByJobs(seasonCrew || seriesCredits, ['Director', 'Creator', 'Executive Producer', 'Showrunner'], 3);
  const castNames = namesFromPeople(seasonCredits?.cast?.length ? seasonCredits.cast : seriesCredits?.cast, 8);
  const episodes = Array.isArray(seasonDetail.episodes)
    ? seasonDetail.episodes.map(ep => ({
      episode_number: Number(ep?.episode_number || 0),
      runtime: Math.max(0, Number(ep?.runtime || 0))
    })).filter(ep => ep.episode_number > 0)
    : [];
  const knownEpisodeRuntimes = episodes.filter(ep => ep.runtime > 0);
  const episodeRuntimeTotal = knownEpisodeRuntimes.reduce((sum, ep) => sum + ep.runtime, 0);
  const averageEpisodeRuntime = knownEpisodeRuntimes.length
    ? Math.round((episodeRuntimeTotal / knownEpisodeRuntimes.length) * 10) / 10
    : 0;
  return {
    season_number: seasonNumber,
    season_title: seasonDetail.name || '',
    name: seasonDetail.name || '',
    overview: seasonDetail.overview || '',
    air_date: seasonDetail.air_date || '',
    poster_path: seasonDetail.poster_path || '',
    vote_average: seasonDetail.vote_average || 0,
    episode_count: episodes.length || Number(seasonDetail.episode_count || 0),
    episode_runtime_total: episodeRuntimeTotal,
    known_episode_runtime_count: knownEpisodeRuntimes.length,
    average_episode_runtime: averageEpisodeRuntime,
    runtime_detail_version: 1,
    episodes,
    director: directorNames.join(' / '),
    cast: castNames
  };
}

function normalizeTmdbSeriesDetail(details, credits, seasonDetails) {
  if (!details || details.success === false) return null;
  const createdBy = namesFromPeople(details.created_by, 3);
  const directorNames = createdBy.length ? createdBy : crewNamesByJobs(credits, ['Creator', 'Director', 'Executive Producer', 'Showrunner'], 3);
  const seasons = (seasonDetails || [])
    .filter(Boolean)
    .sort((a, b) => a.season_number - b.season_number);
  return {
    id: details.id || null,
    media_type: 'series',
    title: details.name || details.title || '',
    original_title: details.original_name || details.original_title || '',
    overview: details.overview || '',
    overview_missing: !details.overview,
    release_date: details.first_air_date || details.release_date || '',
    year: parseInt(String(details.first_air_date || details.release_date || '').slice(0, 4)) || null,
    poster_path: details.poster_path || '',
    genres: (details.genres || []).map(g => g.name).filter(Boolean),
    genre_ids: (details.genres || []).map(g => g.id).filter(Boolean),
    vote_average: details.vote_average || 0,
    vote_count: details.vote_count || 0,
    popularity: details.popularity || 0,
    runtime: Array.isArray(details.episode_run_time) ? Number(details.episode_run_time[0] || 0) : 0,
    director: directorNames.join(' / '),
    cast: namesFromPeople(credits?.cast, 8),
    keyword_ids: [],
    keyword_names: [],
    original_language: details.original_language || '',
    number_of_seasons: Number(details.number_of_seasons || 0),
    seasons,
    fetched_at: Date.now()
  };
}

async function fetchMovieDetailBundle(tmdbId, env) {
  const [detailsZh, creditsZh, keywords] = await Promise.all([
    fetchTmdb(`/movie/${tmdbId}?language=zh-CN`, env),
    fetchTmdb(`/movie/${tmdbId}/credits?language=zh-CN`, env),
    fetchTmdb(`/movie/${tmdbId}/keywords`, env)
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
    movie: normalizeTmdbMovieDetail(details, creditsZh, keywords)
  };
}

async function fetchSeriesDetailBundle(tmdbId, env) {
  const [detailsZh, creditsZh] = await Promise.all([
    fetchTmdb(`/tv/${tmdbId}?language=zh-CN`, env),
    fetchTmdb(`/tv/${tmdbId}/credits?language=zh-CN`, env)
  ]);
  if (detailsZh?.success === false) {
    return { details: detailsZh, credits: creditsZh, movie: null };
  }

  let details = detailsZh || {};
  if (!details.overview) {
    const fallbacks = await Promise.allSettled([
      fetchTmdb(`/tv/${tmdbId}?language=zh-TW`, env),
      fetchTmdb(`/tv/${tmdbId}?language=en-US`, env)
    ]);
    const fallbackDetail = fallbacks
      .map(r => r.status === 'fulfilled' ? r.value : null)
      .find(d => d && d.success !== false && d.overview);
    if (fallbackDetail) {
      details = {
        ...fallbackDetail,
        ...details,
        overview: fallbackDetail.overview,
        episode_run_time: details.episode_run_time || fallbackDetail.episode_run_time || [],
      };
    }
  }

  const seasonSeeds = (details.seasons || [])
    .filter(s => Number(s.season_number) > 0)
    .slice(0, 30);
  const seasonResults = await Promise.allSettled(
    seasonSeeds.map(async season => {
      const seasonNumber = Number(season.season_number);
      const [seasonDetail, seasonCredits] = await Promise.all([
        fetchTmdb(`/tv/${tmdbId}/season/${seasonNumber}?language=zh-CN`, env),
        fetchTmdb(`/tv/${tmdbId}/season/${seasonNumber}/credits?language=zh-CN`, env).catch(() => null)
      ]);
      const normalized = normalizeSeasonDetail({
        ...season,
        ...seasonDetail,
        season_number: seasonNumber
      }, seasonCredits, creditsZh);
      return normalized || normalizeSeasonDetail(season, null, creditsZh);
    })
  );
  const seasons = seasonResults
    .map(r => r.status === 'fulfilled' ? r.value : null)
    .filter(Boolean);

  return {
    details,
    credits: creditsZh,
    movie: normalizeTmdbSeriesDetail(details, creditsZh, seasons)
  };
}

export async function fetchMediaDetailBundle(mediaType, tmdbId, env) {
  return mediaType === 'series'
    ? fetchSeriesDetailBundle(tmdbId, env)
    : fetchMovieDetailBundle(tmdbId, env);
}

function titleFromDetail(detail) {
  if (!detail || detail.success === false) return '';
  return detail.title || detail.name || '';
}

function originalTitleFromDetail(detail) {
  if (!detail || detail.success === false) return '';
  return detail.original_title || detail.original_name || '';
}

function namesFromPeople(people, limit = 8) {
  return (people || []).map(p => p?.name).filter(Boolean).slice(0, limit);
}

function crewNamesByJobs(credits, jobs, limit = 3) {
  const wanted = new Set(jobs);
  const seen = new Set();
  const names = [];
  for (const person of credits?.crew || []) {
    if (!wanted.has(person.job) || !person.name || seen.has(person.name)) continue;
    seen.add(person.name);
    names.push(person.name);
    if (names.length >= limit) break;
  }
  return names;
}

export async function fetchSearchIndexItem(item, env) {
  const mediaType = item.media_type;
  const tmdbType = mediaType === 'series' ? 'tv' : 'movie';
  const id = item.tmdb_id;
  const [detailZh, detailEn, creditsZh, creditsEn] = await Promise.all([
    fetchTmdb(`/${tmdbType}/${id}?language=zh-CN`, env),
    fetchTmdb(`/${tmdbType}/${id}?language=en-US`, env),
    fetchTmdb(`/${tmdbType}/${id}/credits?language=zh-CN`, env),
    fetchTmdb(`/${tmdbType}/${id}/credits?language=en-US`, env)
  ]);

  const directorJobs = mediaType === 'series'
    ? ['Creator', 'Director', 'Executive Producer', 'Showrunner']
    : ['Director'];
  const createdByZh = mediaType === 'series' ? namesFromPeople(detailZh?.created_by, 3) : [];
  const createdByEn = mediaType === 'series' ? namesFromPeople(detailEn?.created_by, 3) : [];
  const directorZh = createdByZh.length ? createdByZh : crewNamesByJobs(creditsZh, directorJobs, 3);
  const directorEn = createdByEn.length ? createdByEn : crewNamesByJobs(creditsEn, directorJobs, 3);

  return {
    title_zh: titleFromDetail(detailZh),
    title_en: titleFromDetail(detailEn),
    original_title: originalTitleFromDetail(detailZh) || originalTitleFromDetail(detailEn),
    director_zh: directorZh.join('|'),
    director_en: directorEn.join('|'),
    cast_zh: namesFromPeople(creditsZh?.cast, 8).join('|'),
    cast_en: namesFromPeople(creditsEn?.cast, 8).join('|')
  };
}
