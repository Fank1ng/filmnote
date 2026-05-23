<script setup lang="ts" generic="TName extends string">
defineOptions({ name: 'TabShell' });

defineProps<{
  tabs: Array<{ name: TName; label: string; ariaLabel?: string }>;
  active: TName;
}>();

const emit = defineEmits<{
  change: [name: TName];
}>();
</script>

<template>
  <nav role="tablist" aria-label="主导航">
    <button
      v-for="tab in tabs"
      :key="tab.name"
      :class="{ active: tab.name === active }"
      :data-tab="tab.name"
      role="tab"
      :aria-selected="tab.name === active"
      :aria-label="tab.ariaLabel || tab.label"
      @click="emit('change', tab.name)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>
