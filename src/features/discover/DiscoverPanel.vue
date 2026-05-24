<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { getCurrentUserId } from '../../app/user-context.js';
import { TMDB_IMG, TMDB_PROXY } from '../../config/constants.js';
import EmptyState from '../../shared/components/EmptyState.vue';
import { PaginationControls } from '../../shared/components/index.js';
import { useMediaActions } from '../../shared/composables/useMediaActions.js';
import { useCoupleStore } from '../../stores/couple.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useListsStore } from '../../stores/lists.js';
import { useSessionStore } from '../../stores/session.js';
import type { MediaType, TmdbMedia } from '../../types/domain.js';
import type { DiscoverTab } from '../../stores/discover.js';

defineOptions({ name: 'DiscoverPanel' });

const genreMap: Record<number, string> = {
  28: '动作', 12: '冒险', 16: '动画', 35: '喜剧', 80: '犯罪', 99: '纪录', 18: '剧情', 10751: '家庭',
  14: '奇幻', 36: '历史', 27: '恐怖', 10402: '音乐', 9648: '悬疑', 10749: '爱情', 878: '科幻',
  10770: '电视电影', 53: '惊悚', 10752: '战争', 37: '西部',
};

const tabs: Array<{ key: DiscoverTab; fallback: string }> = [
  { key: 'recommend', fallback: 'Ceci推荐' },
  { key: 'week', fallback: '本周热门' },
  { key: 'toprated', fallback: 'IMDb Top100' },
];

const entries = useEntriesStore();
const lists = useListsStore();
const couple = useCoupleStore();
const session = useSessionStore();
const mediaActions = useMediaActions();
const activeTab = ref<DiscoverTab>('recommend');
const pages = ref<Record<DiscoverTab, number>>({ recommend: 1, week: 1, toprated: 1 });
const topRatedUnwatched = ref(false);
const lastRefresh = ref(0);
const recTabLabel = ref('Ceci推荐');
const loading = ref(false);
const errorMessage = ref('');
const movies = ref<TmdbMedia[] | null>([]);
const nowTick = ref(Date.now());
let loadSeq = 0;
let timer = 0;

const currentUserId = computed(() => getCurrentUserId(session.currentUser));
const ratedCount = computed(() => entries.entries.filter(entry => entry.user_id === currentUserId.value && mediaType(entry) === 'movie').length);
const ratedTmdbIds = computed(() => new Set(entries.entries
  .filter(entry => entry.user_id === currentUserId.value && entry.tmdb_id)
  .map(entry => `tmdb_${entry.tmdb_id}`)));
const blockedIds = computed(() => lists.blockedMovieIds);
const watchlistIds = computed(() => lists.watchlistIds);
const queueIds = computed(() => new Set(couple.queue.map(item => `${normalizeMediaType(item.media_type)}:${item.tmdb_id}`)));
const cooldownRemaining = computed(() => Math.max(0, 5 - Math.floor((nowTick.value - lastRefresh.value) / 1000)));
const refreshHint = computed(() => {
  if (cooldownRemaining.value > 0) return `${cooldownRemaining.value}s 后可刷新`;
  const name = (session.currentProfile?.display_name || '').toLowerCase();
  const targetName = name === 'ceci' ? 'FD' : 'ceci';
  if (ratedCount.value < 100 && ratedCount.value >= 25) return `评价100部，${targetName}将为你精心推荐`;
  return '';
});
const topbarCount = computed(() => {
  if (activeTab.value === 'recommend') return '';
  const prefix = activeTab.value === 'toprated' && topRatedUnwatched.value ? '未看 ' : '共 ';
  return `${prefix}${filteredMovies.value.length} 部`;
});
const filteredMovies = computed(() => {
  const source = movies.value || [];
  const unblocked = source.filter(movie => !blockedIds.value.has(tmdbId(movie)));
  if (activeTab.value === 'toprated' && topRatedUnwatched.value) {
    return unblocked.filter(movie => !ratedTmdbIds.value.has(`tmdb_${tmdbId(movie)}`));
  }
  return unblocked;
});
const pageSize = computed(() => {
  if (activeTab.value === 'toprated') return 20;
  if (activeTab.value === 'recommend') return ratedCount.value >= 100 ? 24 : 12;
  return Math.max(filteredMovies.value.length, 1);
});
const totalPages = computed(() => Math.max(1, Math.ceil(filteredMovies.value.length / pageSize.value)));
const currentPage = computed(() => Math.min(Math.max(1, pages.value[activeTab.value] || 1), totalPages.value));
const pageMovies = computed(() => {
  if (activeTab.value === 'recommend') return filteredMovies.value.slice(0, pageSize.value);
  if (activeTab.value === 'week') return filteredMovies.value;
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredMovies.value.slice(start, start + pageSize.value);
});
function mediaType(movie: { media_type?: unknown; type?: unknown }): MediaType {
  return normalizeMediaType(movie.media_type || movie.type || 'movie');
}

