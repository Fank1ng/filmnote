<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { getLegacyBridge, onLegacyReady } from '../../app/legacy-bridge.js';
import { getCurrentUser } from '../../app/user-context.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useSessionStore } from '../../stores/session.js';
import type { MediaType } from '../../types/domain.js';
import { asStatsControlState, type StatsControlState, type StatsFilter } from './state.js';

defineOptions({ name: 'StatsControls' });

type UserLike = {
  id?: string;
};

const entries = useEntriesStore();
const session = useSessionStore();

const filter = ref<StatsFilter>('me');
const type = ref<MediaType>('movie');
const otherUser = ref('');
let suppressSync = false;
let stopLegacyReady: (() => void) | null = null;

const currentUser = computed(() => getCurrentUser<UserLike>(session.currentUser));
const otherUsers = computed(() => {
  const currentId = currentUser.value?.id;
  const ids = [...new Set(entries.entries.filter(entry => entry.user_id !== currentId).map(entry => entry.user_id))];
  return ids.map(userId => ({
    user_id: userId,
    display_name: entries.profiles[userId]?.display_name || String(userId).slice(0, 8),
  }));
});
const showUserPicker = computed(() => (filter.value === 'others' || filter.value === 'compare') && otherUsers.value.length > 0);

function applyState(state: StatsControlState): void {
  suppressSync = true;
  if ('filter' in state) filter.value = state.filter === 'others' || state.filter === 'compare' ? state.filter : 'me';
  if ('type' in state) type.value = state.type === 'series' ? 'series' : 'movie';
  if ('otherUser' in state) otherUser.value = state.otherUser || '';
  queueMicrotask(() => {
    suppressSync = false;
  });
}

function syncToLegacy(patch: StatsControlState): void {
  if (suppressSync) return;
  notifyControlsChanged();
  getLegacyBridge()?.stats?.updateControls?.(patch);
}

function currentControls(): StatsControlState {
  return {
    filter: filter.value,
    type: type.value,
    otherUser: filter.value === 'me' ? null : otherUser.value || null,
  };
}

function notifyControlsChanged(): void {
  window.dispatchEvent(new CustomEvent('filmnote:stats-controls', { detail: currentControls() }));
}

function setType(nextType: MediaType): void {
  type.value = nextType;
}

function setFilter(nextFilter: StatsFilter): void {
  filter.value = nextFilter;
  if (nextFilter === 'me') otherUser.value = '';
}

function onLegacyControls(event: Event): void {
  applyState(asStatsControlState((event as CustomEvent<StatsControlState>).detail));
}

watch(type, value => syncToLegacy({ type: value }));
watch(filter, value => syncToLegacy({ filter: value, otherUser: value === 'me' ? null : otherUser.value || null }));
watch(otherUser, value => {
  if (filter.value !== 'me') syncToLegacy({ otherUser: value || null });
});

onMounted(() => {
  stopLegacyReady = onLegacyReady(bridge => applyState(asStatsControlState(bridge.stats?.getControls?.())));
  window.addEventListener('filmnote:stats-controls', onLegacyControls);
});

onBeforeUnmount(() => {
  stopLegacyReady?.();
  window.removeEventListener('filmnote:stats-controls', onLegacyControls);
});
</script>

<template>
  <section class="vue-stats-controls">
    <div class="list-subtabs">
      <button type="button" :class="{ active: type === 'movie' }" @click="setType('movie')">电影</button>
      <button type="button" :class="{ active: type === 'series' }" @click="setType('series')">剧集</button>
    </div>

    <div class="list-subtabs stats-filter-tabs">
      <button type="button" :class="{ active: filter === 'me' }" @click="setFilter('me')">自己</button>
      <button type="button" :class="{ active: filter === 'others' }" @click="setFilter('others')">他人</button>
      <button type="button" :class="{ active: filter === 'compare' }" @click="setFilter('compare')">对比</button>
    </div>

    <div v-if="showUserPicker" class="stats-user-row">
      <select v-model="otherUser">
        <option value="">所有他人</option>
        <option v-for="user in otherUsers" :key="user.user_id" :value="user.user_id">
          {{ user.display_name }}
        </option>
      </select>
    </div>
  </section>
</template>
