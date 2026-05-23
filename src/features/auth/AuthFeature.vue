<script setup lang="ts">
import { authFeature } from './feature.js';

defineOptions({ name: 'AuthFeature' });
</script>

<template>
  <section hidden aria-hidden="true" :data-feature="authFeature.key"></section>
</template>
