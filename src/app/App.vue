<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import FeatureArchitectureRoot from './FeatureArchitectureRoot.vue';
import { requireLegacyBridge, switchLegacyTab } from './legacy-bridge.js';
import { installLegacyStateSync } from './legacy-state-sync.js';
import { AppHeader, AppToast, TabShell } from '../shared/components/index.js';
import { mainTabs, type MainTab, useUiStore } from '../stores/ui.js';

defineOptions({ name: 'FilmNoteApp' });

const ui = useUiStore();
let stopLegacyStateSync: (() => void) | null = null;

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
  stopLegacyStateSync = installLegacyStateSync();
  window.addEventListener('filmnote:tab-change', onTabChange);
});

onUnmounted(() => {
  window.removeEventListener('filmnote:tab-change', onTabChange);
  stopLegacyStateSync?.();
  stopLegacyStateSync = null;
  delete window.FilmNoteVueUi;
});
</script>

<template>
  <Teleport to="#filmnoteVueHeader">
    <AppHeader
      @change-password="requireLegacyBridge().header?.openChangePasswordModal?.()"
      @manage-invites="requireLegacyBridge().header?.openInviteCodeModal?.()"
      @manage-blocked="requireLegacyBridge().header?.openBlockedMoviesModal?.()"
      @logout="requireLegacyBridge().header?.logoutCurrentUser?.()"
    />
  </Teleport>
  <Teleport to="#filmnoteVueShell">
    <TabShell :tabs="mainTabs" :active="ui.activeTab" @change="changeTab" />
  </Teleport>
  <AppToast :message="ui.toastMessage" :open="ui.toastOpen" />
  <div class="vue-runtime-root" hidden aria-hidden="true">
    <FeatureArchitectureRoot />
  </div>
</template>
