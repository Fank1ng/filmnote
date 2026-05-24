import { WEIGHTS } from '../config/constants.js';
import type { Entry, RatingDims, SeasonRating } from '../types/domain.js';

export function calcTotal(ratings: RatingDims = {}): number {
  let score = 0;
  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const dim = key as keyof RatingDims;
    score += (ratings[dim] || 5) * weight;
  }
  return Math.round(score * 10) / 10;
}

export function getEntryScore(entry: Pick<Entry, 'ratings' | 'score' | 'total_score'> | null | undefined): number {
  if (!entry) return 0;
  return entry.total_score || entry.score || calcTotal(entry.ratings || {});
}

export function getSeasonAwareEntryScore(entry: Entry | null | undefined, seasonRatings: SeasonRating[] = []): number {
  if (!entry) return 0;
  const mediaType = entry.type || entry.media_type || 'movie';
  if (mediaType !== 'series') return getEntryScore(entry);
  const seasons = seasonRatings.filter(season =>
    String(season.entry_id) === String(entry.id) &&
    season.user_id === entry.user_id
  );
  if (!seasons.length) return getEntryScore(entry);
  return seasons.reduce((sum, season) => sum + Number(season.total_score || 0), 0) / seasons.length;
}
