<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { deleteEntry as deleteEntryApi } from '../../api/entries-api.js';
import { refreshVueData } from '../../app/data-sync.js';
import { getCurrentUser } from '../../app/user-context.js';
import { DIM_LABELS, TMDB_PROXY, WEIGHTS, type RatingDim } from '../../config/constants.js';
import { PaginationControls } from '../../shared/components/index.js';
import { readJsonStorage, writeJsonStorage } from '../../shared/composables/useBrowserStorage.js';
import { useConfirm } from '../../shared/composables/useConfirm.js';
import { useMediaActions } from '../../shared/composables/useMediaActions.js';
import { getSeasonAwareEntryScore } from '../../shared/scoring.js';
import { posterUrl } from '../../shared/tmdb.js';
import { fetchTmdbDetail, getCachedTmdbDetail, needsTmdbDetailFetch } from '../../shared/tmdb-detail.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useListControlsStore } from '../../stores/list-controls.js';
import { useModalStore } from '../../stores/modals.js';
import { useSessionStore } from '../../stores/session.js';
import { useUiStore } from '../../stores/ui.js';
import type { Entry, MediaType, RatingDims } from '../../types/domain.js';

defineOptions({ name: 'ListBody' });

type UserLike = {
  id?: string;
};

type UserColor = {
  key: 'mine' | 'ceci' | 'friend';
  main: string;
  dim: string;
};

type EntryGroup = Entry[] & {
  _avgScore?: number;
};

type MediaSearchRecord = Record<string, unknown> & {
  title_zh?: string;
  title_en?: string;
  original_title?: string;
  director_zh?: string;
  director_en?: string;
  cast_zh?: string;
  cast_en?: string;
  fetched_at?: number;
  version?: number;
};

const pageSize = 20;
const searchIndexBatchSize = 20;

const entries = useEntriesStore();
const controls = useListControlsStore();
const session = useSessionStore();
const ui = useUiStore();
const mediaActions = useMediaActions();
const modals = useModalStore();
const { confirmAction } = useConfirm();
const { mode, type, owner, search, sort, score, page } = storeToRefs(controls);

const detailCache = ref<Record<string, Record<string, unknown>>>({});
const mediaSearchCache = ref<Record<string, MediaSearchRecord>>({});
let warmingDetails = false;
let warmingSearch = false;

const currentUser = computed(() => getCurrentUser<UserLike>(session.currentUser));
const currentUserId = computed(() => currentUser.value?.id || '');

function fmtDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeText(value: unknown): string {
  const raw = stringifySearchValue(value);
  const normalized = raw.normalize ? raw.normalize('NFKC') : raw;
  return normalized
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stringifySearchValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(stringifySearchValue).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return [
      record.name,
      record.title,
      record.title_zh,
      record.title_en,
      record.original_title,
      record.original_name,
      record.director_zh,
      record.director_en,
      record.cast_zh,
      record.cast_en,
      record.character,
    ].map(stringifySearchValue).filter(Boolean).join(' ');
  }
  return String(value || '');
}

function searchTokens(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(' ').filter(Boolean) : [];
}

function entrySearchText(entry: Entry): string {
  const detail = detailFor(entry);
  const searchRecord = searchRecordFor(entry);
  return normalizeText([
    entry.title,
    (entry as Entry & { original_title?: string }).original_title,
    detail?.title,
    detail?.original_title,
    detail?.original_name,
    detail?.overview,
    ...(Array.isArray(detail?.cast) ? detail.cast : []),
    ...(Array.isArray(detail?.genres) ? detail.genres : []),
    ...(Array.isArray(detail?.keyword_names) ? detail.keyword_names : []),
    searchRecord?.title_zh,
    searchRecord?.title_en,
    searchRecord?.original_title,
    searchRecord?.director_zh,
    searchRecord?.director_en,
    searchRecord?.cast_zh,
    searchRecord?.cast_en,
    entry.director,
    entry.year,
    entries.profiles[entry.user_id]?.display_name,
  ]);
}

function mediaType(entry: Entry): MediaType {
  return (entry.type || entry.media_type) === 'series' ? 'series' : 'movie';
}

function entryScore(entry: Entry): number {
  return getSeasonAwareEntryScore(entry, entries.seasonRatings);
}

function groupKey(entry: Entry): string {
  return entry.tmdb_id
    ? `tmdb_${entry.tmdb_id}`
    : `title_${entry.title.toLowerCase().trim()}_${entry.year || 0}`;
}

function loadDetailCache(): void {
  detailCache.value = readJsonStorage<Record<string, Record<string, unknown>>>('filmnote_movie_cache', {});
}

function loadMediaSearchCache(): void {
  mediaSearchCache.value = readJsonStorage<Record<string, MediaSearchRecord>>('filmnote_media_search_cache_v1', {});
}

