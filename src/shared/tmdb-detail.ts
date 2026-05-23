import { TMDB_PROXY } from '../config/constants.js';
import type { MediaType, TmdbDetail, TmdbMedia } from '../types/domain.js';
import { tmdbFetch } from './tmdb.js';

const CACHE_KEY = 'filmnote_movie_cache';
const REFRESH_MS = 7 * 24 * 60 * 60 * 1000;

type RawRecord = Record<string, unknown>;

export const genreNameMap: Record<number, string> = {
  28: '动作', 12: '冒险', 16: '动画', 35: '喜剧', 80: '犯罪', 99: '纪录', 18: '剧情', 10751: '家庭',
  14: '奇幻', 36: '历史', 27: '恐怖', 10402: '音乐', 9648: '悬疑', 10749: '爱情', 878: '科幻',
  10770: '电视电影', 53: '惊悚', 10752: '战争', 37: '西部',
};

export function normalizeMediaType(type: unknown): MediaType {
  return type === 'series' || type === 'tv' ? 'series' : 'movie';
}

export function tmdbIdOf(item: Partial<TmdbMedia> | null | undefined): number {
  return Number(item?.tmdb_id || item?.id || 0) || 0;
}

export function mediaSearchKey(mediaType: MediaType, tmdbId: number): string {
  return `${normalizeMediaType(mediaType)}:${Number(tmdbId)}`;
}

function loadCache(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, unknown>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage can be unavailable or full; detail UI can still render fetched data.
  }
}

function stringArray(value: unknown, limit = 8): string[] {
  return Array.isArray(value)
    ? value.map(item => typeof item === 'string' ? item : (item as RawRecord | null)?.name).filter(Boolean).map(String).slice(0, limit)
    : [];
}

function genreNames(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(item => typeof item === 'string' ? item : (item as RawRecord | null)?.name)
    .filter(Boolean)
    .map(String);
}

function genreIds(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  return input
    .map(item => typeof item === 'number' ? item : Number((item as RawRecord | null)?.id || 0))
    .filter(Boolean);
}

export function normalizeTmdbDetail(input: unknown): TmdbDetail | null {
  const source = input as RawRecord | null;
  if (!source) return null;
  if (source.movie) return normalizeTmdbDetail(source.movie);
  if (source.details && typeof source.details === 'object') return normalizeTmdbDetail(source.details);

  const releaseDate = String(source.release_date || source.first_air_date || '');
  const mediaType = normalizeMediaType(source.media_type || source.type || (source.number_of_seasons || source.first_air_date ? 'series' : 'movie'));
  const genres = genreNames(source.genres);
  const ids = Array.isArray(source.genre_ids) ? source.genre_ids.map(Number).filter(Boolean) : genreIds(source.genres);

  return {
    id: Number(source.id || source.tmdb_id || 0),
    tmdb_id: Number(source.tmdb_id || source.id || 0),
    media_type: mediaType,
    type: mediaType,
    title: String(source.title || source.name || ''),
    name: String(source.name || source.title || ''),
    original_title: String(source.original_title || source.original_name || ''),
    overview: String(source.overview || ''),
    overview_missing: source.overview_missing === true || !source.overview,
    release_date: releaseDate,
    first_air_date: String(source.first_air_date || ''),
    year: Number(source.year || releaseDate.slice(0, 4)) || null,
    poster_path: String(source.poster_path || ''),
    genres,
    genre_ids: ids,
    vote_average: Number(source.vote_average || 0),
    vote_count: Number(source.vote_count || 0),
    popularity: Number(source.popularity || 0),
    runtime: Number(source.runtime || (Array.isArray(source.episode_run_time) ? source.episode_run_time[0] : 0) || 0),
    director: String(source.director || ''),
    cast: stringArray(source.cast),
    keyword_ids: Array.isArray(source.keyword_ids) ? source.keyword_ids.map(Number).filter(Boolean) : genreIds(source.keywords),
    keyword_names: stringArray(source.keyword_names || source.keywords),
    original_language: String(source.original_language || ''),
    number_of_seasons: Number(source.number_of_seasons || 0),
    seasons: Array.isArray(source.seasons) ? source.seasons : [],
    fetched_at: Number(source.fetched_at || Date.now()),
  };
}

