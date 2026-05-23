import { requireLegacyBridge } from '../../app/legacy-bridge.js';
import type { FeatureDefinition } from '../types.js';

export const ratingsFeature: FeatureDefinition = {
  key: 'ratings',
  label: 'Ratings',
  status: 'legacy-backed',
  ownsDomIds: ['panel-rate', 'movieForm', 'quickRateModal', 'mainDims', 'seasonList', 'qrDims', 'qrSeasonList'],
  store: 'entries',
  mount() {},
};

export function openQuickRate(movie: unknown): void {
  requireLegacyBridge().ratings?.openQuickRate?.(movie);
}

export function openQuickEdit(id: string | number, opts?: unknown): void {
  requireLegacyBridge().ratings?.openQuickEdit?.(id, opts);
}

export function resetRatingForm(): void {
  requireLegacyBridge().ratings?.resetForm?.();
}
