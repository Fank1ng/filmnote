<script setup lang="ts">
import { onMounted } from 'vue';
import { onLegacyReady } from './legacy-bridge.js';
import { mountAllFeatures } from '../features/registry.js';
import { AuthFeature } from '../features/auth/index.js';
import { CoupleFeature } from '../features/couple/index.js';
import { DiscoverFeature } from '../features/discover/index.js';
import { ImportExportFeature } from '../features/import-export/index.js';
import { ListFeature } from '../features/list/index.js';
import { RatingsFeature } from '../features/ratings/index.js';
import { StatsFeature } from '../features/stats/index.js';

defineOptions({ name: 'FeatureArchitectureRoot' });

onMounted(() => {
  onLegacyReady(() => {
    void mountAllFeatures();
  });
});
</script>

<template>
  <div hidden aria-hidden="true" data-feature-architecture="vue-pinia">
    <AuthFeature />
    <RatingsFeature />
    <ListFeature />
    <StatsFeature />
    <DiscoverFeature />
    <CoupleFeature />
    <ImportExportFeature />
  </div>
</template>
