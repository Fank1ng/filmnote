import { TMDB_PROXY } from '../config/constants.js';
import { tmdbFetch } from '../shared/tmdb.js';
import type { MediaType, TmdbMedia } from '../types/domain.js';

type TmdbSearchResponse = {
  results?: TmdbMedia[];
  success?: boolean;
  error?: string;
  status_code?: number;
  status_message?: string;
};

type TmdbDetailResponse = TmdbMedia & {
  created_by?: Array<{ name?: string }>;
  number_of_seasons?: number;
  vote_average?: number;
  runtime?: number;
  original_language?: string;
};

type TmdbCreditsResponse = {
  crew?: Array<{ job?: string; name?: string }>;
};

export type NormalizedSearchMedia = {
  id: number;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  original_title?: string;
  original_name?: string;
  year: number | null;
  release_date: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  original_language: string;
  director?: string;
  runtime?: number;
  number_of_seasons?: number;
};

function mediaTypeToTmdbType(mediaType: MediaType): 'movie' | 'tv' {
  return mediaType === 'series' ? 'tv' : 'movie';
}

export function normalizeSearchMedia(item: TmdbMedia, mediaType: MediaType): NormalizedSearchMedia | null {
  const id = Number(item.tmdb_id || item.id || 0);
  const title = item.title || item.name || (item as { original_title?: string; original_name?: string }).original_title || (item as { original_title?: string; original_name?: string }).original_name || '';
  if (!id || !title) return null;
  const releaseDate = item.release_date || item.first_air_date || '';
  return {
    id,
    tmdb_id: id,
    media_type: mediaType,
    title,
    original_title: (item as { original_title?: string }).original_title || '',
    original_name: (item as { original_name?: string }).original_name || '',
    year: Number(String(releaseDate).slice(0, 4)) || null,
    release_date: releaseDate,
    poster_path: item.poster_path || '',
    overview: item.overview || '',
    vote_average: Number((item as { vote_average?: number }).vote_average || 0),
    original_language: (item as { original_language?: string }).original_language || '',
  };
}

export async function searchTmdbMedia(query: string, mediaType: MediaType, signal?: AbortSignal): Promise<NormalizedSearchMedia[]> {
  const type = mediaTypeToTmdbType(mediaType);
  let data: TmdbSearchResponse | null = null;
  try {
    const response = await fetch(`${TMDB_PROXY}/search?q=${encodeURIComponent(query)}&type=${type}`, { signal });
    data = await response.json().catch(() => ({})) as TmdbSearchResponse;
    if (!response.ok || data.success === false || data.error || data.status_code) {
      throw new Error(data.error || data.status_message || `TMDB 搜索接口异常 (${response.status})`);
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    const fallbackResponse = await tmdbFetch(`/search/${type}?query=${encodeURIComponent(query)}&language=zh-CN`, { signal });
    data = await fallbackResponse.json().catch(() => ({})) as TmdbSearchResponse;
    if (!fallbackResponse.ok || data.success === false || data.error || data.status_code) {
      throw new Error(data.error || data.status_message || `TMDB 搜索接口异常 (${fallbackResponse.status})`);
    }
  }
  return (data.results || [])
    .map(item => normalizeSearchMedia(item, mediaType))
    .filter((item): item is NormalizedSearchMedia => !!item);
}

export async function loadTmdbMediaDetail(media: NormalizedSearchMedia): Promise<NormalizedSearchMedia> {
  const tmdbType = mediaTypeToTmdbType(media.media_type);
  const [detailResponse, creditsResponse] = await Promise.all([
    tmdbFetch(`/${tmdbType}/${media.tmdb_id}?language=zh-CN`),
    tmdbFetch(`/${tmdbType}/${media.tmdb_id}/credits?language=zh-CN`).catch(() => null),
  ]);
  const detail = await detailResponse.json().catch(() => ({})) as TmdbDetailResponse;
  const credits = creditsResponse ? await creditsResponse.json().catch(() => ({})) as TmdbCreditsResponse : {};
  const director = media.media_type === 'series'
    ? detail.created_by?.[0]?.name || credits.crew?.find(member => member.job === 'Director' || member.job === 'Executive Producer')?.name || ''
    : credits.crew?.find(member => member.job === 'Director')?.name || '';
  const releaseDate = detail.release_date || detail.first_air_date || media.release_date || '';
  return {
    ...media,
    title: detail.title || detail.name || media.title,
    year: Number(String(releaseDate).slice(0, 4)) || media.year,
    release_date: releaseDate,
    poster_path: detail.poster_path || media.poster_path,
    overview: detail.overview || media.overview,
    vote_average: Number(detail.vote_average || media.vote_average || 0),
    original_language: detail.original_language || media.original_language,
    director,
    runtime: media.media_type === 'movie' ? Number(detail.runtime || 0) : undefined,
    number_of_seasons: media.media_type === 'series' ? Number(detail.number_of_seasons || 0) : undefined,
  };
}
