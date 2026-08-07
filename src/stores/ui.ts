import { defineStore } from 'pinia';
import { clearBrowserTimeout, scheduleBrowserTimeout } from '../shared/browser.js';

type MainTab = 'discover' | 'library' | 'record' | 'together' | 'profile';
type LibraryTab = 'ratings' | 'watchlist' | 'stats';
type TogetherTab = 'overview' | 'archive' | 'recommend' | 'queue';
type AppRoute =
  | 'discover'
  | `library/${LibraryTab}`
  | 'record'
  | `together/${TogetherTab}`
  | 'profile';
type AccountModal = 'changePassword' | 'invites' | 'blocked' | 'couple' | null;
type AuthModalMode = 'login' | 'register' | 'reset';

const MOTION_KEY = 'filmnote_reduce_motion';
const validRoutes = new Set<AppRoute>([
  'discover',
  'library/ratings',
  'library/watchlist',
  'library/stats',
  'record',
  'together/overview',
  'together/archive',
  'together/recommend',
  'together/queue',
  'profile',
]);

function savedReducedMotion(): boolean {
  try {
    return localStorage.getItem(MOTION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function normalizeAppRoute(hash = ''): AppRoute {
  const candidate = hash.replace(/^#\/?/, '').replace(/\/$/, '') as AppRoute;
  return validRoutes.has(candidate) ? candidate : 'discover';
}

function routeRoot(route: AppRoute): MainTab {
  return route.split('/')[0] as MainTab;
}

type UiState = {
  activeTab: MainTab;
  route: AppRoute;
  routeDirection: -1 | 0 | 1;
  accountModal: AccountModal;
  authModalOpen: boolean;
  authMode: AuthModalMode;
  highlightEntryId: string | number | null;
  reducedMotion: boolean;
  systemReducedMotion: boolean;
  toastMessage: string;
  toastOpen: boolean;
  toastTimer: number | null;
};

export const mainTabs: Array<{ name: MainTab; label: string; href: `#${AppRoute}`; icon: MainTab }> = [
  { name: 'discover', label: '发现', href: '#discover', icon: 'discover' },
  { name: 'library', label: '影库', href: '#library/ratings', icon: 'library' },
  { name: 'record', label: '记录', href: '#record', icon: 'record' },
  { name: 'together', label: '我们', href: '#together/overview', icon: 'together' },
  { name: 'profile', label: '我的', href: '#profile', icon: 'profile' },
];

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    activeTab: 'discover',
    route: 'discover',
    routeDirection: 0,
    accountModal: null,
    authModalOpen: false,
    authMode: 'login',
    highlightEntryId: null,
    reducedMotion: savedReducedMotion(),
    systemReducedMotion: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    toastMessage: '',
    toastOpen: false,
    toastTimer: null,
  }),
  getters: {
    motionReduced: state => state.reducedMotion || state.systemReducedMotion,
    libraryTab: state => (state.route.startsWith('library/') ? state.route.split('/')[1] : 'ratings') as LibraryTab,
    togetherTab: state => (state.route.startsWith('together/') ? state.route.split('/')[1] : 'overview') as TogetherTab,
  },
  actions: {
    syncRoute(hash = window.location.hash) {
      const next = normalizeAppRoute(hash);
      const order: AppRoute[] = [
        'discover', 'library/ratings', 'library/watchlist', 'library/stats', 'record', 'together/overview',
        'together/archive', 'together/recommend', 'together/queue', 'profile',
      ];
      const previousIndex = order.indexOf(this.route);
      const nextIndex = order.indexOf(next);
      this.routeDirection = nextIndex === previousIndex ? 0 : nextIndex > previousIndex ? 1 : -1;
      this.route = next;
      this.activeTab = routeRoot(next);
      if (hash !== `#${next}`) history.replaceState(null, '', `#${next}`);
    },
    navigate(route: AppRoute, replace = false) {
      const normalized = normalizeAppRoute(`#${route}`);
      if (replace) history.replaceState(null, '', `#${normalized}`);
      else if (window.location.hash !== `#${normalized}`) window.location.hash = normalized;
      this.syncRoute(`#${normalized}`);
    },
    setActiveTab(activeTab: MainTab) {
      const destination: Record<MainTab, AppRoute> = {
        discover: 'discover',
        library: 'library/ratings',
        record: 'record',
        together: 'together/overview',
        profile: 'profile',
      };
      this.navigate(destination[activeTab]);
    },
    setReducedMotion(value: boolean) {
      this.reducedMotion = value;
      try {
        localStorage.setItem(MOTION_KEY, String(value));
      } catch {
        // The preference remains active for this session when storage is unavailable.
      }
    },
    setSystemReducedMotion(value: boolean) {
      this.systemReducedMotion = value;
    },
    openAccountModal(accountModal: Exclude<AccountModal, null>) {
      this.accountModal = accountModal;
    },
    closeAccountModal() {
      this.accountModal = null;
    },
    openAuthModal(authMode: AuthModalMode = 'login') {
      this.authMode = authMode;
      this.authModalOpen = true;
    },
    closeAuthModal() {
      this.authModalOpen = false;
    },
    setHighlightEntry(id: string | number | null) {
      this.highlightEntryId = id;
    },
    clearHighlightEntry() {
      this.highlightEntryId = null;
    },
    showToast(message: string) {
      clearBrowserTimeout(this.toastTimer);
      this.toastMessage = message;
      this.toastOpen = true;
      this.toastTimer = scheduleBrowserTimeout(() => {
        this.toastOpen = false;
        this.toastTimer = null;
      }, 2500);
    },
  },
});

export type { AccountModal, AppRoute, AuthModalMode, LibraryTab, MainTab, TogetherTab };
