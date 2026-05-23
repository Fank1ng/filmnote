import { defineStore } from 'pinia';

type MainTab = 'rate' | 'list' | 'discover' | 'couple' | 'stats';

type UiState = {
  activeTab: MainTab;
  toastMessage: string;
  toastOpen: boolean;
  toastTimer: number | null;
};

export const mainTabs: Array<{ name: MainTab; label: string; ariaLabel: string }> = [
  { name: 'rate', label: '搜索', ariaLabel: '搜索' },
  { name: 'list', label: '影单', ariaLabel: '影单' },
  { name: 'discover', label: '发现', ariaLabel: '发现好片' },
  { name: 'couple', label: 'Couple', ariaLabel: 'Couple' },
  { name: 'stats', label: '统计分析', ariaLabel: '统计分析' },
];

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    activeTab: 'rate',
    toastMessage: '',
    toastOpen: false,
    toastTimer: null,
  }),
  actions: {
    setActiveTab(activeTab: MainTab) {
      this.activeTab = activeTab;
    },
    showToast(message: string) {
      if (this.toastTimer) window.clearTimeout(this.toastTimer);
      this.toastMessage = message;
      this.toastOpen = true;
      this.toastTimer = window.setTimeout(() => {
        this.toastOpen = false;
        this.toastTimer = null;
      }, 2500);
    },
  },
});

export type { MainTab };
