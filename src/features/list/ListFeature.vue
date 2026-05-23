<script setup lang="ts">
import { listFeature } from './feature.js';

defineOptions({ name: 'ListFeature' });
</script>

<template>
  <section hidden aria-hidden="true" :data-feature="listFeature.key"></section>
</template>
