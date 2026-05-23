<script setup lang="ts">
import { ratingsFeature } from './feature.js';

defineOptions({ name: 'RatingsFeature' });
</script>

<template>
  <section hidden aria-hidden="true" :data-feature="ratingsFeature.key"></section>
</template>
