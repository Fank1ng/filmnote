<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { getLegacyBridge, onLegacyReady } from '../../app/legacy-bridge.js';
import { useListsStore } from '../../stores/lists.js';
import type { MediaType } from '../../types/domain.js';

defineOptions({ name: 'ListControls' });

type ListMode = 'entries' | 'watchlist';
type OwnerFilter = 'all' | 'me';
type SortBy = 'date-desc' | 'date-asc' | 'score-desc' | 'score-asc' | 'count-desc' | 'title';
type ScoreFilter = 'all' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2' | '1';

type ListControlState = {
  mode?: ListMode;
  type?: MediaType;
  owner?: OwnerFilter;
  search?: string;
  sort?: SortBy;
  score?: ScoreFilter;
};

const lists = useListsStore();

const mode = ref<ListMode>('entries');
const type = ref<MediaType>('movie');
const owner = ref<OwnerFilter>('all');
const search = ref('');
const sort = ref<SortBy>('date-desc');
const score = ref<ScoreFilter>('all');
let stopLegacyReady: (() => void) | null = null;
let searchTimer: number | null = null;
let suppressSync = false;

const watchlistCount = computed(() => lists.watchlist.length);

function asControlState(input: unknown): ListControlState {
  return (input || {}) as ListControlState;
}

function applyState(state: ListControlState): void {
  suppressSync = true;
  mode.value = state.mode === 'watchlist' ? 'watchlist' : 'entries';
  type.value = state.type === 'series' ? 'series' : 'movie';
  owner.value = state.owner === 'me' ? 'me' : 'all';
  search.value = state.search || '';
  sort.value = state.sort || 'date-desc';
  score.value = state.score || 'all';
  queueMicrotask(() => {
    suppressSync = false;
  });
}

function syncToLegacy(patch: ListControlState): void {
  if (suppressSync) return;
  notifyControlsChanged();
  getLegacyBridge()?.list?.updateControls?.(patch);
}

function currentControls(): ListControlState {
  return {
    mode: mode.value,
    type: type.value,
    owner: owner.value,
    search: search.value,
    sort: sort.value,
    score: score.value,
  };
}

function notifyControlsChanged(): void {
  window.dispatchEvent(new CustomEvent('filmnote:list-controls', { detail: currentControls() }));
}

function syncAllToLegacy(): void {
  syncToLegacy(currentControls());
}

function setMode(nextMode: ListMode): void {
  mode.value = nextMode;
}

function setType(nextType: MediaType): void {
  type.value = nextType;
}

function onLegacyControls(event: Event): void {
  applyState(asControlState((event as CustomEvent<ListControlState>).detail));
}

watch(mode, value => syncToLegacy({ mode: value }));
watch(type, value => syncToLegacy({ type: value }));
watch(owner, value => syncToLegacy({ owner: value }));
watch(sort, value => syncToLegacy({ sort: value }));
watch(score, value => syncToLegacy({ score: value }));
watch(search, value => {
  if (suppressSync) return;
  if (searchTimer) window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => syncToLegacy({ search: value }), 180);
});

onMounted(() => {
  stopLegacyReady = onLegacyReady(bridge => {
    applyState(asControlState(bridge.list?.getControls?.()));
    queueMicrotask(syncAllToLegacy);
  });
  window.addEventListener('filmnote:list-controls', onLegacyControls);
});

onBeforeUnmount(() => {
  stopLegacyReady?.();
  window.removeEventListener('filmnote:list-controls', onLegacyControls);
  if (searchTimer) window.clearTimeout(searchTimer);
});
</script>

<template>
  <section class="vue-list-controls">
    <div class="section-title-switch" aria-label="影单视图">
      <button type="button" :class="{ active: mode === 'entries' }" @click="setMode('entries')">我的影单</button>
      <button type="button" :class="{ active: mode === 'watchlist' }" @click="setMode('watchlist')">
        想看清单 <span>{{ watchlistCount }}</span>
      </button>
    </div>

    <div v-if="mode === 'entries'" class="list-subtabs">
      <button type="button" :class="{ active: type === 'movie' }" @click="setType('movie')">电影</button>
      <button type="button" :class="{ active: type === 'series' }" @click="setType('series')">剧集</button>
    </div>

    <div v-if="mode === 'entries'" class="list-controls">
      <input v-model="search" type="text" class="search-box" placeholder="搜索片名 / 导演 / 演员...">
      <select v-model="sort">
        <option value="date-desc">最近添加</option>
        <option value="date-asc">最早添加</option>
        <option value="score-desc">评分最高</option>
        <option value="score-asc">评分最低</option>
        <option value="count-desc">评价数量</option>
        <option value="title">按片名 A-Z</option>
      </select>
      <select v-model="owner">
        <option value="all">所有人</option>
        <option value="me">仅自己</option>
      </select>
      <select v-model="score">
        <option value="all">全部分数</option>
        <option value="10">10分</option>
        <option value="9">9分</option>
        <option value="8">8分</option>
        <option value="7">7分</option>
        <option value="6">6分</option>
        <option value="5">5分</option>
        <option value="4">4分</option>
        <option value="3">3分</option>
        <option value="2">2分</option>
        <option value="1">1分</option>
      </select>
    </div>
  </section>
</template>
