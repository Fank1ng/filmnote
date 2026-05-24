<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { getCurrentUser } from '../../app/user-context.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useSessionStore } from '../../stores/session.js';
import { useStatsControlsStore, type StatsFilter } from '../../stores/stats-controls.js';
import type { MediaType } from '../../types/domain.js';

defineOptions({ name: 'StatsControls' });

type UserLike = {
  id?: string;
};

const entries = useEntriesStore();
const session = useSessionStore();
const controls = useStatsControlsStore();
const { filter, type, otherUser } = storeToRefs(controls);

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

function setType(nextType: MediaType): void {
  controls.setType(nextType);
}

function setFilter(nextFilter: StatsFilter): void {
  controls.setFilter(nextFilter);
}
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
      <select v-model="otherUser" @change="controls.setOtherUser(otherUser)">
        <option value="">所有他人</option>
        <option v-for="user in otherUsers" :key="user.user_id" :value="user.user_id">
          {{ user.display_name }}
        </option>
      </select>
    </div>
  </section>
</template>
