<script setup lang="ts">
defineOptions({ name: 'EmptyState' });

defineProps<{
  icon?: string;
  title?: string;
  detail?: string;
  loading?: boolean;
}>();
</script>

<template>
  <div class="empty-state">
    <div v-if="loading" class="spinner"></div>
    <p v-else-if="icon" style="font-size:2rem">{{ icon }}</p>
    <p v-if="title">{{ title }}</p>
    <p v-if="detail" style="font-size:0.8rem;color:var(--text2);margin-top:8px">{{ detail }}</p>
  </div>
</template>