function normalizeMediaType(value: unknown): MediaType {
  return value === 'series' || value === 'tv' ? 'series' : 'movie';
}

function tmdbId(movie: Partial<TmdbMedia>): number {
  return Number(movie.id || movie.tmdb_id || 0);
}

function titleOf(movie: TmdbMedia): string {
  return movie.title || movie.name || `TMDB #${tmdbId(movie)}`;
}

function posterUrl(path: string | null | undefined): string {
  return path ? TMDB_IMG + path : '';
}

function yearOf(movie: TmdbMedia): string {
  return String(movie.year || movie.release_date || movie.first_air_date || '').slice(0, 4);
}

function genresOf(movie: TmdbMedia): string[] {
  if (Array.isArray(movie.genre_ids)) return movie.genre_ids.slice(0, 3).map(id => genreMap[id] || '').filter(Boolean);
  if (Array.isArray(movie.genres)) {
    return movie.genres.slice(0, 3).map(genre => typeof genre === 'string' ? genre : genre.name || '').filter(Boolean);
  }
  return [];
}

function listKey(movie: TmdbMedia): string {
  return `${mediaType(movie)}:${tmdbId(movie)}`;
}

function recommendationEntries() {
  return entries.entries.map(entry => ({
    user_id: entry.user_id,
    type: mediaType(entry),
    tmdb_id: entry.tmdb_id || null,
    total_score: entry.total_score || null,
    created_at: entry.created_at || '',
  }));
}

async function loadRecommendationsDirect(excludeIds: number[] = []): Promise<TmdbMedia[] | null> {
  if (!currentUserId.value || ratedCount.value < 25) return null;
  const response = await fetch(`${TMDB_PROXY}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      entries: recommendationEntries(),
      userId: currentUserId.value,
      blockedIds: [...blockedIds.value],
      blockedMovies: [...blockedIds.value].map(tmdbId => ({ tmdb_id: tmdbId, reason: '' })),
      excludeIds,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `推荐接口异常 (${response.status})`);
  return data.movies === null ? null : (data.movies || []);
}

function isRated(movie: TmdbMedia): boolean {
  return ratedTmdbIds.value.has(`tmdb_${tmdbId(movie)}`);
}

function tabLabel(tab: DiscoverTab): string {
  if (tab === 'recommend') return recTabLabel.value;
  return tabs.find(item => item.key === tab)?.fallback || tab;
}

async function loadActiveTab(): Promise<void> {
  const seq = ++loadSeq;
  loading.value = true;
  errorMessage.value = '';
  try {
    let result: unknown;
    if (activeTab.value === 'recommend') {
      result = await loadRecommendationsDirect();
    } else if (activeTab.value === 'week' || activeTab.value === 'toprated') {
      const endpoint = activeTab.value === 'week' ? 'trending' : 'toprated';
      const response = await fetch(`${TMDB_PROXY}/${endpoint}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `接口异常 (${response.status})`);
      result = data.results || [];
    }
    if (seq !== loadSeq) return;
    movies.value = result === null ? null : (Array.isArray(result) ? result as TmdbMedia[] : []);
  } catch (error) {
    if (seq !== loadSeq) return;
    movies.value = [];
    errorMessage.value = error instanceof Error ? error.message : '网络或接口异常';
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
}

