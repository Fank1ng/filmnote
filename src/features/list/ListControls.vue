<script setup lang="ts">
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useListControlsStore } from '../../stores/list-controls.js';
import { useListsStore } from '../../stores/lists.js';
import { useSessionStore } from '../../stores/session.js';
import type { MediaType } from '../../types/domain.js';

defineOptions({ name: 'ListControls' });

const controls = useListControlsStore();
const lists = useListsStore();
const session = useSessionStore();
const { mode, type, owner, search, sort, score } = storeToRefs(controls);
const authenticated = computed(() => session.isAuthenticated);
const watchlistCount = computed(() => lists.watchlist.length);

function setMode(nextMode: 'entries' | 'watchlist'): void {
  controls.setMode(nextMode);
}

function setType(nextType: MediaType): void {
  controls.setType(nextType);
}

watch(authenticated, isAuthenticated => {
  if (!isAuthenticated) {
    if (mode.value === 'watchlist') controls.setMode('entries');
    if (owner.value === 'me') controls.setOwner('all');
  }
}, { immediate: true });
</script>

<template>
  <section class="vue-list-controls">
    <div class="section-title-switch" aria-label="影单视图">
      <button type="button" :class="{ active: mode === 'entries' }" @click="setMode('entries')">{{ authenticated ? '我的影单' : '公开影单' }}</button>
      <button v-if="authenticated" type="button" :class="{ active: mode === 'watchlist' }" @click="setMode('watchlist')">
        想看清单 <span>{{ watchlistCount }}</span>
      </button>
    </div>

    <div v-if="mode === 'entries'" class="list-subtabs">
      <button type="button" :class="{ active: type === 'movie' }" @click="setType('movie')">电影</button>
      <button type="button" :class="{ active: type === 'series' }" @click="setType('series')">剧集</button>
    </div>

    <div v-if="mode === 'entries'" class="list-controls">
      <input
        :value="search"
        type="text"
        class="search-box"
        placeholder="搜索片名 / 导演 / 演员..."
        @input="controls.setSearch(($event.target as HTMLInputElement).value)"
      >
      <select v-model="sort" @change="controls.setSort(sort)">
        <option value="date-desc">最近添加</option>
        <option value="date-asc">最早添加</option>
        <option value="score-desc">评分最高</option>
        <option value="score-asc">评分最低</option>
        <option value="count-desc">评价数量</option>
        <option value="title">按片名 A-Z</option>
      </select>
      <select v-model="owner" @change="controls.setOwner(owner)">
        <option value="all">所有人</option>
        <option v-if="authenticated" value="me">仅自己</option>
      </select>
      <select v-model="score" @change="controls.setScore(score)">
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