export function normalizeTmdbMedia(input: unknown, fallbackType: MediaType = 'movie'): TmdbMedia | null {
  const raw = typeof input === 'object' && input ? input as RawRecord : { id: input };
  const tmdbId = Number(raw.tmdb_id || raw.id || 0);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return null;
  const releaseDate = String(raw.release_date || raw.first_air_date || '');
  const mediaType = normalizeMediaType(raw.media_type || raw.type || (raw.name || raw.first_air_date || raw.number_of_seasons ? 'series' : fallbackType));
  return {
    id: tmdbId,
    tmdb_id: tmdbId,
    media_type: mediaType,
    type: mediaType,
    title: String(raw.title || raw.name || `TMDB #${tmdbId}`),
    name: String(raw.name || raw.title || `TMDB #${tmdbId}`),
    release_date: releaseDate,
    first_air_date: String(raw.first_air_date || ''),
    year: Number(raw.year || releaseDate.slice(0, 4)) || null,
    poster_path: raw.poster_path ? String(raw.poster_path) : '',
    overview: String(raw.overview || ''),
    original_language: String(raw.original_language || ''),
    vote_average: Number(raw.vote_average || 0),
    genre_ids: Array.isArray(raw.genre_ids) ? raw.genre_ids.map(Number).filter(Boolean) : [],
    genres: Array.isArray(raw.genres) ? raw.genres as TmdbMedia['genres'] : [],
    director: String(raw.director || ''),
    number_of_seasons: Number(raw.number_of_seasons || 0),
  } as TmdbMedia;
}

export function getCachedTmdbDetail(mediaType: MediaType, tmdbId: number): TmdbDetail | null {
  const cache = loadCache();
  const cached = cache[mediaSearchKey(mediaType, tmdbId)] || cache[String(tmdbId)];
  return normalizeTmdbDetail(cached);
}

export function setCachedTmdbDetail(mediaType: MediaType, tmdbId: number, detail: TmdbDetail): void {
  const cache = loadCache();
  cache[mediaSearchKey(mediaType, tmdbId)] = {
    ...(getCachedTmdbDetail(mediaType, tmdbId) || {}),
    ...detail,
    media_type: mediaType,
    tmdb_id: tmdbId,
    fetched_at: detail.fetched_at || Date.now(),
  };
  saveCache(cache);
}

export function needsTmdbDetailFetch(detail: TmdbDetail | null): boolean {
  if (!detail) return true;
  const stale = !detail.fetched_at || Date.now() - detail.fetched_at > REFRESH_MS;
  const missingOverview = !detail.overview && !detail.overview_missing;
  const missingCore = missingOverview || (!detail.director && !(detail.cast && detail.cast.length) && !detail.vote_average);
  return stale || missingCore;
}

async function fetchFromWorker(mediaType: MediaType, tmdbId: number): Promise<TmdbDetail | null> {
  if (!TMDB_PROXY) return null;
  const typeParam = mediaType === 'series' ? '?type=series' : '';
  const response = await fetch(`${TMDB_PROXY}/detail/${tmdbId}${typeParam}`);
  if (!response.ok) return null;
  return normalizeTmdbDetail(await response.json());
}

async function fetchFromPrefetch(mediaType: MediaType, tmdbId: number): Promise<TmdbDetail | null> {
  if (!TMDB_PROXY) return null;
  const response = await fetch(`${TMDB_PROXY}/prefetch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: [{ media_type: mediaType, tmdb_id: tmdbId }], return_overviews: true }),
  });
  if (!response.ok) return null;
  const result = await response.json();
  const key = mediaSearchKey(mediaType, tmdbId);
  return normalizeTmdbDetail(result.details?.[key] || result.details?.[tmdbId] || result.details?.[String(tmdbId)]);
}

async function fetchDirect(mediaType: MediaType, tmdbId: number): Promise<TmdbDetail | null> {
  const tmdbType = mediaType === 'series' ? 'tv' : 'movie';
  const response = await tmdbFetch(`/${tmdbType}/${tmdbId}?language=zh-CN`);
  if (!response.ok) return null;
  return normalizeTmdbDetail(await response.json());
}

export async function fetchTmdbDetail(mediaType: MediaType, tmdbId: number, opts: { force?: boolean } = {}): Promise<TmdbDetail | null> {
  const cached = getCachedTmdbDetail(mediaType, tmdbId);
  if (!opts.force && cached && !needsTmdbDetailFetch(cached)) return cached;

  const fetched = await fetchFromWorker(mediaType, tmdbId)
    || await fetchFromPrefetch(mediaType, tmdbId)
    || await fetchDirect(mediaType, tmdbId);
  if (!fetched) return cached;

  setCachedTmdbDetail(mediaType, tmdbId, fetched);
  return fetched;
}
