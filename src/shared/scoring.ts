import { WEIGHTS } from '../config/constants.js';
import type { Entry, RatingDims } from '../types/domain.js';

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

export function installScoringNamespace(target: Window = window): void {
  target.FilmNoteScoring = {
    calcTotal,
    getEntryScore,
  };
}
