<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

defineOptions({ name: 'BaseModal' });

const props = defineProps<{
  open?: boolean;
  maxWidth?: string;
  labelledBy?: string;
}>();

const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLElement | null>(null);
let returnFocus: HTMLElement | null = null;

function focusableElements(): HTMLElement[] {
  if (!dialog.value) return [];
  return [...dialog.value.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(element => !element.hasAttribute('hidden') && element.offsetParent !== null);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
    return;
  }
  if (event.key !== 'Tab') return;
  const focusable = focusableElements();
  if (!focusable.length) {
    event.preventDefault();
    dialog.value?.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(() => props.open, async open => {
  if (open) {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.documentElement.classList.add('modal-open');
    await nextTick();
    (focusableElements()[0] || dialog.value)?.focus({ preventScroll: true });
  } else {
    document.documentElement.classList.remove('modal-open');
    returnFocus?.focus({ preventScroll: true });
    returnFocus = null;
  }
}, { immediate: true });

onBeforeUnmount(() => document.documentElement.classList.remove('modal-open'));
</script>

<template>
  <div v-if="open" class="modal-overlay open" role="presentation" @click.self="emit('close')">
    <div
      ref="dialog"
      class="modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="labelledBy"
      :style="{ maxWidth: maxWidth || undefined }"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <slot />
    </div>
  </div>
</template>
