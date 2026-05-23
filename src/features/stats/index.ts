export { default as StatsFeature } from './StatsFeature.vue';
export { default as StatsControls } from './StatsControls.vue';
export { renderStats, showStats, statsFeature } from './feature.js';

export function initStatsFeature() {
  // Stats logic is still hosted by the legacy app bundle during phase 1.
}
