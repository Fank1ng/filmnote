<script setup lang="ts">
import { coupleFeature } from './feature.js';

defineOptions({ name: 'CoupleFeature' });
</script>

<template>
  <section hidden aria-hidden="true" :data-feature="coupleFeature.key"></section>
</template>
