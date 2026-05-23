<script setup lang="ts">
import { discoverFeature } from './feature.js';

defineOptions({ name: 'DiscoverFeature' });
</script>

<template>
  <section hidden aria-hidden="true" :data-feature="discoverFeature.key"></section>
</template>
