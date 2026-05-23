import type { AppState } from '../core/state.js';
import { mainTabs, type MainTab, useUiStore } from '../stores/ui.js';
import { useSessionStore } from '../stores/session.js';
import { useEntriesStore } from '../stores/entries.js';
import { useListsStore } from '../stores/lists.js';
import { useCoupleStore } from '../stores/couple.js';
import { onLegacyReady } from './legacy-bridge.js';

type LegacyStateEvent = CustomEvent<{
  reason?: string;
  state?: Partial<AppState>;
}>;

function isMainTab(value: unknown): value is MainTab {
  return typeof value === 'string' && mainTabs.some(tab => tab.name === value);
}

function applyLegacyState(state: Partial<AppState>): void {
  const session = useSessionStore();
  const entries = useEntriesStore();
  const lists = useListsStore();
  const couple = useCoupleStore();
  const ui = useUiStore();

  if ('currentUser' in state) {
    if (state.currentUser) session.setUser(state.currentUser, state.currentProfile ?? null);
    else session.clearSession();
  } else if ('currentProfile' in state && session.currentUser) {
    session.setUser(session.currentUser, state.currentProfile ?? null);
  }

  if (state.allEntries) entries.setEntries(state.allEntries);
  if (state.allSeasonRatings) entries.setSeasonRatings(state.allSeasonRatings);
  if (state.allProfiles) entries.setProfiles(state.allProfiles);

  if (state.watchlist) lists.setWatchlist(state.watchlist);
  if (state.blockedMovies) lists.setBlockedMovies(state.blockedMovies);

  if ('activeCouple' in state) couple.setActiveCouple(state.activeCouple ?? null);
  if (state.pendingCouples) couple.setPendingCouples(state.pendingCouples);
  if (state.coupleQueue) couple.setQueue(state.coupleQueue);
  if ('couplePartner' in state) couple.setPartnerProfileId(state.couplePartner?.user_id ?? null);
  if (state.coupleRecommendations) couple.setRecommendations(state.coupleRecommendations);
  if (state.coupleRecommendationState) couple.setRecommendationState(state.coupleRecommendationState);
  if ('coupleRecommendationLoading' in state) couple.setLoading(!!state.coupleRecommendationLoading);
  if (isMainTab(state.activeTab)) ui.setActiveTab(state.activeTab);
}

export function installLegacyStateSync(): () => void {
  let unsubscribeState: (() => void) | null = null;

  const subscribeToState = (): void => {
    if (unsubscribeState || !window.FilmNoteState) return;
    unsubscribeState = window.FilmNoteState.subscribe?.(applyLegacyState) ?? null;
    const snapshot = window.FilmNoteState.getState?.();
    if (snapshot) applyLegacyState(snapshot);
  };

  const onLegacyState = (event: Event): void => {
    const state = (event as LegacyStateEvent).detail?.state;
    if (state) applyLegacyState(state);
  };

  window.addEventListener('filmnote:legacy-state', onLegacyState);

  subscribeToState();
  const stopLegacyReady = onLegacyReady(subscribeToState);

  return () => {
    window.removeEventListener('filmnote:legacy-state', onLegacyState);
    stopLegacyReady();
    unsubscribeState?.();
  };
}
