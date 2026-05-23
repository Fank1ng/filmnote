import { authFeature } from './auth/index.js';
import { coupleFeature } from './couple/index.js';
import { discoverFeature } from './discover/index.js';
import { importExportFeature } from './import-export/index.js';
import { listFeature } from './list/index.js';
import { ratingsFeature } from './ratings/index.js';
import { statsFeature } from './stats/index.js';
import { getLegacyBridge } from '../app/legacy-bridge.js';
import { useLegacyStore } from '../stores/legacy.js';
import type { FeatureDefinition, FeatureKey } from './types.js';

export const featureRegistry = [
  authFeature,
  ratingsFeature,
  listFeature,
  statsFeature,
  discoverFeature,
  coupleFeature,
  importExportFeature,
] satisfies FeatureDefinition[];

export function getFeature(key: FeatureKey): FeatureDefinition {
  const feature = featureRegistry.find(item => item.key === key);
  if (!feature) throw new Error(`Unknown FilmNote feature: ${key}`);
  return feature;
}

export async function mountAllFeatures(): Promise<void> {
  const legacyStore = useLegacyStore();
  legacyStore.markReady(getLegacyBridge()?.shell?.getActiveTab?.() ?? null);

  for (const feature of featureRegistry) {
    await feature.mount();
    legacyStore.markFeatureMounted(feature.key);
  }
}
