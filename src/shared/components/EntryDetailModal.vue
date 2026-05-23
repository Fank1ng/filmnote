<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { deleteEntry as deleteEntryApi } from '../../api/entries-api.js';
import { refreshVueData } from '../../app/data-sync.js';
import { getLegacyBridge } from '../../app/legacy-bridge.js';
import { DIM_LABELS, WEIGHTS, type RatingDim } from '../../config/constants.js';
import { getEntryScore } from '../scoring.js';
import { posterUrl } from '../tmdb.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useSessionStore } from '../../stores/session.js';
import type { Entry } from '../../types/domain.js';
import BaseModal from './BaseModal.vue';

defineOptions({ name: 'EntryDetailModal' });

type UserLike = { id?: string };
type UserColor = { main: string; dim: string };
type DetailCache = { overview?: string };

const entries = useEntriesStore();
const session = useSessionStore();
const open = ref(false);
const entryId = ref<Entry['id'] | null>(null);

const dims = Object.keys(WEIGHTS) as RatingDim[];
const currentUserId = computed(() => (session.currentUser as UserLike | null)?.id || '');
const entry = computed(() => entries.entries.find(item => String(item.id) === String(entryId.value)) || null);
const isMine = computed(() => !!entry.value && entry.value.user_id === currentUserId.value);
const ownerName = computed(() => entry.value ? displayName(entry.value.user_id) : '未知');
const entrySeasons = computed(() => {
  const target = entry.value;
  return target ? entries.seasonRatings.filter(season => String(season.entry_id) === String(target.id)) : [];
});
const friendEntries = computed(() => {
  const target = entry.value;
  if (!target) return [];
  const key = groupKey(target);
  return entries.entries.filter(item => String(item.id) !== String(target.id) && groupKey(item) === key);
});
const detail = computed(() => entry.value ? cachedDetail(entry.value) : null);

function displayName(userId: string): string {
  return entries.profiles[userId]?.display_name || '未知';
}

function userColor(userId: string): UserColor {
  const name = displayName(userId).toLowerCase();
  if (name === 'fank1ng') return { main: '#d4a853', dim: '#3a3020' };
  if (name === 'ceci') return { main: '#FF69B4', dim: '#2a1525' };
  return { main: '#5b9db0', dim: '#1a2a30' };
}

function groupKey(item: Entry): string {
  const mediaType = item.type || item.media_type || 'movie';
  return item.tmdb_id
    ? `${mediaType}:${item.tmdb_id}`
    : `${mediaType}:${item.title.toLowerCase().trim()}:${item.year || 0}`;
}

function cachedDetail(item: Entry): DetailCache | null {
  if (!item.tmdb_id) return null;
  try {
    const cache = JSON.parse(localStorage.getItem('filmnote_movie_cache') || '{}') || {};
    return cache[`${item.type || item.media_type || 'movie'}:${item.tmdb_id}`] || cache[String(item.tmdb_id)] || null;
  } catch {
    return null;
  }
}

function formatDate(value: string | undefined): string {
  return value ? String(value).slice(0, 10) : '';
}

function openEntry(id: Entry['id']): boolean {
  const target = entries.entries.find(item => String(item.id) === String(id));
  if (!target) return false;
  entryId.value = target.id;
  open.value = true;
  return true;
}

function close(): void {
  open.value = false;
}

function editEntry(): void {
  const target = entry.value;
  if (!target) return;
  close();
  if (!window.FilmNoteVueRatings?.openQuickEdit?.(target.id)) {
    getLegacyBridge()?.ratings?.openQuickEdit?.(target.id);
  }
}

async function deleteEntry(): Promise<void> {
  const target = entry.value;
  if (!target) return;
  if (!window.confirm('确定删除这条评价？此操作不可恢复。')) return;
  close();
  const { error } = await deleteEntryApi(target.id);
  if (error) void getLegacyBridge()?.ratings?.deleteEntry?.(target.id);
  await refreshVueData();
}