async function setTab(tab: DiscoverTab): Promise<void> {
  if (activeTab.value === tab) return;
  activeTab.value = tab;
  await loadActiveTab();
}

function setPage(page: number): void {
  pages.value[activeTab.value] = Math.min(Math.max(1, page), totalPages.value);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function toggleTopRatedUnwatched(): Promise<void> {
  topRatedUnwatched.value = !topRatedUnwatched.value;
  pages.value.toprated = 1;
}

async function refreshRecommendations(): Promise<void> {
  if (cooldownRemaining.value > 0 || loading.value) return;
  const excludeIds = pageMovies.value.map(tmdbId).filter(Boolean);
  loading.value = true;
  errorMessage.value = '';
  lastRefresh.value = Date.now();
  pages.value.recommend = 1;
  try {
    const result = await loadRecommendationsDirect(excludeIds);
    movies.value = result === null ? null : (Array.isArray(result) ? result as TmdbMedia[] : []);
  } catch (error) {
    movies.value = [];
    errorMessage.value = error instanceof Error ? error.message : '网络或接口异常';
  } finally {
    loading.value = false;
  }
}

function rateMovie(movie: TmdbMedia): void {
  mediaActions.rateMedia({ ...movie, id: tmdbId(movie), tmdb_id: tmdbId(movie), media_type: mediaType(movie) });
}

async function toggleWatch(movie: TmdbMedia): Promise<void> {
  await mediaActions.toggleWatchlist({ ...movie, id: tmdbId(movie), tmdb_id: tmdbId(movie), media_type: mediaType(movie) });
}

async function addNext(movie: TmdbMedia): Promise<void> {
  await mediaActions.addToNextWatch({ ...movie, id: tmdbId(movie), tmdb_id: tmdbId(movie), media_type: mediaType(movie) });
}

async function block(movie: TmdbMedia): Promise<void> {
  const ok = await mediaActions.blockMedia({ ...movie, id: tmdbId(movie), tmdb_id: tmdbId(movie), media_type: mediaType(movie) });
  if (ok) movies.value = (movies.value || []).filter(item => tmdbId(item) !== tmdbId(movie));
}

async function openDetail(movie: TmdbMedia): Promise<void> {
  if (!tmdbId(movie)) return;
  mediaActions.openMediaDetail({ ...movie, id: tmdbId(movie), tmdb_id: tmdbId(movie), media_type: mediaType(movie) });
}

watch(currentUserId, userId => {
  if (userId) void loadActiveTab();
});

watch(() => entries.entries.length, () => {
  if (currentUserId.value && activeTab.value === 'recommend') void loadActiveTab();
});

onMounted(() => {
  timer = window.setInterval(() => { nowTick.value = Date.now(); }, 1000);
  void loadActiveTab();
});

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer);
});
</script>

