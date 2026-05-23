<script setup lang="ts">
import { importExportFeature } from './feature.js';

defineOptions({ name: 'ImportExportFeature' });
</script>

<template>
  <section hidden aria-hidden="true" :data-feature="importExportFeature.key"></section>
</template>
