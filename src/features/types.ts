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
  };
  stats?: {
    renderStats?: () => void;
  };
  discover?: {
    renderDiscover?: () => Promise<void>;
    loadRecommendations?: () => Promise<unknown>;
    loadTrending?: () => Promise<unknown>;
    loadTopRated?: () => Promise<unknown>;
  };
  couple?: {
    renderCouple?: () => void;
    loadCoupleState?: () => Promise<void>;
    loadCoupleQueue?: () => Promise<void>;
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
  state?: {
    getSnapshot?: () => unknown;
    sync?: (reason?: string) => void;
  };
};
