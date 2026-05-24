<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { searchTmdbMedia, loadTmdbMediaDetail, type NormalizedSearchMedia } from '../../api/tmdb-api.js';
import { getCurrentUser } from '../../app/user-context.js';
import { useDebouncedFn } from '../../shared/composables/useDebouncedFn.js';
import { useMediaActions } from '../../shared/composables/useMediaActions.js';
import { posterUrl } from '../../shared/tmdb.js';
import { useCoupleStore } from '../../stores/couple.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useListsStore } from '../../stores/lists.js';
import { useModalStore } from '../../stores/modals.js';
import { useSessionStore } from '../../stores/session.js';
import type { MediaType } from '../../types/domain.js';

defineOptions({ name: 'RatingsSearchPanel' });

type UserLike = {
  id?: string;
};

const entries = useEntriesStore();
const lists = useListsStore();
const couple = useCoupleStore();
const session = useSessionStore();
const modals = useModalStore();
const mediaActions = useMediaActions();

const mediaType = ref<MediaType>('movie');
const query = ref('');
const results = ref<NormalizedSearchMedia[]>([]);
const selected = ref<NormalizedSearchMedia | null>(null);
const loading = ref(false);
const detailLoading = ref(false);
const errorMessage = ref('');
const expanded = ref(false);
let abortController: AbortController | null = null;
let detailSeq = 0;

const currentUser = computed(() => getCurrentUser<UserLike>(session.currentUser));
const placeholder = computed(() => mediaType.value === 'series'
  ? '搜索剧集，选择后添加评价或加入清单...'
  : '搜索电影，选择后添加评价或加入清单...');
const selectedFacts = computed(() => {
  const movie = selected.value;
  if (!movie) return [];
  const facts: string[] = [];
  if (movie.director) facts.push(`${movie.media_type === 'series' ? '主创' : '导演'}：${movie.director}`);
  if (movie.vote_average) facts.push(`TMDb ${Number(movie.vote_average).toFixed(1)}`);
  if (movie.media_type === 'movie' && movie.runtime) facts.push(`${movie.runtime} 分钟`);
  if (movie.media_type === 'series' && movie.number_of_seasons) facts.push(`${movie.number_of_seasons} 季`);
  if (movie.original_language) facts.push(movie.original_language.toUpperCase());
  return facts;
});
const selectedOverview = computed(() => selected.value?.overview || (detailLoading.value ? '正在加载简介...' : '暂无简介'));
const canRunActions = computed(() => !!selected.value);
const selectedKey = computed(() => selected.value ? `${selected.value.media_type}:${selected.value.tmdb_id}` : '');
const isWatchlisted = computed(() => !!selectedKey.value && lists.watchlistIds.has(selectedKey.value));
const isQueued = computed(() => !!selectedKey.value && couple.queue.some(item => `${item.media_type}:${item.tmdb_id}` === selectedKey.value));

function setMediaType(nextType: MediaType): void {
  mediaType.value = nextType;
  query.value = '';
  clearSelection();
  results.value = [];
  errorMessage.value = '';
}

function clearSelection(): void {
  selected.value = null;
  expanded.value = false;
  detailSeq++;
}

function findExistingEntry(movie: NormalizedSearchMedia) {
  const userId = currentUser.value?.id;
  if (!userId) return null;
  return entries.entries.find(entry => {
    const entryType = entry.type || entry.media_type || 'movie';
    return entry.user_id === userId
      && entry.tmdb_id === movie.tmdb_id
      && entryType === movie.media_type;
  }) ?? null;
}

async function runSearch(value: string): Promise<void> {
  const q = value.trim();
  errorMessage.value = '';
  results.value = [];
  if (!q) {
    loading.value = false;
    return;
  }
  clearSelection();
  abortController?.abort();
  abortController = new AbortController();
  loading.value = true;
  try {
    results.value = (await searchTmdbMedia(q, mediaType.value, abortController.signal)).slice(0, 8);
    if (!results.value.length) errorMessage.value = '无结果';
  } catch (error) {
    if ((error as { name?: string }).name !== 'AbortError') {
      errorMessage.value = 'TMDB 连接失败：' + (error instanceof Error ? error.message : String(error));
    }
  } finally {
    loading.value = false;
  }
}

