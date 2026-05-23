<script setup lang="ts">
defineOptions({ name: 'AppToast' });

defineProps<{
  message?: string;
  open?: boolean;
}>();
</script>

<template>
  <div class="toast" :class="{ show: open }" role="status" aria-live="polite">
    {{ message }}
  </div>
</template>