function searchRecordFor(entry: Entry): MediaSearchRecord | null {
  const tmdbId = Number(entry.tmdb_id || 0);
  if (!tmdbId) return null;
  return mediaSearchCache.value[`${mediaType(entry)}:${tmdbId}`] || null;
}

function isSearchRecordComplete(record: MediaSearchRecord | null): boolean {
  if (!record || Number(record.version || 0) < 2 || !record.fetched_at) return false;
  return /[a-z]/i.test(normalizeText([
    record.title_en,
    record.original_title,
    record.director_en,
    record.cast_en,
  ]));
}

function saveMediaSearchRecords(records: Record<string, MediaSearchRecord>): void {
  if (!records || !Object.keys(records).length) return;
  const next = { ...mediaSearchCache.value };
  for (const [key, record] of Object.entries(records)) {
    if (!record || !Object.values(record).some(value => String(value || '').trim())) continue;
    next[key] = {
      ...(next[key] || {}),
      ...record,
      version: 2,
      fetched_at: Date.now(),
    };
  }
  mediaSearchCache.value = next;
  writeJsonStorage('filmnote_media_search_cache_v1', next);
}

async function warmDetailCache(): Promise<void> {
  if (warmingDetails) return;
  const targets = entries.entries
    .map(entry => ({ type: mediaType(entry), tmdbId: Number(entry.tmdb_id || 0) }))
    .filter(item => item.tmdbId && needsTmdbDetailFetch(getCachedTmdbDetail(item.type, item.tmdbId)));
  const uniqueTargets = Array.from(new Map(targets.map(item => [`${item.type}:${item.tmdbId}`, item])).values()).slice(0, 60);
  if (!uniqueTargets.length) return;
  warmingDetails = true;
  try {
    for (const item of uniqueTargets) {
      await fetchTmdbDetail(item.type, item.tmdbId).catch(() => null);
    }
    loadDetailCache();
  } finally {
    warmingDetails = false;
  }
}

