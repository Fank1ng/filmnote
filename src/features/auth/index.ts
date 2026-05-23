export { default as AuthFeature } from './AuthFeature.vue';
export { authFeature, logout, showLogin, showRegister } from './feature.js';

export function initAuthFeature() {
  // Auth logic is still hosted by the legacy app bundle during phase 1.
}
