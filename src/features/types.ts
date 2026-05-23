export type FeatureKey =
  | 'auth'
  | 'ratings'
  | 'list'
  | 'stats'
  | 'discover'
  | 'couple'
  | 'importExport';

export type FeatureStatus = 'legacy-backed' | 'vue-native';

export type FeatureDefinition = {
  key: FeatureKey;
  label: string;
  status: FeatureStatus;
  ownsDomIds: string[];
  store: string;
  mount(): void | Promise<void>;
  render?(): void | Promise<void>;
};

export type LegacyBridge = {
  auth?: {
    showLoginView?: () => void;
    showRegisterView?: () => void;
    doLogout?: () => void;
    initApp?: (user: unknown) => Promise<void>;
    saveDisplayName?: (name: string) => Promise<unknown>;
  };
  ratings?: {
    openQuickRate?: (movie: unknown) => void;
    openQuickEdit?: (id: string | number, opts?: unknown) => void;
    resetForm?: () => void;
    editEntry?: (id: string | number) => Promise<void>;
    deleteEntry?: (id: string | number) => Promise<void>;
  };
  list?: {
    renderList?: () => void;
    showDetail?: (id: string | number) => Promise<void>;
    locateAndGoToList?: (id: string | number) => void;
    addToWatchlist?: (movie: unknown) => Promise<void>;
    getControls?: () => unknown;
    updateControls?: (patch: unknown) => void;
    addMyRating?: (id: string | number) => void;
    toggleWatchlist?: (tmdbId: number, movie?: unknown) => Promise<void>;
    showListItemDetail?: (movie: unknown) => Promise<void>;
  };
  stats?: {
    renderStats?: () => void;
    getControls?: () => unknown;
    updateControls?: (patch: unknown) => void;
  };
  discover?: {
    renderDiscover?: () => Promise<void>;
    loadRecommendations?: () => Promise<unknown>;
    loadTrending?: () => Promise<unknown>;
    loadTopRated?: () => Promise<unknown>;
    getControls?: () => unknown;
    updateControls?: (patch: unknown) => void;
    refreshRecommendations?: () => Promise<unknown>;
    setLastShownIds?: (ids: unknown) => void;
    showMovieDetail?: (tmdbId: number) => Promise<void>;
    blockMovie?: (tmdbId: number) => Promise<void>;
  };
  couple?: {
    renderCouple?: () => void;
    loadCoupleState?: () => Promise<void>;
    loadCoupleQueue?: () => Promise<void>;
    addToCoupleQueue?: (movie: unknown) => Promise<void>;
    getControls?: () => unknown;
    updateControls?: (patch: unknown) => void;
    bindCoupleWith?: (userId: string) => Promise<void>;
    confirmCouple?: (coupleId: string | number) => Promise<void>;
    disconnectCouple?: (coupleId: string | number) => Promise<void>;
    moveQueueItem?: (queueId: string | number, direction: number) => Promise<void>;
    removeQueueItem?: (queueId: string | number) => Promise<void>;
    rateQueueItem?: (queueId: string | number) => void;
    showQueueItemDetail?: (queueId: string | number) => Promise<void>;
  };
  importExport?: {
    exportJson?: () => void;
    importJson?: () => void;
  };
  shell?: {
    switchTab?: (name: string) => void;
    renderActiveTab?: () => void;
    closeModal?: () => void;
    loadAllData?: () => Promise<void>;
    getActiveTab?: () => string;
  };
  header?: {
    openChangePasswordModal?: () => void;
    openInviteCodeModal?: () => void;
    openBlockedMoviesModal?: () => void;
    logoutCurrentUser?: () => Promise<void>;
  };
  lists?: {
    removeBlockedMovie?: (tmdbId: number) => Promise<void>;
  };
  state?: {
    getSnapshot?: () => unknown;
    sync?: (reason?: string) => void;
  };
};
