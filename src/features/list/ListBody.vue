<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { DIM_LABELS, WEIGHTS, type RatingDim } from '../../config/constants.js';
import { getLegacyBridge, onLegacyReady } from '../../app/legacy-bridge.js';
import { PaginationControls } from '../../shared/components/index.js';
import { getEntryScore } from '../../shared/scoring.js';
import { posterUrl } from '../../shared/tmdb.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useSessionStore } from '../../stores/session.js';
import type { Entry, MediaType, RatingDims } from '../../types/domain.js';

defineOptions({ name: 'ListBody' });

type UserLike = {
  id?: string;
};

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
  page?: number;
};

type UserColor = {
  key: 'mine' | 'ceci' | 'friend';
  main: string;
  dim: string;
};

type EntryGroup = Entry[] & {
  _avgScore?: number;
};

const pageSize = 20;

const entries = useEntriesStore();
const session = useSessionStore();

const mode = ref<ListMode>('entries');
const type = ref<MediaType>('movie');
const owner = ref<OwnerFilter>('all');
const search = ref('');
const sort = ref<SortBy>('date-desc');
const score = ref<ScoreFilter>('all');
const page = ref(1);
let stopLegacyReady: (() => void) | null = null;

const currentUser = computed(() => session.currentUser as UserLike | null);
const currentUserId = computed(() => currentUser.value?.id || '');

function fmtDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeText(value: unknown): string {
  const raw = Array.isArray(value) ? value.join(' ') : String(value || '');
  const normalized = raw.normalize ? raw.normalize('NFKC') : raw;
  return normalized
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function searchTokens(value: string): string[] {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(' ').filter(Boolean) : [];
}

function entrySearchText(entry: Entry): string {
  return normalizeText([
    entry.title,
    entry.director,
    entry.year,
    entries.profiles[entry.user_id]?.display_name,
  ]);
}

function mediaType(entry: Entry): MediaType {
  return (entry.type || entry.media_type) === 'series' ? 'series' : 'movie';
}

function groupKey(entry: Entry): string {
  return entry.tmdb_id
    ? `tmdb_${entry.tmdb_id}`
    : `title_${entry.title.toLowerCase().trim()}_${entry.year || 0}`;
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
    group._avgScore = group.reduce((sum, item) => sum + getEntryScore(item), 0) / group.length;
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
  getLegacyBridge()?.list?.showDetail?.(entry.id);
}

function editEntry(entry: Entry): void {
  getLegacyBridge()?.ratings?.openQuickEdit?.(entry.id);
}

function deleteEntry(entry: Entry): void {
  getLegacyBridge()?.ratings?.deleteEntry?.(entry.id);
}

function addMyRating(entry: Entry): void {
  getLegacyBridge()?.list?.addMyRating?.(entry.id);
}

function changePage(nextPage: number): void {
  page.value = nextPage;
  getLegacyBridge()?.list?.updateControls?.({ page: nextPage });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function asControlState(input: unknown): ListControlState {
  return (input || {}) as ListControlState;
}

function applyControls(state: ListControlState): void {
  mode.value = state.mode === 'watchlist' ? 'watchlist' : 'entries';
  type.value = state.type === 'series' ? 'series' : 'movie';
  owner.value = state.owner === 'me' ? 'me' : 'all';
  search.value = state.search || '';
  sort.value = state.sort || 'date-desc';
  score.value = state.score || 'all';
  page.value = Math.max(1, Number(state.page || 1));
}

function onLegacyControls(event: Event): void {
  applyControls(asControlState((event as CustomEvent<ListControlState>).detail));
}

onMounted(() => {
  stopLegacyReady = onLegacyReady(bridge => applyControls(asControlState(bridge.list?.getControls?.())));
  window.addEventListener('filmnote:list-controls', onLegacyControls);
});

onBeforeUnmount(() => {
  stopLegacyReady?.();
  window.removeEventListener('filmnote:list-controls', onLegacyControls);
});
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
            {{ getEntryScore(entry).toFixed(1) }}
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
              <span class="mc-dim-total" :style="{ color: userColor(entry.user_id).main }">总分 {{ getEntryScore(entry).toFixed(1) }}</span>
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

      <PaginationControls :page="page" :total-pages="totalPages" @change="changePage" />
    </template>
  </section>
</template>
