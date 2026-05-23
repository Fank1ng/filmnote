export { default as ListFeature } from './ListFeature.vue';
export { default as ListBody } from './ListBody.vue';
export { default as ListControls } from './ListControls.vue';
export { listFeature, renderList, showDetail, showList } from './feature.js';

export function initListFeature() {
  // List logic is still hosted by the legacy app bundle during phase 1.
}
