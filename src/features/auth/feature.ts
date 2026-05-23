import { requireLegacyBridge } from '../../app/legacy-bridge.js';
import type { FeatureDefinition } from '../types.js';

export const authFeature: FeatureDefinition = {
  key: 'auth',
  label: 'Auth',
  status: 'legacy-backed',
  ownsDomIds: ['authOverlay', 'authLoginView', 'authRegisterView', 'nameOverlay', 'changePwOverlay', 'inviteCodeOverlay'],
  store: 'session',
  mount() {},
};

export function showLogin(): void {
  requireLegacyBridge().auth?.showLoginView?.();
}

export function showRegister(): void {
  requireLegacyBridge().auth?.showRegisterView?.();
}

export function logout(): void {
  requireLegacyBridge().auth?.doLogout?.();
}
