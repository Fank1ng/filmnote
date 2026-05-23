export { default as RatingsFeature } from './RatingsFeature.vue';
export { default as QuickRateModal } from './QuickRateModal.vue';
export { openQuickEdit, openQuickRate, ratingsFeature, resetRatingForm } from './feature.js';

export function initRatingsFeature() {
  // Ratings logic is still hosted by the legacy app bundle during phase 1.
}
