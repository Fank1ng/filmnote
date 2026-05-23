import { defineStore } from 'pinia';
import type { FeatureKey } from '../features/types.js';

type LegacyFeatureState = {
  ready: boolean;
  activeTab: string | null;
  mountedFeatures: FeatureKey[];
};

export const useLegacyStore = defineStore('legacy', {
  state: (): LegacyFeatureState => ({
    ready: false,
    activeTab: null,
    mountedFeatures: [],
  }),
  actions: {
    markReady(activeTab: string | null = null) {
      this.ready = true;
      this.activeTab = activeTab;
    },
    setActiveTab(activeTab: string | null) {
      this.activeTab = activeTab;
    },
    markFeatureMounted(feature: FeatureKey) {
      if (!this.mountedFeatures.includes(feature)) {
        this.mountedFeatures.push(feature);
      }
    },
  },
});
