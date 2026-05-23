<script setup lang="ts">
import { statsFeature } from './feature.js';

defineOptions({ name: 'StatsFeature' });
</script>

<template>
  <section hidden aria-hidden="true" :data-feature="statsFeature.key"></section>
</template>
