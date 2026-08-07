<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { buildExportPayload, downloadExport, importFilmNoteJson } from '../api/import-export-api.js';
import { AccountModals, AuthOverlay } from '../features/auth/index.js';
import { CouplePanel } from '../features/couple/index.js';
import { DiscoverPanel } from '../features/discover/index.js';
import { ListBody, ListControls, WatchlistGrid } from '../features/list/index.js';
import { ProfilePanel } from '../features/profile/index.js';
import { QuickRateModal, RatingsSearchPanel } from '../features/ratings/index.js';
import { StatsContent, StatsControls } from '../features/stats/index.js';
import { AppHeader, AppToast, EntryDetailModal, ImportExportToolbar, MediaDetailModal, TabShell } from '../shared/components/index.js';
import { useConfirm } from '../shared/composables/useConfirm.js';
import { useCoupleStore } from '../stores/couple.js';
import { useEntriesStore } from '../stores/entries.js';
import { useListControlsStore } from '../stores/list-controls.js';
import { useListsStore } from '../stores/lists.js';
import { useSessionStore } from '../stores/session.js';
import { mainTabs, type AppRoute, type MainTab, useUiStore } from '../stores/ui.js';
import { refreshVueData } from './data-sync.js';
import { initializeVueSession, logoutCurrentUser } from './session.js';

defineOptions({ name: 'FilmNoteApp' });

const ui = useUiStore();
const session = useSessionStore();
const entries = useEntriesStore();
const lists = useListsStore();
const couple = useCoupleStore();
const listControls = useListControlsStore();
const { confirmAction } = useConfirm();

const authenticated = computed(() => session.isAuthenticated);
let stickyResizeObserver: ResizeObserver | null = null;
let motionMedia: MediaQueryList | null = null;

function updateStickyOffsets(): void {
  const headerHeight = document.querySelector<HTMLElement>('.app-header')?.offsetHeight || 0;
  const tabsHeight = document.querySelector<HTMLElement>('.app-tabs')?.offsetHeight || 0;
  document.documentElement.style.setProperty('--app-header-height', `${headerHeight}px`);
  document.documentElement.style.setProperty('--app-tabs-height', `${tabsHeight}px`);
  document.documentElement.style.setProperty('--page-sticky-top', `${headerHeight + tabsHeight}px`);
}

function observeStickyOffsets(): void {
  stickyResizeObserver = new ResizeObserver(updateStickyOffsets);
  document.querySelectorAll<HTMLElement>('.app-header, .app-tabs').forEach(element => stickyResizeObserver?.observe(element));
  window.addEventListener('resize', updateStickyOffsets);
  updateStickyOffsets();
}

function routeForTab(tab: MainTab): AppRoute {
  if (tab === 'library') return `library/${ui.libraryTab}`;
  if (tab === 'together') return 'together/overview';
  return tab;
}

function navigate(route: AppRoute): void {
  const update = () => ui.navigate(route);
  if (!ui.motionReduced && document.startViewTransition) {
    document.startViewTransition(update).finished.catch(() => undefined);
  } else update();
}

function changeTab(tab: MainTab): void {
  navigate(routeForTab(tab));
}

function setLibraryTab(tab: 'ratings' | 'watchlist' | 'stats'): void {
  navigate(`library/${tab}`);
}

function onHashChange(): void {
  ui.syncRoute();
}

function onMotionPreferenceChange(event: MediaQueryListEvent): void {
  ui.setSystemReducedMotion(event.matches);
}

watch(() => ui.route, route => {
  if (route === 'library/ratings') listControls.setMode('entries');
  if (route === 'library/watchlist') listControls.setMode('watchlist');
  document.querySelector<HTMLElement>('#main-content')?.focus({ preventScroll: true });
}, { flush: 'post' });

watch(() => ui.motionReduced, reduced => {
  document.documentElement.classList.toggle('reduce-motion', reduced);
  if (reduced) document.getAnimations?.().forEach(animation => animation.cancel());
}, { immediate: true });

