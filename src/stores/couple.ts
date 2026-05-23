import { defineStore } from 'pinia';
import type { Couple, CoupleQueueItem, TmdbMedia } from '../types/domain.js';

type CoupleState = {
  activeCouple: Couple | null;
  pendingCouples: Couple[];
  partnerProfileId: string | null;
  queue: CoupleQueueItem[];
  recommendations: TmdbMedia[];
  loading: boolean;
};

export const useCoupleStore = defineStore('couple', {
  state: (): CoupleState => ({
    activeCouple: null,
    pendingCouples: [],
    partnerProfileId: null,
    queue: [],
    recommendations: [],
    loading: false,
  }),
  actions: {
    setActiveCouple(activeCouple: Couple | null) {
      this.activeCouple = activeCouple;
    },
    setPendingCouples(pendingCouples: Couple[]) {
      this.pendingCouples = pendingCouples;
    },
    setQueue(queue: CoupleQueueItem[]) {
      this.queue = queue;
    },
    setRecommendations(recommendations: TmdbMedia[]) {
      this.recommendations = recommendations;
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
});
