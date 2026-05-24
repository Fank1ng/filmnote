export const MAX_PREFETCH_IDS = 50;
export const MAX_TITLE_IDS = 100;
export const MAX_CREDIT_IDS = 50;
export const MAX_SEARCH_INDEX_ITEMS = 50;
const MAX_RECOMMEND_ENTRIES = 1000;

export function normalizeIds(ids, limit) {
  if (!Array.isArray(ids) || !ids.length) return null;
  return [...new Set(ids.map(id => Number(id)).filter(id => Number.isFinite(id) && id > 0))]
    .slice(0, limit);
}

export function normalizeSearchIndexItems(items, limit) {
  if (!Array.isArray(items) || !items.length) return null;
  const seen = new Set();
  const normalized = [];
  for (const item of items) {
    const tmdbId = Number(item?.tmdb_id || item?.id);
    if (!Number.isFinite(tmdbId) || tmdbId <= 0) continue;
    const mediaType = item?.media_type === 'series' || item?.media_type === 'tv' || item?.type === 'series' || item?.type === 'tv'
      ? 'series'
      : 'movie';
    const key = `${mediaType}:${tmdbId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ media_type: mediaType, tmdb_id: tmdbId, key });
    if (normalized.length >= limit) break;
  }
  return normalized.length ? normalized : null;
}

export function sanitizeEntries(entries) {
  if (!Array.isArray(entries)) return null;
  return entries.slice(0, MAX_RECOMMEND_ENTRIES).map(e => ({
    user_id: e.user_id,
    type: e.type === 'series' ? 'series' : 'movie',
    tmdb_id: Number.isFinite(Number(e.tmdb_id)) ? Number(e.tmdb_id) : null,
    total_score: Number.isFinite(Number(e.total_score)) ? Number(e.total_score) : null,
    score: Number.isFinite(Number(e.score)) ? Number(e.score) : null,
    created_at: e.created_at || '',
  }));
}

export function sanitizeBlockedFeedback(blockedMovies, blockedIds) {
  if (Array.isArray(blockedMovies)) {
    return blockedMovies.slice(0, 500)
      .map(m => ({
        tmdb_id: Number.isFinite(Number(m.tmdb_id)) ? Number(m.tmdb_id) : null,
        reason: String(m.reason || '').slice(0, 60)
      }))
      .filter(m => m.tmdb_id);
  }
  const ids = normalizeIds(blockedIds, 500) || [];
  return ids.map(id => ({ tmdb_id: id, reason: '' }));
}
