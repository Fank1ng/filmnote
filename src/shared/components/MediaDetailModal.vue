<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getCurrentUserId } from '../../app/user-context.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useSessionStore } from '../../stores/session.js';
import { useUiStore } from '../../stores/ui.js';
import type { MediaType, TmdbDetail, TmdbMedia } from '../../types/domain.js';
import { posterUrl } from '../tmdb.js';
import {
  fetchTmdbDetail,
  genreNameMap,
  getCachedTmdbDetail,
  needsTmdbDetailFetch,
  normalizeMediaType,
  normalizeTmdbMedia,
  tmdbIdOf,
} from '../tmdb-detail.js';
import { getEntryScore } from '../scoring.js';
import BaseModal from './BaseModal.vue';

defineOptions({ name: 'MediaDetailModal' });

type RatingMode = 'total' | 'season';

const entries = useEntriesStore();
const session = useSessionStore();
const ui = useUiStore();
const open = ref(false);
const media = ref<TmdbMedia | null>(null);
const detail = ref<TmdbDetail | null>(null);
const loading = ref(false);
const errorMessage = ref('');
const expanded = ref(false);
let requestSeq = 0;

const currentUserId = computed(() => getCurrentUserId(session.currentUser));
const mediaType = computed<MediaType>(() => normalizeMediaType(media.value?.media_type || media.value?.type || detail.value?.media_type || 'movie'));
const tmdbId = computed(() => tmdbIdOf(media.value || detail.value));
const title = computed(() => detail.value?.title || media.value?.title || media.value?.name || (tmdbId.value ? `TMDB #${tmdbId.value}` : '详情'));
const year = computed(() => detail.value?.year || media.value?.year || Number(String(media.value?.release_date || media.value?.first_air_date || '').slice(0, 4)) || null);
const poster = computed(() => detail.value?.poster_path || media.value?.poster_path || '');
const overview = computed(() => detail.value?.overview || media.value?.overview || '');
const ratedEntry = computed(() => entries.entries.find(entry =>
  entry.user_id === currentUserId.value
  && normalizeMediaType(entry.type || entry.media_type || 'movie') === mediaType.value
  && Number(entry.tmdb_id || 0) === tmdbId.value
) || null);
const genreLabels = computed(() => {
  const direct = detail.value?.genres || media.value?.genres || [];
  const names = direct
    .map(item => typeof item === 'string' ? item : item?.name)
    .filter(Boolean)
    .map(String);
  if (names.length) return names.slice(0, 4);
  return (media.value?.genre_ids || []).slice(0, 4).map(id => genreNameMap[id] || '').filter(Boolean);
});
const detailChips = computed(() => {
  const chips: string[] = [];
  if (detail.value?.vote_average || media.value?.vote_average) chips.push(`TMDB ${(detail.value?.vote_average || media.value?.vote_average || 0).toFixed(1)}`);
  chips.push(...genreLabels.value);
  if (detail.value?.runtime) chips.push(`${detail.value.runtime} 分钟`);
  if (detail.value?.number_of_seasons) chips.push(`${detail.value.number_of_seasons} 季`);
  return chips;
});
const seasons = computed(() => (Array.isArray(detail.value?.seasons) ? detail.value?.seasons || [] : []) as Array<Record<string, unknown>>);

function openMedia(input: unknown, fallbackType: MediaType = 'movie'): boolean {
  const normalized = normalizeTmdbMedia(input, fallbackType);
  if (!normalized) return false;
  media.value = normalized;
  detail.value = getCachedTmdbDetail(normalizeMediaType(normalized.media_type || normalized.type), tmdbIdOf(normalized));
  open.value = true;
  expanded.value = false;
  errorMessage.value = '';
  void loadDetail();
  return true;
}

function openMovie(input: unknown): boolean {
  return openMedia(input, 'movie');
}

function openListItem(input: unknown): boolean {
  const normalized = normalizeTmdbMedia(input, 'movie');
  if (!normalized) return false;
  return openMedia(normalized, normalizeMediaType(normalized.media_type || normalized.type));
}

function close(): void {
  open.value = false;
}