watch(() => session.currentUser, user => {
  void refreshVueData();
  if (!user && ui.activeTab === 'together') ui.navigate('discover', true);
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

async function logout(): Promise<void> {
  await logoutCurrentUser();
  ui.navigate('discover', true);
}

onMounted(() => {
  motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  ui.setSystemReducedMotion(motionMedia.matches);
  motionMedia.addEventListener('change', onMotionPreferenceChange);
  ui.syncRoute();
  window.addEventListener('hashchange', onHashChange);
  observeStickyOffsets();
  void initializeVueSession();
});

onBeforeUnmount(() => {
  stickyResizeObserver?.disconnect();
  window.removeEventListener('resize', updateStickyOffsets);
  window.removeEventListener('hashchange', onHashChange);
  motionMedia?.removeEventListener('change', onMotionPreferenceChange);
});
</script>

<template>
  <a class="skip-link" href="#main-content">跳到主要内容</a>
  <AuthOverlay />

  <div id="mainApp" :data-route="ui.route" :data-direction="ui.routeDirection">
    <AppHeader
      class="app-header"
      @change-password="ui.openAccountModal('changePassword')"
      @login="ui.openAuthModal('login')"
      @manage-invites="ui.openAccountModal('invites')"
      @manage-blocked="ui.openAccountModal('blocked')"
      @manage-couple="ui.openAccountModal('couple')"
      @register="ui.openAuthModal('register')"
      @logout="logout"
    />
    <TabShell class="app-tabs" :tabs="mainTabs" :active="ui.activeTab" @change="changeTab" />

    <main id="main-content" tabindex="-1">
      <section v-show="ui.activeTab === 'discover'" id="panel-discover" class="app-screen" :class="{ active: ui.activeTab === 'discover' }">
        <DiscoverPanel />
      </section>

      <section v-show="ui.activeTab === 'library'" id="panel-library" class="app-screen" :class="{ active: ui.activeTab === 'library' }">
        <header class="page-heading compact-heading"><p class="eyebrow">YOUR FILM SHELVES</p><h1>影库</h1><p>评价、想看和统计保持在同一条胶片轨道上。</p></header>
        <div class="route-subtabs" role="tablist" aria-label="影库视图">
          <button type="button" :class="{ active: ui.libraryTab === 'ratings' }" @click="setLibraryTab('ratings')">评价记录</button>
          <button type="button" :class="{ active: ui.libraryTab === 'watchlist' }" @click="setLibraryTab('watchlist')">想看清单</button>
          <button type="button" :class="{ active: ui.libraryTab === 'stats' }" @click="setLibraryTab('stats')">统计分析</button>
        </div>
        <div class="subpage-stage" :data-subpage="ui.libraryTab">
          <div v-show="ui.libraryTab === 'ratings'" class="route-subpage"><ListControls /><ListBody /></div>
          <div v-show="ui.libraryTab === 'watchlist'" class="route-subpage">
            <div v-if="!authenticated" class="auth-gate midnight-card"><h2>登录后查看想看清单</h2><p>公开评价仍可浏览，你的个人清单只在登录后加载。</p><button class="btn btn-primary" type="button" @click="ui.openAuthModal('login')">登录</button></div>
            <template v-else><ListControls /><WatchlistGrid /></template>
          </div>
          <div v-show="ui.libraryTab === 'stats'" class="route-subpage"><StatsControls /><StatsContent /><ImportExportToolbar @export-json="exportJson" @import-json="importJson" /></div>
        </div>
      </section>

      <section v-show="ui.activeTab === 'record'" id="panel-record" class="app-screen record-screen" :class="{ active: ui.activeTab === 'record' }">
        <header class="page-heading compact-heading"><p class="eyebrow">NOW RECORDING</p><h1>记录一部电影</h1><p>从选片到六维评分，保持同一段视觉连续性。</p></header>
        <RatingsSearchPanel />
      </section>

      <section v-show="ui.activeTab === 'together'" id="panel-together" class="app-screen" :class="{ active: ui.activeTab === 'together' }">
        <div v-if="!authenticated">
          <header class="page-heading compact-heading"><p class="eyebrow">TWO SEATS, ONE SCREEN</p><h1>我们的放映厅</h1><p>双人档案、共同推荐和下一部电影。</p></header>
          <div class="auth-gate midnight-card"><h2>登录后进入双人放映厅</h2><p>登录不会改变当前入口，完成后可继续查看 Couple 档案。</p><button class="btn btn-primary" type="button" @click="ui.openAuthModal('login')">登录</button></div>
        </div>
        <CouplePanel v-else :active-tab="ui.togetherTab" />
      </section>

      <section v-show="ui.activeTab === 'profile'" id="panel-profile" class="app-screen" :class="{ active: ui.activeTab === 'profile' }">
        <ProfilePanel @export-json="exportJson" @import-json="importJson" @logout="logout" />
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
