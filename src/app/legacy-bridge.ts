import type { LegacyBridge } from '../features/types.js';

const legacyReadyListeners = new Set<(bridge: LegacyBridge) => void>();

export function getLegacyBridge(): LegacyBridge | null {
  return window.FilmNoteLegacy ?? null;
}

export function requireLegacyBridge(): LegacyBridge {
  const bridge = getLegacyBridge();
  if (!bridge) throw new Error('FilmNote legacy bridge is not ready');
  return bridge;
}

export function onLegacyReady(listener: (bridge: LegacyBridge) => void): () => void {
  const bridge = getLegacyBridge();
  if (bridge) listener(bridge);
  legacyReadyListeners.add(listener);
  return () => legacyReadyListeners.delete(listener);
}

export function notifyLegacyReady(): void {
  const bridge = getLegacyBridge();
  if (!bridge) return;
  legacyReadyListeners.forEach(listener => listener(bridge));
}

export function switchLegacyTab(name: string): void {
  requireLegacyBridge().shell?.switchTab?.(name);
}
