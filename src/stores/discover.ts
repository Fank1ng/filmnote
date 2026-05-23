import { defineStore } from 'pinia';
import type { TmdbMedia } from '../types/domain.js';

export type DiscoverTab = 'recommend' | 'week' | 'toprated';

type DiscoverState = {
  activeTab: DiscoverTab;
  pageByTab: Record<DiscoverTab, number>;
  cache: Record<DiscoverTab, TmdbMedia[] | null>;
  loading: boolean;
  lastRefreshAt: number;
};

export const useDiscoverStore = defineStore('discover', {
  state: (): DiscoverState => ({
    activeTab: 'recommend',
    pageByTab: {
      recommend: 1,
      week: 1,
      toprated: 1,
    },
    cache: {
      recommend: null,
      week: null,
      toprated: null,
    },
    loading: false,
    lastRefreshAt: 0,
  }),
  actions: {
    setActiveTab(activeTab: DiscoverTab) {
      this.activeTab = activeTab;
    },
    setPage(tab: DiscoverTab, page: number) {
      this.pageByTab[tab] = page;
    },
    setCache(tab: DiscoverTab, movies: TmdbMedia[] | null) {
      this.cache[tab] = movies;
    },
    invalidate(tab?: DiscoverTab) {
      if (tab) this.cache[tab] = null;
      else {
        this.cache.recommend = null;
        this.cache.week = null;
        this.cache.toprated = null;
      }
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },
    markRefreshed() {
      this.lastRefreshAt = Date.now();
    },
  },
});
