<script setup lang="ts" generic="TName extends string">
defineOptions({ name: 'TabShell' });

defineProps<{
  tabs: Array<{ name: TName; label: string; ariaLabel?: string; icon?: string }>;
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
      <svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
        <template v-if="tab.icon === 'discover'"><circle cx="12" cy="12" r="8"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/></template>
        <template v-else-if="tab.icon === 'library'"><path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4Z"/><path d="M7 16h12M9 8h6"/></template>
        <template v-else-if="tab.icon === 'record'"><circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/></template>
        <template v-else-if="tab.icon === 'together'"><circle cx="8.5" cy="9" r="3"/><circle cx="15.5" cy="9" r="3"/><path d="M3.5 19c.4-3 2.1-4.5 5-4.5S13.1 16 13.5 19M10.5 19c.4-3 2.1-4.5 5-4.5s4.6 1.5 5 4.5"/></template>
        <template v-else><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.5-4 2.8-6 7-6s6.5 2 7 6"/></template>
      </svg>
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>
