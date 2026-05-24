import { TMDB_IMG, TMDB_PROXY } from '../config/constants.js';

export function posterUrl(path: string | null | undefined): string {
  return path ? TMDB_IMG + path : '';
}

export function tmdbFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  if (TMDB_PROXY) return fetch(TMDB_PROXY + '/tmdb' + path, opts);
  return Promise.reject(new Error('TMDB proxy is not configured'));
}
