import { createEntry, saveSeasonRatings } from './entries-api.js';
import { addBlockedMovie, addWatchlistItem } from './list-api.js';
import { addCoupleQueueItem } from './couple-api.js';
import { downloadJsonFile } from '../shared/browser.js';
import type { BlockedMovie, CoupleQueueItem, Entry, SeasonRating, WatchlistItem } from '../types/domain.js';

type ExportPayload = {
  version: 2;
  exported_at: string;
  entries: Entry[];
  season_ratings: SeasonRating[];
  watchlist: WatchlistItem[];
  blocked_movies: BlockedMovie[];
  couple_queue: CoupleQueueItem[];
};

type ImportPayload = Partial<ExportPayload> | Entry[];

function cloneForJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function buildExportPayload(payload: Omit<ExportPayload, 'version' | 'exported_at'>): ExportPayload {
  return {
    version: 2,
    exported_at: new Date().toISOString(),
    entries: cloneForJson(payload.entries),
    season_ratings: cloneForJson(payload.season_ratings),
    watchlist: cloneForJson(payload.watchlist),
    blocked_movies: cloneForJson(payload.blocked_movies),
    couple_queue: cloneForJson(payload.couple_queue),
  };
}

export function downloadExport(payload: ExportPayload): void {
  downloadJsonFile(payload, `filmnote-${new Date().toISOString().slice(0, 10)}.json`);
}

function entryRows(payload: ImportPayload): Entry[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.entries)) return payload.entries;
  throw new Error('格式错误');
}

export async function importFilmNoteJson(userId: string, payload: ImportPayload): Promise<number> {
  const sourceEntries = entryRows(payload);
  const sourceSeasons = !Array.isArray(payload) && Array.isArray(payload.season_ratings) ? payload.season_ratings : [];
  const sourceWatchlist = !Array.isArray(payload) && Array.isArray(payload.watchlist) ? payload.watchlist : [];
  const sourceBlocked = !Array.isArray(payload) && Array.isArray(payload.blocked_movies) ? payload.blocked_movies : [];
  const sourceQueue = !Array.isArray(payload) && Array.isArray(payload.couple_queue) ? payload.couple_queue : [];
  const entryIdMap = new Map<string, Entry['id']>();
  let count = 0;

  for (const entry of sourceEntries) {
    const { data, error } = await createEntry({
      user_id: userId,
      type: entry.type || entry.media_type || 'movie',
      media_type: entry.media_type || entry.type || 'movie',
      tmdb_id: entry.tmdb_id || null,
      title: entry.title,
      year: entry.year || null,
      director: entry.director || '',
      poster_path: entry.poster_path || '',
      ratings: entry.ratings || {},
      total_score: entry.total_score || entry.score || null,
      comment: entry.comment || '',
      created_at: entry.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (!error && data) {
      entryIdMap.set(String(entry.id), (data as Entry).id);
      count += 1;
    }
  }

  const seasonRows = sourceSeasons
    .map(season => {
      const entryId = entryIdMap.get(String(season.entry_id));
      if (!entryId) return null;
      return {
        ...season,
        id: undefined,
        entry_id: entryId,
        user_id: userId,
      } as SeasonRating;
    })
    .filter((season): season is SeasonRating => !!season);
  await saveSeasonRatings(seasonRows);

  for (const item of sourceWatchlist) {
    await addWatchlistItem({
      user_id: userId,
      media_type: item.media_type,
      tmdb_id: item.tmdb_id,
      title: item.title || '',
      year: item.year || null,
      poster_path: item.poster_path || '',
    });
  }
  for (const item of sourceBlocked) {
    await addBlockedMovie({ user_id: userId, tmdb_id: item.tmdb_id, reason: item.reason || '' });
  }
  for (const item of sourceQueue) {
    await addCoupleQueueItem({
      couple_id: item.couple_id,
      media_type: item.media_type,
      tmdb_id: item.tmdb_id,
      title: item.title || '',
      year: item.year || null,
      poster_path: item.poster_path || '',
      position: item.position,
      added_by: userId,
    });
  }

  return count;
}
