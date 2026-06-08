<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { buildExportPayload, downloadExport, importFilmNoteJson } from '../api/import-export-api.js';
import { refreshVueData } from './data-sync.js';
import { initializeVueSession, logoutCurrentUser } from './session.js';
import { AccountModals, AuthOverlay } from '../features/auth/index.js';
import { CouplePanel } from '../features/couple/index.js';
import { DiscoverPanel } from '../features/discover/index.js';
import { ListBody, ListControls, WatchlistGrid } from '../features/list/index.js';
import { QuickRateModal, RatingsSearchPanel } from '../features/ratings/index.js';
import { StatsContent, StatsControls } from '../features/stats/index.js';
import { AppHeader, AppToast, EntryDetailModal, ImportExportToolbar, MediaDetailModal, TabShell } from '../shared/components/index.js';
import { useConfirm } from '../shared/composables/useConfirm.js';
import { useCoupleStore } from '../stores/couple.js';
import { useEntriesStore } from '../stores/entries.js';
import { useListsStore } from '../stores/lists.js';
import { useSessionStore } from '../stores/session.js';
import { mainTabs, type MainTab, useUiStore } from '../stores/ui.js';

defineOptions({ name: 'FilmNoteApp' });

const ui = useUiStore();
const session = useSessionStore();
const entries = useEntriesStore();
const lists = useListsStore();
const couple = useCoupleStore();
const { confirmAction } = useConfirm();

const authenticated = computed(() => session.isAuthenticated);
const visibleTabs = computed(() => authenticated.value ? mainTabs : mainTabs.filter(tab => tab.name !== 'couple'));
let stickyResizeObserver: ResizeObserver | null = null;

function updateStickyOffsets(): void {
  const headerHeight = document.querySelector<HTMLElement>('.app-header')?.offsetHeight || 0;
  const tabsHeight = document.querySelector<HTMLElement>('.app-tabs')?.offsetHeight || 0;
  document.documentElement.style.setProperty('--app-header-height', `${headerHeight}px`);
  document.documentElement.style.setProperty('--app-tabs-height', `${tabsHeight}px`);
  document.documentElement.style.setProperty('--page-sticky-top', `${headerHeight + tabsHeight}px`);
}

function observeStickyOffsets(): void {
  stickyResizeObserver = new ResizeObserver(updateStickyOffsets);
  document.querySelectorAll<HTMLElement>('.app-header, .app-tabs').forEach(element => {
    stickyResizeObserver?.observe(element);
  });
  window.addEventListener('resize', updateStickyOffsets);
  updateStickyOffsets();
}

function changeTab(tab: MainTab): void {
  if (tab === 'couple' && !authenticated.value) {
    ui.openAuthModal('login');
    return;
  }
  ui.setActiveTab(tab);
}

watch(() => session.currentUser, user => {
  void refreshVueData();
  if (!user && ui.activeTab === 'couple') ui.setActiveTab('rate');
}, { flush: 'post' });

watch(authenticated, async isAuthenticated => {
  if (!isAuthenticated) return;
  await nextTick();
  updateStickyOffsets();
}, { flush: 'post' });

function currentUserId(): string {
  return (session.currentUser as { id?: string } | null)?.id || '';
}

function exportJson(): void {
  const userId = currentUserId();
  if (!userId) {
    ui.openAuthModal('login');
    ui.showToast('请先登录后导出');
    return;
  }
  downloadExport(buildExportPayload({
    entries: entries.entries.filter(entry => entry.user_id === userId),
    season_ratings: entries.seasonRatings.filter(season => season.user_id === userId),
    watchlist: lists.watchlist.filter(item => item.user_id === userId),
    blocked_movies: lists.blockedMovies.filter(item => item.user_id === userId),
    couple_queue: couple.queue,
  }));
}

async function importJson(file: File): Promise<void> {
  const userId = currentUserId();
  if (!userId) {
    ui.openAuthModal('login');
    ui.showToast('请先登录后导入');
    return;
  }
  try {
    const payload = JSON.parse(await file.text());
    const rows = Array.isArray(payload) ? payload : payload.entries;
    if (!Array.isArray(rows)) throw new Error('格式错误');
    if (!confirmAction(`将导入 ${rows.length} 条记录，确认？`)) return;
    const count = await importFilmNoteJson(userId, payload);
    await refreshVueData();
    ui.showToast(`已导入 ${count} 条记录`);
  } catch {
    ui.showToast('导入失败：文件格式不正确');
  }
}

onMounted(() => {
  observeStickyOffsets();
  void initializeVueSession();
});

onBeforeUnmount(() => {
  stickyResizeObserver?.disconnect();
  window.removeEventListener('resize', updateStickyOffsets);
});
</script>

<template>
  <AuthOverlay />

  <div id="mainApp">
    <AppHeader
      class="app-header"
      @change-password="ui.openAccountModal('changePassword')"
      @login="ui.openAuthModal('login')"
      @manage-invites="ui.openAccountModal('invites')"
      @manage-blocked="ui.openAccountModal('blocked')"
      @manage-couple="ui.openAccountModal('couple')"
      @register="ui.openAuthModal('register')"
      @logout="logoutCurrentUser()"
    />
    <TabShell class="app-tabs" :tabs="visibleTabs" :active="ui.activeTab" @change="changeTab" />

    <main>
      <section id="panel-rate" class="tab-panel" :class="{ active: ui.activeTab === 'rate' }">
        <RatingsSearchPanel />
      </section>

      <section id="panel-list" class="tab-panel" :class="{ active: ui.activeTab === 'list' }">
        <ListControls />
        <ListBody />
        <WatchlistGrid />
      </section>

      <section id="panel-discover" class="tab-panel" :class="{ active: ui.activeTab === 'discover' }">
        <DiscoverPanel />
      </section>

      <section v-if="authenticated" id="panel-couple" class="tab-panel" :class="{ active: ui.activeTab === 'couple' }">
        <CouplePanel />
      </section>

      <section id="panel-stats" class="tab-panel" :class="{ active: ui.activeTab === 'stats' }">
        <h2 class="section-title">统计概览</h2>
        <StatsControls />
        <StatsContent />
        <ImportExportToolbar @export-json="exportJson" @import-json="importJson" />
      </section>
    </main>
  </div>

  <AppToast :message="ui.toastMessage" :open="ui.toastOpen" />
  <AccountModals />
  <QuickRateModal />
  <EntryDetailModal />
  <MediaDetailModal />
</template>

<style src="./styles.css"></style>