<template>
  <section class="vue-discover-panel">
    <div class="discover-subtabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="{ active: activeTab === tab.key, 'fd-tab': tab.key === 'recommend' && tabLabel(tab.key).toLowerCase().includes('fd'), 'ceci-tab': tab.key === 'recommend' && tabLabel(tab.key).toLowerCase().includes('ceci') }"
        @click="setTab(tab.key)"
      >
        {{ tabLabel(tab.key) }}
      </button>
    </div>

    <div v-if="loading" class="discover-spinner"><div class="spinner"></div></div>
    <EmptyState v-else-if="errorMessage" title="加载失败，请稍后重试" :detail="errorMessage" />
    <EmptyState
      v-else-if="movies === null"
      icon="🎬"
      :title="`评价 25 部以上电影后`"
      :detail="`Ceci 会为你生成个性化推荐 · 当前已评价 ${ratedCount} 部`"
    />
    <EmptyState v-else-if="!pageMovies.length" :title="activeTab === 'toprated' && topRatedUnwatched ? '全部已看过' : '暂无推荐，试试热门标签吧'" />

    <template v-else>
      <div class="discover-topbar">
        <template v-if="activeTab === 'recommend'">
          <button class="btn btn-sm btn-secondary" type="button" :disabled="cooldownRemaining > 0" @click.stop="refreshRecommendations">刷新推荐</button>
          <span id="discoverRefreshHint" class="topbar-count">{{ refreshHint }}</span>
        </template>
        <template v-else>
          <span class="topbar-count">{{ topbarCount }}</span>
          <button
            v-if="activeTab === 'toprated'"
            class="toggle-pill"
            type="button"
            :class="{ active: topRatedUnwatched }"
            @click="toggleTopRatedUnwatched"
          >
            只看未看
          </button>
        </template>
      </div>

      <div class="discover-grid">
        <article
          v-for="movie in pageMovies"
          :key="`${mediaType(movie)}:${tmdbId(movie)}`"
          class="discover-card"
          :data-tmdb-id="tmdbId(movie)"
          :data-media-type="mediaType(movie)"
          @click="openDetail(movie)"
        >
          <div class="dc-poster-wrap">
            <img v-if="posterUrl(movie.poster_path)" :src="posterUrl(movie.poster_path)" :alt="titleOf(movie)" loading="lazy">
            <div v-else class="dc-no-poster">🎬</div>
            <span v-if="movie.vote_average" class="dc-tmdb-score">⭐ {{ Number(movie.vote_average).toFixed(1) }}</span>
          </div>
          <div class="dc-info">
            <div class="dc-title">{{ titleOf(movie) }}</div>
            <div class="dc-meta">{{ yearOf(movie) || '未知' }}{{ movie.original_language ? ` · ${movie.original_language.toUpperCase()}` : '' }}</div>
            <div v-if="genresOf(movie).length" class="dc-genres">
              <span v-for="genre in genresOf(movie)" :key="genre" class="dc-genre">{{ genre }}</span>
            </div>
            <div v-if="movie.reasons?.length" class="dc-reasons">
              <span v-for="reason in movie.reasons.slice(0, 2)" :key="reason" class="dc-reason">{{ reason }}</span>
            </div>
            <div class="dc-action" @click.stop>
              <div v-if="isRated(movie)" class="dc-rated-badge">已评价 ✓</div>
              <div v-else class="dc-action-row">
                <button class="btn btn-sm btn-secondary dc-rate-btn" type="button" @click.stop="rateMovie(movie)">＋我的评分</button>
                <button
                  class="btn btn-xs dc-watch-btn"
                  type="button"
                  :class="{ active: watchlistIds.has(listKey(movie)) }"
                  :title="watchlistIds.has(listKey(movie)) ? '移出想看' : '加入想看'"
                  @click.stop="toggleWatch(movie)"
                >
                  {{ watchlistIds.has(listKey(movie)) ? '★' : '☆' }}
                </button>
                <button
                  v-if="couple.activeCouple"
                  class="btn btn-xs dc-next-btn"
                  type="button"
                  :class="{ active: queueIds.has(listKey(movie)) }"
                  :title="queueIds.has(listKey(movie)) ? '已在下次看' : '加入下次看'"
                  @click.stop="addNext(movie)"
                >
                  ▶
                </button>
                <button v-if="activeTab === 'recommend'" class="btn btn-xs dc-block-btn" type="button" title="不再推荐" @click.stop="block(movie)">🚫</button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <PaginationControls
        v-if="activeTab === 'toprated' && totalPages > 1"
        :page="currentPage"
        :total-pages="totalPages"
        variant="discover"
        kind="discover"
        @change="setPage"
      />
    </template>
  </section>
</template>