async function selectResult(movie: NormalizedSearchMedia): Promise<void> {
  selected.value = movie;
  results.value = [];
  query.value = '';
  expanded.value = false;
  const seq = ++detailSeq;
  detailLoading.value = true;
  try {
    const detail = await loadTmdbMediaDetail(movie);
    if (seq === detailSeq) selected.value = detail;
  } catch {
    // Search result data is enough for rating; detail enrichment can fail quietly.
  } finally {
    if (seq === detailSeq) detailLoading.value = false;
  }
}

async function addReview(): Promise<void> {
  const movie = selected.value;
  if (!movie) return;
  const existing = findExistingEntry(movie);
  if (existing) modals.openQuickEdit(existing.id);
  else modals.openQuickRate(movie);
}

async function addWatchlist(): Promise<void> {
  const movie = selected.value;
  if (!movie) return;
  await mediaActions.toggleWatchlist(movie);
}

async function addNext(): Promise<void> {
  const movie = selected.value;
  if (!movie) return;
  await mediaActions.addToNextWatch(movie);
}

const runSearchDebounced = useDebouncedFn(value => void runSearch(value), 350);

watch(query, value => {
  runSearchDebounced(value);
});

onBeforeUnmount(() => {
  abortController?.abort();
});
</script>

<template>
  <section class="ratings-search-panel">
    <h2 class="section-title">搜索并确认</h2>
    <div class="type-toggle">
      <button type="button" :class="{ active: mediaType === 'movie' }" @click="setMediaType('movie')">电影</button>
      <button type="button" :class="{ active: mediaType === 'series' }" @click="setMediaType('series')">剧集</button>
    </div>

    <div class="search-wrap vue-search-wrap">
      <input v-model="query" type="text" :placeholder="placeholder">
      <div v-if="query && (results.length || loading || errorMessage)" class="search-results open">
        <div v-if="loading" class="search-message">搜索中...</div>
        <div v-else-if="errorMessage" class="search-message">{{ errorMessage }}</div>
        <button
          v-for="movie in results"
          v-else
          :key="`${movie.media_type}:${movie.tmdb_id}`"
          type="button"
          class="sr-item vue-sr-item"
          @click="selectResult(movie)"
        >
          <img v-if="movie.poster_path" class="sr-poster" :src="posterUrl(movie.poster_path)" alt="">
          <div v-else class="sr-poster"></div>
          <span class="sr-info sr-fill-action">
            <span class="sr-title">{{ movie.title }}</span>
            <span class="sr-meta">{{ movie.year || '未知' }}<template v-if="movie.overview"> · {{ movie.overview.slice(0, 60) }}...</template></span>
          </span>
        </button>
      </div>
    </div>

    <div class="selected-search-preview">
      <div v-if="!selected" class="selected-search-empty">搜索并选择一部电影或剧集后确认信息</div>
      <div v-else class="selected-search-card">
        <div class="selected-poster">
          <img v-if="selected.poster_path" :src="posterUrl(selected.poster_path)" :alt="selected.title">
          <span v-else>{{ selected.media_type === 'series' ? '剧集' : '电影' }}</span>
        </div>
        <div class="selected-info">
          <div class="selected-head">
            <div>
              <h3>{{ selected.title }}</h3>
              <div class="selected-meta">{{ [selected.year || '年份未知', selected.release_date].filter(Boolean).join(' · ') }}</div>
            </div>
            <span class="selected-type">{{ selected.media_type === 'series' ? '剧集' : '电影' }}</span>
          </div>
          <div class="selected-facts">
            <span v-for="fact in selectedFacts" :key="fact">{{ fact }}</span>
            <span v-if="!selectedFacts.length">{{ detailLoading ? '正在补充详情...' : '暂无更多信息' }}</span>
          </div>
          <p class="selected-overview" :class="{ expanded, loading: detailLoading }">{{ selectedOverview }}</p>
          <button
            v-if="selectedOverview.length > 90"
            type="button"
            class="selected-overview-toggle"
            @click="expanded = !expanded"
          >
            {{ expanded ? '收起简介' : '展开简介' }}
          </button>
          <div class="search-actions" aria-label="搜索结果操作">
            <button type="button" class="btn btn-secondary" :disabled="!canRunActions" @click="addWatchlist">{{ isWatchlisted ? '移出想看' : '加入想看' }}</button>
            <button type="button" class="btn btn-secondary" :disabled="!canRunActions" @click="addNext">{{ isQueued ? '已在下次看' : '加入下次看' }}</button>
            <button type="button" class="btn btn-primary" :disabled="!canRunActions" @click="addReview">添加评价</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
