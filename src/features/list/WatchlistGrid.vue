<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { removeWatchlistItem } from '../../api/list-api.js';
import { refreshVueData } from '../../app/data-sync.js';
import { getLegacyBridge, onLegacyReady } from '../../app/legacy-bridge.js';
import { PaginationControls } from '../../shared/components/index.js';
import { posterUrl } from '../../shared/tmdb.js';
import { useListsStore } from '../../stores/lists.js';
import type { MediaType, WatchlistItem } from '../../types/domain.js';

defineOptions({ name: 'WatchlistGrid' });

type ListControlState = {
  mode?: 'entries' | 'watchlist';
  watchlistPage?: number;
};

const pageSize = 12;

const lists = useListsStore();
const mode = ref<'entries' | 'watchlist'>('entries');
const page = ref(1);
let stopLegacyReady: (() => void) | null = null;

const totalPages = computed(() => Math.max(1, Math.ceil(lists.watchlist.length / pageSize)));
const pageItems = computed(() => {
  const normalizedPage = Math.min(page.value, totalPages.value);
  const start = (normalizedPage - 1) * pageSize;
  return lists.watchlist.slice(start, start + pageSize);
});

function mediaLabel(mediaType: MediaType): string {
  return mediaType === 'series' ? '剧集' : '电影';
}

function itemYear(item: WatchlistItem): string {
  return String(item.year || item.release_date?.slice(0, 4) || '');
}

function rateItem(item: WatchlistItem): void {
  if (item.media_type === 'movie') {
    window.FilmNoteVueRatings?.openQuickRate?.({
      id: item.tmdb_id,
      tmdb_id: item.tmdb_id,
      media_type: item.media_type,
      title: item.title || `TMDB #${item.tmdb_id}`,
      year: item.year || null,
      poster_path: item.poster_path || '',
    });
    return;
  }
  getLegacyBridge()?.ratings?.openQuickRate?.({
    id: item.tmdb_id,
    tmdb_id: item.tmdb_id,
    media_type: item.media_type,
    title: item.title || `TMDB #${item.tmdb_id}`,
    year: item.year || null,
    poster_path: item.poster_path || '',
  });
}

async function removeItem(item: WatchlistItem): Promise<void> {
  const bridge = getLegacyBridge();
  if (bridge?.list?.toggleWatchlist) {
    await bridge.list.toggleWatchlist(item.tmdb_id, item);
  } else {
    await removeWatchlistItem(item.user_id, item.media_type, item.tmdb_id);
  }
  await refreshVueData();
}

async function showDetail(item: WatchlistItem): Promise<void> {
  if (!window.FilmNoteVueMediaDetail?.openListItem?.(item)) {
    await getLegacyBridge()?.list?.showListItemDetail?.(item);
  }
}

function changePage(nextPage: number): void {
  page.value = nextPage;
  getLegacyBridge()?.list?.updateControls?.({ watchlistPage: nextPage });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyControls(state: ListControlState = {}): void {
  if ('mode' in state) mode.value = state.mode === 'watchlist' ? 'watchlist' : 'entries';
  if ('watchlistPage' in state) page.value = Math.max(1, Number(state.watchlistPage || 1));
}

function onLegacyControls(event: Event): void {
  applyControls((event as CustomEvent<ListControlState>).detail || {});
}

onMounted(() => {
  stopLegacyReady = onLegacyReady(bridge => applyControls((bridge.list?.getControls?.() || {}) as ListControlState));
  window.addEventListener('filmnote:list-controls', onLegacyControls);
});

onBeforeUnmount(() => {
  stopLegacyReady?.();
  window.removeEventListener('filmnote:list-controls', onLegacyControls);
});
</script>

<template>
  <section v-if="mode === 'watchlist'" class="vue-watchlist-grid">
    <div v-if="!lists.watchlist.length" class="empty-state">
      <p style="font-size:0.85rem">暂无想看的电影</p>
    </div>

    <template v-else>
      <div class="discover-grid">
        <article
          v-for="item in pageItems"
          :key="`${item.media_type}:${item.tmdb_id}`"
          class="discover-card"
          :data-tmdb-id="item.tmdb_id"
          :data-media-type="item.media_type"
          @click="showDetail(item)"
        >
          <div class="dc-poster-wrap">
            <img v-if="item.poster_path" :src="posterUrl(item.poster_path)" :alt="item.title || ''" loading="lazy">
            <div v-else class="dc-no-poster">☆</div>
          </div>
          <div class="dc-info">
            <div class="dc-title">{{ item.title || `TMDB #${item.tmdb_id}` }}</div>
            <div class="dc-meta">{{ itemYear(item) || '未知' }} · {{ mediaLabel(item.media_type) }}</div>
            <div class="dc-action">
              <div class="dc-action-row">
                <button class="btn btn-sm btn-secondary" type="button" @click.stop="rateItem(item)">+ 我的评分</button>
                <button class="btn btn-xs dc-watch-btn active" type="button" title="移出想看" @click.stop="removeItem(item)">★</button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <PaginationControls :page="page" :total-pages="totalPages" @change="changePage" />
    </template>
  </section>
</template>
