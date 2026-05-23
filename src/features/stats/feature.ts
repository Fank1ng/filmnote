import { requireLegacyBridge, switchLegacyTab } from '../../app/legacy-bridge.js';
import type { FeatureDefinition } from '../types.js';

export const statsFeature: FeatureDefinition = {
  key: 'stats',
  label: 'Stats',
  status: 'legacy-backed',
  ownsDomIds: ['panel-stats', 'statsContent', 'statsUserPicker'],
  store: 'entries',
  mount() {},
  render() {
    requireLegacyBridge().stats?.renderStats?.();
  },
};

export function showStats(): void {
  switchLegacyTab('stats');
}

export function renderStats(): void {
  requireLegacyBridge().stats?.renderStats?.();
}