function addMyRating(): void {
  const target = entry.value;
  if (!target) return;
  close();
  if (!window.FilmNoteVueRatings?.openQuickRate?.({
    id: target.tmdb_id,
    tmdb_id: target.tmdb_id,
    media_type: target.type || target.media_type || 'movie',
    type: target.type || target.media_type || 'movie',
    title: target.title,
    year: target.year || null,
    poster_path: target.poster_path || '',
    director: target.director || '',
  })) {
    getLegacyBridge()?.list?.addMyRating?.(target.id);
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close();
}

const api = { openEntry, close };

onMounted(() => {
  window.FilmNoteVueDetail = api;
  document.documentElement.dataset.filmnoteVueDetail = 'ready';
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  if (window.FilmNoteVueDetail === api) delete window.FilmNoteVueDetail;
  if (document.documentElement.dataset.filmnoteVueDetail === 'ready') {
    delete document.documentElement.dataset.filmnoteVueDetail;
  }
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <BaseModal :open="open" max-width="720px" labelled-by="entry-detail-title" @close="close">
    <template v-if="entry">
      <div class="modal-title-row">
        <h3 id="entry-detail-title">{{ entry.title }} <span v-if="entry.year" style="color:var(--text2);font-weight:400">({{ entry.year }})</span></h3>
        <button class="modal-close" type="button" @click="close">×</button>
      </div>

      <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">
        <img v-if="entry.poster_path" :src="posterUrl(entry.poster_path)" style="width:80px;border-radius:8px" alt="">
        <div>
          <p v-if="entry.director" style="color:var(--text2);font-size:0.85rem">{{ entry.director }}</p>
          <p style="color:var(--text2);font-size:0.8rem">{{ ownerName }} · {{ formatDate(entry.created_at) }} <span v-if="entry.type === 'series'">· 剧集</span></p>
          <p :style="{ color: userColor(entry.user_id).main }" style="font-size:1.8rem;font-weight:800;margin-top:4px">{{ getEntryScore(entry).toFixed(1) }} / 10</p>
        </div>
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
        <span v-for="dim in dims" :key="dim" class="mc-dim-item" :style="{ borderColor: userColor(entry.user_id).main }">
          <span class="dim-lab">{{ DIM_LABELS[dim].slice(0, 2) }}</span>
          <span class="dim-val" :style="{ color: userColor(entry.user_id).main }">{{ entry.ratings?.[dim] || 5 }}</span>
        </span>
      </div>

      <p v-if="entry.comment" style="font-style:italic;color:var(--text2);margin-bottom:12px">"{{ entry.comment }}"</p>

      <div v-if="entrySeasons.length" class="friend-section">
        <h4>分季评分</h4>
        <div v-for="season in entrySeasons" :key="season.id || season.season_number" class="friend-rating">
          <div class="fr-header">
            <span class="fr-name">S{{ season.season_number }} {{ season.season_title || '' }}</span>
            <span class="fr-score">{{ getEntryScore(season).toFixed(1) }} / 10</span>
          </div>
          <p v-if="season.comment" style="font-size:0.8rem;color:var(--text2);font-style:italic;margin-top:4px">"{{ season.comment }}"</p>
        </div>
      </div>

      <div v-if="friendEntries.length" class="friend-section">
        <h4>朋友评分</h4>
        <div v-for="friend in friendEntries" :key="friend.id" class="friend-rating">
          <div class="fr-header">
            <span class="fr-name" :style="{ color: userColor(friend.user_id).main }">{{ displayName(friend.user_id) }}</span>
            <span class="fr-score" :style="{ color: userColor(friend.user_id).main }">{{ getEntryScore(friend).toFixed(1) }} / 10</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:0.75rem">
            <span v-for="dim in dims" :key="dim" class="mc-dim-item" :style="{ borderColor: userColor(friend.user_id).main }">
              <span class="dim-lab">{{ DIM_LABELS[dim].slice(0, 2) }}</span>
              <span class="dim-val" :style="{ color: userColor(friend.user_id).main }">{{ friend.ratings?.[dim] || 5 }}</span>
            </span>
          </div>
          <p v-if="friend.comment" style="font-size:0.8rem;color:var(--text2);font-style:italic;margin-top:4px">"{{ friend.comment }}"</p>
        </div>
      </div>

      <div v-if="detail?.overview || entry.overview" class="tmdb-section">
        <h4>简介</h4>
        <p style="font-size:0.85rem;color:var(--text2);line-height:1.6">{{ detail?.overview || entry.overview }}</p>
      </div>

      <div class="btn-group" style="justify-content:flex-end">
        <button v-if="isMine && entry.type !== 'series'" class="btn btn-secondary btn-sm" type="button" @click="editEntry">编辑</button>
        <button v-if="isMine" class="btn btn-danger btn-sm" type="button" @click="deleteEntry">删除</button>
        <button v-if="!isMine" class="btn btn-secondary btn-sm" type="button" @click="addMyRating">＋我的评分</button>
        <button class="btn btn-secondary btn-sm" type="button" @click="close">关闭</button>
      </div>
    </template>
  </BaseModal>
</template>