async function loadDetail(): Promise<void> {
  if (!media.value || !tmdbId.value) return;
  const seq = ++requestSeq;
  const type = mediaType.value;
  const id = tmdbId.value;
  const cached = getCachedTmdbDetail(type, id);
  if (cached) detail.value = cached;
  if (!needsTmdbDetailFetch(cached)) return;

  loading.value = true;
  errorMessage.value = '';
  try {
    const fetched = await fetchTmdbDetail(type, id, { force: true });
    if (seq === requestSeq && fetched) detail.value = fetched;
    if (seq === requestSeq && !fetched && !cached) errorMessage.value = '详情加载失败，请稍后重试';
  } catch (error) {
    if (seq === requestSeq) errorMessage.value = error instanceof Error ? error.message : '详情加载失败，请稍后重试';
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
}

function ratingPayload(mode?: RatingMode): TmdbMedia & Record<string, unknown> {
  return {
    ...(media.value || {}),
    ...(detail.value || {}),
    id: tmdbId.value,
    tmdb_id: tmdbId.value,
    media_type: mediaType.value,
    type: mediaType.value,
    title: title.value,
    year: year.value,
    poster_path: poster.value,
    director: detail.value?.director || media.value?.director || '',
    number_of_seasons: detail.value?.number_of_seasons || media.value?.number_of_seasons || seasons.value.length || 0,
    ...(mode ? { ratingMode: mode, fillSeasonPlaceholders: mode === 'season' } : {}),
  };
}

function rate(mode?: RatingMode): void {
  const payload = ratingPayload(mode);
  close();
  if (!window.FilmNoteVueRatings?.openQuickRate?.(payload)) ui.showToast('评分面板还未就绪，请刷新后重试');
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') close();
}

const api = { openMovie, openListItem, close };

window.FilmNoteVueMediaDetail = api;

onMounted(() => {
  window.FilmNoteVueMediaDetail = api;
  document.documentElement.dataset.filmnoteVueMediaDetail = 'ready';
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  if (window.FilmNoteVueMediaDetail === api) delete window.FilmNoteVueMediaDetail;
  if (document.documentElement.dataset.filmnoteVueMediaDetail === 'ready') {
    delete document.documentElement.dataset.filmnoteVueMediaDetail;
  }
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <BaseModal :open="open" max-width="760px" labelled-by="media-detail-title" @close="close">
    <div v-if="media" class="media-detail-vue">
      <div class="modal-title-row">
        <h3 id="media-detail-title">{{ title }} <span v-if="year" style="color:var(--text2);font-weight:400">({{ year }})</span></h3>
        <button class="modal-close" type="button" @click="close">×</button>
      </div>

      <div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">
        <img v-if="poster" :src="posterUrl(poster)" style="width:96px;border-radius:8px" alt="">
        <div v-else class="qr-poster-empty" style="width:96px;height:140px">No poster</div>
        <div>
          <p style="color:var(--text2);font-size:0.82rem">{{ mediaType === 'series' ? '剧集' : '电影' }} · TMDB #{{ tmdbId }}</p>
          <p v-if="detail?.original_language || media.original_language" style="color:var(--text2);font-size:0.8rem">{{ (detail?.original_language || media.original_language || '').toUpperCase() }}</p>
          <div v-if="detailChips.length" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
            <span v-for="chip in detailChips" :key="chip" class="cast-chip">{{ chip }}</span>
          </div>
          <p v-if="ratedEntry" style="font-size:0.85rem;color:var(--gold);margin-top:8px">已评价 · 你的评分 {{ getEntryScore(ratedEntry).toFixed(1) }}</p>
        </div>
      </div>

      <div class="tmdb-section">
        <template v-if="overview">
          <h4>简介</h4>
          <div class="tmdb-overview" :class="{ expanded }">{{ overview }}</div>
          <button class="tmdb-expand" type="button" @click="expanded = !expanded">{{ expanded ? '收起' : '展开全部' }}</button>
        </template>
        <p v-else-if="detail?.overview_missing" style="font-size:0.85rem;color:var(--text2)">TMDB 暂无简介</p>
        <p v-else-if="loading" style="font-size:0.85rem;color:var(--text2)"><span class="detail-spinner"></span> 加载详情...</p>
        <p v-else style="font-size:0.85rem;color:var(--text2)">暂无详细信息</p>

        <template v-if="detail?.director">
          <h4 style="margin-top:10px">{{ mediaType === 'series' ? '导演 / 主创' : '导演' }}</h4>
          <div class="tmdb-cast"><span class="cast-chip">{{ detail.director }}</span></div>
        </template>
        <template v-if="detail?.cast?.length">
          <h4 style="margin-top:10px">演员</h4>
          <div class="tmdb-cast">
            <span v-for="name in detail.cast" :key="name" class="cast-chip">{{ name }}</span>
          </div>
        </template>
      </div>

      <div v-if="seasons.length" class="friend-section">
        <h4>剧集信息</h4>
        <div v-for="season in seasons" :key="String(season.season_number || season.name)" class="friend-rating">
          <div class="fr-header">
            <span class="fr-name">S{{ season.season_number }} {{ season.name || season.season_title || '' }}</span>
            <span v-if="season.vote_average" class="fr-score">{{ Number(season.vote_average).toFixed(1) }}</span>
          </div>
          <p style="font-size:0.78rem;color:var(--text2);margin-top:4px">
            <span v-if="season.episode_count">{{ season.episode_count }} 集</span>
            <span v-if="season.average_episode_runtime"> · 平均 {{ season.average_episode_runtime }} 分钟</span>
          </p>
        </div>
      </div>

      <div v-if="errorMessage" class="auth-error">{{ errorMessage }}</div>

      <div class="btn-group" style="justify-content:flex-end;margin-top:8px">
        <button v-if="!ratedEntry && mediaType === 'movie'" class="btn btn-primary btn-sm" type="button" @click="rate()">+ 我的评分</button>
        <template v-if="mediaType === 'series'">
          <button class="btn btn-secondary btn-sm" type="button" @click="rate('total')">总评分</button>
          <button class="btn btn-primary btn-sm" type="button" @click="rate('season')">分季评分</button>
        </template>
        <button class="btn btn-secondary btn-sm" type="button" @click="close">关闭</button>
      </div>
    </div>
  </BaseModal>
</template>
