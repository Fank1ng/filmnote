<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import FeatureArchitectureRoot from './FeatureArchitectureRoot.vue';
import { requireLegacyBridge, switchLegacyTab } from './legacy-bridge.js';
import { installLegacyStateSync } from './legacy-state-sync.js';
import { AccountModals, AuthOverlay } from '../features/auth/index.js';
import { CouplePanel } from '../features/couple/index.js';
import { DiscoverPanel } from '../features/discover/index.js';
import { ListBody, ListControls, WatchlistGrid } from '../features/list/index.js';
import { QuickRateModal, RatingsSearchPanel } from '../features/ratings/index.js';
import { StatsContent, StatsControls } from '../features/stats/index.js';
import { AppHeader, AppToast, EntryDetailModal, ImportExportToolbar, TabShell } from '../shared/components/index.js';
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
  <Teleport to="#filmnoteVueAuth">
    <AuthOverlay />
  </Teleport>
  <Teleport to="#filmnoteVueHeader">
    <AppHeader
      @change-password="ui.openAccountModal('changePassword')"
      @manage-invites="ui.openAccountModal('invites')"
      @manage-blocked="ui.openAccountModal('blocked')"
      @logout="requireLegacyBridge().header?.logoutCurrentUser?.()"
    />
  </Teleport>
  <Teleport to="#filmnoteVueShell">
    <TabShell :tabs="mainTabs" :active="ui.activeTab" @change="changeTab" />
  </Teleport>
  <Teleport to="#filmnoteVueImportExport">
    <ImportExportToolbar
      @export-json="requireLegacyBridge().importExport?.exportJson?.()"
      @import-json="requireLegacyBridge().importExport?.importJson?.()"
    />
  </Teleport>
  <Teleport to="#filmnoteVueRatingsSearch">
    <RatingsSearchPanel />
  </Teleport>
  <Teleport to="#filmnoteVueListControls">
    <ListControls />
  </Teleport>
  <Teleport to="#filmnoteVueListBody">
    <ListBody />
  </Teleport>
  <Teleport to="#filmnoteVueWatchlistGrid">
    <WatchlistGrid />
  </Teleport>
  <Teleport to="#filmnoteVueStatsControls">
    <StatsControls />
  </Teleport>
  <Teleport to="#filmnoteVueStatsContent">
    <StatsContent />
  </Teleport>
  <Teleport to="#filmnoteVueDiscover">
    <DiscoverPanel />
  </Teleport>
  <Teleport to="#filmnoteVueCouple">
    <CouplePanel />
  </Teleport>
  <AppToast :message="ui.toastMessage" :open="ui.toastOpen" />
  <AccountModals />
  <QuickRateModal />
  <EntryDetailModal />
  <div class="vue-runtime-root" hidden aria-hidden="true">
    <FeatureArchitectureRoot />
  </div>
</template>