async function warmMediaSearchCache(): Promise<void> {
  if (warmingSearch) return;
  const targets = entries.entries
    .map(entry => ({ type: mediaType(entry), tmdbId: Number(entry.tmdb_id || 0), key: `${mediaType(entry)}:${Number(entry.tmdb_id || 0)}` }))
    .filter(item => item.tmdbId && !isSearchRecordComplete(mediaSearchCache.value[item.key] || null));
  const uniqueTargets = Array.from(new Map(targets.map(item => [item.key, item])).values());
  if (!uniqueTargets.length) return;
  warmingSearch = true;
  try {
    for (let index = 0; index < uniqueTargets.length; index += searchIndexBatchSize) {
      const batch = uniqueTargets.slice(index, index + searchIndexBatchSize);
      const response = await fetch(`${TMDB_PROXY}/search-index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: batch.map(item => ({ media_type: item.type, tmdb_id: item.tmdbId })) }),
      });
      if (!response.ok) continue;
      const data = await response.json().catch(() => ({})) as { results?: Record<string, MediaSearchRecord> };
      saveMediaSearchRecords(data.results || {});
    }
  } catch {
    // English search keeps using whatever cache is already available.
  } finally {
    warmingSearch = false;
  }
}

function detailFor(entry: Entry): Record<string, unknown> | null {
  const tmdbId = Number(entry.tmdb_id || 0);
  if (!tmdbId) return null;
  const key = `${mediaType(entry)}:${tmdbId}`;
  return detailCache.value[key] || detailCache.value[String(tmdbId)] || null;
}

function displayName(userId: string): string {
  return entries.profiles[userId]?.display_name || '未知';
}

function userName(userId: string): string {
  return displayName(userId).toLowerCase();
}

function userColor(userId: string): UserColor {
  const name = userName(userId);
  if (name === 'fank1ng') return { key: 'mine', main: '#d4a853', dim: '#3a3020' };
  if (name === 'ceci') return { key: 'ceci', main: '#FF69B4', dim: '#2a1525' };
  return { key: 'friend', main: '#5b9db0', dim: '#1a2a30' };
}

function isPrivileged(): boolean {
  const name = userName(currentUserId.value);
  return name === 'fank1ng' || name === 'ceci';
}

const filteredGroups = computed<EntryGroup[]>(() => {
  const tokens = searchTokens(search.value);
  const filtered = entries.entries.filter(entry => {
    if (mediaType(entry) !== type.value) return false;
    if (owner.value === 'me' && entry.user_id !== currentUserId.value) return false;
    if (tokens.length && !tokens.every(token => entrySearchText(entry).includes(token))) return false;
    return true;
  });

  const groups: EntryGroup[] = [];
  const seen = new Set<string>();
  for (const entry of filtered) {
    const key = groupKey(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    const group = filtered.filter(item => groupKey(item) === key) as EntryGroup;
    group._avgScore = group.reduce((sum, item) => sum + entryScore(item), 0) / group.length;
    groups.push(group);
  }

  const scored = score.value === 'all'
    ? groups
    : groups.filter(group => Math.floor(group._avgScore || 0) === Number(score.value));

  return [...scored].sort((a, b) => {
    switch (sort.value) {
      case 'score-desc': return (b._avgScore || 0) - (a._avgScore || 0);
      case 'score-asc': return (a._avgScore || 0) - (b._avgScore || 0);
      case 'count-desc': return b.length - a.length;
      case 'date-desc': return new Date(b[0]?.created_at || 0).getTime() - new Date(a[0]?.created_at || 0).getTime();
      case 'date-asc': return new Date(a[0]?.created_at || 0).getTime() - new Date(b[0]?.created_at || 0).getTime();
      case 'title': return (a[0]?.title || '').localeCompare(b[0]?.title || '', 'zh');
      default: return 0;
    }
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredGroups.value.length / pageSize)));
const pageGroups = computed(() => {
  const normalizedPage = Math.min(page.value, totalPages.value);
  const start = (normalizedPage - 1) * pageSize;
  return filteredGroups.value.slice(start, start + pageSize);
});

function mainEntry(group: EntryGroup): Entry {
  return group.find(entry => entry.user_id === currentUserId.value) || group[0];
}

function seasonCount(entry: Entry): number {
  if (mediaType(entry) !== 'series') return 0;
  return entries.seasonRatings.filter(row => row.entry_id === entry.id && row.user_id === entry.user_id).length;
}

function dimensionItems(ratings: RatingDims = {}) {
  return (Object.keys(WEIGHTS) as RatingDim[]).map(dim => ({
    dim,
    label: DIM_LABELS[dim].slice(0, 2),
    value: ratings[dim] || 5,
  }));
}

function visibleRows(group: EntryGroup): Entry[] {
  const current = currentUserId.value;
  if (!group.length) return [];
  const mine = group.find(entry => entry.user_id === current);
  if (isPrivileged()) {
    const otherPrivileged = group.find(entry => {
      const name = userName(entry.user_id);
      return (name === 'fank1ng' || name === 'ceci') && entry.user_id !== current;
    });
    const rest = group.filter(entry => {
      const name = userName(entry.user_id);
      return name !== 'fank1ng' && name !== 'ceci' && entry.user_id !== current;
    });
    return [mine, otherPrivileged, ...rest].filter((entry): entry is Entry => !!entry);
  }
  const fank1ng = group.find(entry => userName(entry.user_id) === 'fank1ng' && entry.user_id !== current);
  const ceci = group.find(entry => userName(entry.user_id) === 'ceci' && entry.user_id !== current);
  const preferred = [mine, fank1ng, ceci].filter((entry): entry is Entry => !!entry);
  return preferred.length ? preferred : group.filter(entry => entry.user_id !== current);
}

function rowActionEntry(group: EntryGroup): Entry | null {
  return group.find(entry => entry.user_id === currentUserId.value)
    || group.find(entry => entry.user_id !== currentUserId.value)
    || null;
}

function showDetail(entry: Entry): void {
  mediaActions.openEntryDetail(entry.id);
}

function editEntry(entry: Entry): void {
  modals.openQuickEdit(entry.id);
}

async function deleteEntry(entry: Entry): Promise<void> {
  if (!confirmAction('确定删除这条评价？此操作不可恢复。')) return;
  const { error } = await deleteEntryApi(entry.id);
  if (error) {
    ui.showToast(`删除失败: ${error.message || '请稍后重试'}`);
    return;
  }
  await refreshVueData();
  ui.showToast('评价已删除');
}

function addMyRating(entry: Entry): void {
  mediaActions.rateMedia({
    id: entry.tmdb_id,
    tmdb_id: entry.tmdb_id,
    media_type: mediaType(entry),
    type: mediaType(entry),
    title: entry.title,
    year: entry.year || null,
    poster_path: entry.poster_path || '',
    director: entry.director || '',
  });
}

function changePage(nextPage: number): void {
  controls.setPage(nextPage);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

onMounted(() => {
  loadDetailCache();
  loadMediaSearchCache();
  void warmDetailCache();
  void warmMediaSearchCache();
});

watch(() => entries.entries.map(entry => `${mediaType(entry)}:${entry.tmdb_id || entry.id}`).join('|'), () => {
  loadDetailCache();
  loadMediaSearchCache();
  void warmDetailCache();
  void warmMediaSearchCache();
});

watch([pageGroups, () => ui.highlightEntryId], async () => {
  const id = ui.highlightEntryId;
  if (!id) return;
  await nextTick();
  const element = document.getElementById(`entry-${id}`);
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.classList.add('entry-highlight');
  window.setTimeout(() => element.classList.remove('entry-highlight'), 1800);
  ui.clearHighlightEntry();
}, { flush: 'post' });

</script>

<template>
  <section v-if="mode === 'entries'" class="vue-list-body">
    <div v-if="!filteredGroups.length" class="empty-state">
      <p style="font-size:2rem">🎬</p>
      <p>还没有评价记录</p>
    </div>

    <template v-else>
      <article
        v-for="group in pageGroups"
        :id="`entry-${mainEntry(group).id}`"
        :key="groupKey(mainEntry(group))"
        class="movie-card"
        :aria-label="mainEntry(group).title"
        @click="showDetail(mainEntry(group))"
      >
        <img v-if="mainEntry(group).poster_path" class="mc-poster" :src="posterUrl(mainEntry(group).poster_path)" alt="">
        <div v-else class="mc-poster"></div>

        <div class="mc-scores-compare" :style="{ flexWrap: group.length > 1 ? 'wrap' : undefined, gap: group.length > 1 ? '8px' : undefined }">
          <div
            v-for="entry in visibleRows(group)"
            :key="entry.id"
            class="mc-score-sm"
            :class="`mc-score-${userColor(entry.user_id).key}`"
            :title="displayName(entry.user_id)"
          >
            <span class="mc-score-label">{{ displayName(entry.user_id) }}</span>
            {{ entryScore(entry).toFixed(1) }}
          </div>
        </div>

        <div class="mc-info">
          <div class="mc-title">
            {{ mainEntry(group).title }}
            <span v-if="mainEntry(group).year" style="color:var(--text2);font-weight:400">({{ mainEntry(group).year }})</span>
            <span v-if="mediaType(mainEntry(group)) === 'series'" style="font-size:0.7rem;color:var(--gold)"> 剧集</span>
          </div>
          <div class="mc-meta">
            <span>{{ [mainEntry(group).director, fmtDate(mainEntry(group).created_at)].filter(Boolean).join(' · ') }}</span>
            <span
              v-if="mainEntry(group).user_id !== currentUserId"
              class="mc-owner"
              :style="{ color: userColor(mainEntry(group).user_id).main, background: userColor(mainEntry(group).user_id).dim }"
            >
              {{ displayName(mainEntry(group).user_id) }}
            </span>
            <span v-if="seasonCount(mainEntry(group)) > 0" class="mc-season-badge">S1-S{{ seasonCount(mainEntry(group)) }}</span>
          </div>

          <div class="mc-dim-scores" style="flex-direction:column;gap:2px">
            <div
              v-for="entry in visibleRows(group)"
              :key="`dims-${entry.id}`"
              class="mc-dim-row-user"
              style="display:flex;align-items:center;gap:6px;padding:2px 0"
            >
              <span class="mc-dim-user" :style="{ color: userColor(entry.user_id).main }">{{ displayName(entry.user_id) }}</span>
              <span class="mc-dim-dots">
                <span
                  v-for="dim in dimensionItems(entry.ratings || {})"
                  :key="dim.dim"
                  class="mc-dim-item"
                  :style="{ borderColor: userColor(entry.user_id).main }"
                >
                  <span class="dim-lab">{{ dim.label }}</span>
                  <span class="dim-val" :style="{ color: userColor(entry.user_id).main }">{{ dim.value }}</span>
                </span>
              </span>
              <span class="mc-dim-total" :style="{ color: userColor(entry.user_id).main }">总分 {{ entryScore(entry).toFixed(1) }}</span>
              <div v-if="entry.user_id === currentUserId" class="mc-actions" style="margin-left:auto" @click.stop>
                <button class="btn btn-sm btn-secondary" type="button" @click="editEntry(entry)">编辑</button>
                <button class="btn btn-sm btn-danger" type="button" @click="deleteEntry(entry)">删除</button>
              </div>
            </div>
          </div>

          <div v-if="mainEntry(group).comment" class="mc-comment">{{ mainEntry(group).comment }}</div>
        </div>

        <div v-if="rowActionEntry(group)" class="mc-actions-mobile" @click.stop>
          <template v-if="rowActionEntry(group)?.user_id === currentUserId">
            <button class="btn btn-sm btn-secondary" type="button" @click="editEntry(rowActionEntry(group)!)">编辑</button>
            <button class="btn btn-sm btn-danger" type="button" @click="deleteEntry(rowActionEntry(group)!)">删除</button>
          </template>
          <button v-else class="btn btn-sm btn-secondary" type="button" @click="addMyRating(rowActionEntry(group)!)">+ 我的评分</button>
        </div>
      </article>

      <PaginationControls :page="page" :total-pages="totalPages" kind="list" @change="changePage" />
    </template>
  </section>
</template>
