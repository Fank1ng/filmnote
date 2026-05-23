import { requireLegacyBridge, switchLegacyTab } from '../../app/legacy-bridge.js';
import type { FeatureDefinition } from '../types.js';

export const coupleFeature: FeatureDefinition = {
  key: 'couple',
  label: 'Couple',
  status: 'legacy-backed',
  ownsDomIds: ['panel-couple', 'coupleContent'],
  store: 'couple',
  mount() {},
  render() {
    requireLegacyBridge().couple?.renderCouple?.();
  },
};

export function showCouple(): void {
  switchLegacyTab('couple');
}

export async function refreshCouple(): Promise<void> {
  const bridge = requireLegacyBridge();
  await bridge.couple?.loadCoupleState?.();
  await bridge.couple?.loadCoupleQueue?.();
  bridge.couple?.renderCouple?.();
}
