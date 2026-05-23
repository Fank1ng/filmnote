import { requireLegacyBridge, switchLegacyTab } from '../../app/legacy-bridge.js';
import type { FeatureDefinition } from '../types.js';

export const discoverFeature: FeatureDefinition = {
  key: 'discover',
  label: 'Discover',
  status: 'legacy-backed',
  ownsDomIds: ['panel-discover', 'discoverContent', 'discoverSubtabs', 'blockedModal'],
  store: 'discover',
  mount() {},
  render() {
    return requireLegacyBridge().discover?.renderDiscover?.();
  },
};

export function showDiscover(): void {
  switchLegacyTab('discover');
}

export function renderDiscover(): Promise<void> | void {
  return requireLegacyBridge().discover?.renderDiscover?.();
}
