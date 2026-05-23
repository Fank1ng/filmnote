import { defineStore } from 'pinia';
import type { Couple, CoupleQueueItem, TmdbMedia } from '../types/domain.js';

type CoupleState = {
  activeCouple: Couple | null;
  pendingCouples: Couple[];
  partnerProfileId: string | null;
  queue: CoupleQueueItem[];
  recommendations: TmdbMedia[];
  recommendationState: string;
  loading: boolean;
};

export const useCoupleStore = defineStore('couple', {
  state: (): CoupleState => ({
    activeCouple: null,
    pendingCouples: [],
    partnerProfileId: null,
    queue: [],
    recommendations: [],
    recommendationState: 'idle',
    loading: false,
  }),
  actions: {
    setActiveCouple(activeCouple: Couple | null) {
      this.activeCouple = activeCouple;
    },
    setPendingCouples(pendingCouples: Couple[]) {
      this.pendingCouples = pendingCouples;
    },
    setPartnerProfileId(partnerProfileId: string | null) {
      this.partnerProfileId = partnerProfileId;
    },
    setQueue(queue: CoupleQueueItem[]) {
      this.queue = queue;
    },
    setRecommendations(recommendations: TmdbMedia[]) {
      this.recommendations = recommendations;
    },
    setRecommendationState(recommendationState: string) {
      this.recommendationState = recommendationState;
    },
    setLoading(loading: boolean) {
      this.loading = loading;
    },
  },
});
