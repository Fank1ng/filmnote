import { requireLegacyBridge, switchLegacyTab } from '../../app/legacy-bridge.js';
import type { FeatureDefinition } from '../types.js';

export const listFeature: FeatureDefinition = {
  key: 'list',
  label: 'List',
  status: 'legacy-backed',
  ownsDomIds: ['panel-list', 'listEntriesView', 'listWatchlistView', 'movieList', 'watchlistMovieGrid'],
  store: 'entries',
  mount() {},
  render() {
    requireLegacyBridge().list?.renderList?.();
  },
};

export function showList(): void {
  switchLegacyTab('list');
}

export function renderList(): void {
  requireLegacyBridge().list?.renderList?.();
}

export function showDetail(id: string | number): Promise<void> | void {
  return requireLegacyBridge().list?.showDetail?.(id);
}
