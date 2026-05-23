import { requireLegacyBridge } from '../../app/legacy-bridge.js';
import type { FeatureDefinition } from '../types.js';

export const importExportFeature: FeatureDefinition = {
  key: 'importExport',
  label: 'Import / Export',
  status: 'legacy-backed',
  ownsDomIds: ['exportBtn', 'importBtn', 'importFile'],
  store: 'entries',
  mount() {},
};

export function exportJson(): void {
  requireLegacyBridge().importExport?.exportJson?.();
}

export function importJson(): void {
  requireLegacyBridge().importExport?.importJson?.();
}
