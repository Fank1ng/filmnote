import { defineStore } from 'pinia';
import type { MediaType } from '../types/domain.js';

export type StatsFilter = 'me' | 'others' | 'compare';

export const useStatsControlsStore = defineStore('statsControls', {
  state: () => ({
    filter: 'me' as StatsFilter,
    type: 'movie' as MediaType,
    otherUser: null as string | null,
  }),
  actions: {
    setType(type: MediaType) {
      this.type = type;
    },
    setFilter(filter: StatsFilter) {
      this.filter = filter;
      if (filter === 'me') this.otherUser = null;
    },
    setOtherUser(otherUser: string | null) {
      this.otherUser = otherUser || null;
    },
  },
});
