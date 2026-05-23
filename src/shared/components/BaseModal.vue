<script setup lang="ts">
defineOptions({ name: 'BaseModal' });

defineProps<{
  open?: boolean;
  maxWidth?: string;
  labelledBy?: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <div
    v-if="open"
    class="modal-overlay open"
    role="presentation"
    @click.self="emit('close')"
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="labelledBy"
      :style="{ maxWidth: maxWidth || undefined }"
    >
      <slot />
    </div>
  </div>
</template>
