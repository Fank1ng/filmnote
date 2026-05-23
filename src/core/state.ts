import type { BlockedMovie, Couple, CoupleQueueItem, Entry, Profile, SeasonRating, WatchlistItem } from '../types/domain.js';

export type AppState = {
  currentUser: unknown;
  currentProfile: Profile | null;
  allEntries: Entry[];
  allSeasonRatings: SeasonRating[];
  allProfiles: Record<string, Profile>;
  activeCouple: Couple | null;
  pendingCouples: Couple[];
  couplePartner: Profile | null;
  coupleQueue: CoupleQueueItem[];
  watchlist: WatchlistItem[];
  blockedMovies: BlockedMovie[];
  activeTab: string;
};

const state = {
  currentUser: null,
  currentProfile: null,
  allEntries: [],
  allSeasonRatings: [],
  allProfiles: {},
  activeCouple: null,
  pendingCouples: [],
  couplePartner: null,
  coupleQueue: [],
  watchlist: [],
  blockedMovies: [],
  activeTab: 'rate',
} satisfies AppState;

type StateListener = (state: AppState) => void;

const listeners = new Set<StateListener>();

export function getState(): AppState {
  return state;
}

export function setState(patch: Partial<AppState>): AppState {
  Object.assign(state, patch);
  listeners.forEach(listener => listener(state));
  return state;
}

export function subscribe(listener: StateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function installStateNamespace(target: Window = window): void {
  target.FilmNoteState = {
    getState,
    setState,
    subscribe,
  };
}
