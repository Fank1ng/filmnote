<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import FeatureArchitectureRoot from './FeatureArchitectureRoot.vue';
import { switchLegacyTab } from './legacy-bridge.js';
import { AppToast, TabShell } from '../shared/components/index.js';
import { mainTabs, type MainTab, useUiStore } from '../stores/ui.js';

defineOptions({ name: 'FilmNoteApp' });

const ui = useUiStore();

function onTabChange(event: Event): void {
  const tab = (event as CustomEvent<{ tab?: MainTab }>).detail?.tab;
  if (tab && mainTabs.some(item => item.name === tab)) {
    ui.setActiveTab(tab);
  }
}

function changeTab(tab: MainTab): void {
  ui.setActiveTab(tab);
  switchLegacyTab(tab);
}

onMounted(() => {
  window.FilmNoteVueUi = {
    toast: (message: string) => ui.showToast(message),
  };
  window.addEventListener('filmnote:tab-change', onTabChange);
});

onUnmounted(() => {
  window.removeEventListener('filmnote:tab-change', onTabChange);
  delete window.FilmNoteVueUi;
});
</script>

<template>
  <Teleport to="#filmnoteVueShell">
    <TabShell :tabs="mainTabs" :active="ui.activeTab" @change="changeTab" />
  </Teleport>
  <AppToast :message="ui.toastMessage" :open="ui.toastOpen" />
  <div class="vue-runtime-root" hidden aria-hidden="true">
    <FeatureArchitectureRoot />
  </div>
</template>
