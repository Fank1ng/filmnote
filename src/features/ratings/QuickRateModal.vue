<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  createEntry,
  deleteSeasonRatings,
  saveSeasonRatings,
  updateEntry,
} from '../../api/entries-api.js';
import { refreshVueData } from '../../app/data-sync.js';
import { getCurrentUser } from '../../app/user-context.js';
import { DIM_LABELS, WEIGHTS, type RatingDim } from '../../config/constants.js';
import { BaseModal, RatingSliders } from '../../shared/components/index.js';
import { posterUrl } from '../../shared/tmdb.js';
import { calcTotal } from '../../shared/scoring.js';
import { fetchTmdbDetail, getCachedTmdbDetail, needsTmdbDetailFetch } from '../../shared/tmdb-detail.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useListControlsStore } from '../../stores/list-controls.js';
import { useModalStore } from '../../stores/modals.js';
import { useSessionStore } from '../../stores/session.js';
import { useUiStore } from '../../stores/ui.js';
import type { Entry, MediaType, RatingDims, SeasonRating, TmdbDetail } from '../../types/domain.js';

defineOptions({ name: 'QuickRateModal' });

type UserLike = {
  id?: string;
};

type MediaLike = {
  id?: number | string | null;
  tmdb_id?: number | string | null;
  media_type?: MediaType | 'tv';
  type?: MediaType | 'tv';
  title?: string;
  name?: string;
  year?: number | string | null;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string | null;
  director?: string;
  number_of_seasons?: number | string | null;
  seasons?: unknown[];
  ratingMode?: 'total' | 'season';
  fillSeasonPlaceholders?: boolean;
};

type SeasonDraft = {
  key: number;
  id?: string | number;
  season_number: number;
  season_title: string;
  ratings: RatingDims;
  comment: string;
  total_score?: number | null;
  enabled: boolean;
  placeholder: boolean;
  overview?: string;
  air_date?: string;
  episode_count?: number;
  episode_runtime_total?: number;
  average_episode_runtime?: number;
  director?: string;
  cast?: unknown[];
};

type Mode = 'total' | 'season';
type QuickEditOptions = {
  targetSeasonNumber?: number;
  enableTargetSeason?: boolean;
};

const defaultRatings = (): RatingDims => ({
  story: 5,
  character: 5,
  visual: 5,
  editing: 5,
  sound: 5,
  emotion: 5,
});

const ui = useUiStore();
const session = useSessionStore();
const entries = useEntriesStore();
const listControls = useListControlsStore();
const modals = useModalStore();
const dims = Object.keys(WEIGHTS) as RatingDim[];

const open = ref(false);
const busy = ref(false);
const errorMessage = ref('');
const editEntryId = ref<Entry['id'] | null>(null);
const mode = ref<Mode>('total');
const media = ref<MediaLike | null>(null);
const seasonDetail = ref<TmdbDetail | null>(null);
const ratings = ref<RatingDims>(defaultRatings());
const comment = ref('');
const seasons = ref<SeasonDraft[]>([]);
const activeSeasonKey = ref<number | null>(null);
let seasonKey = 1;
let seasonDetailSeq = 0;

const currentUser = computed(() => getCurrentUser<UserLike>(session.currentUser));
const isEdit = computed(() => editEntryId.value !== null);
const mediaType = computed<MediaType>(() => normalizeMediaType(media.value?.media_type || media.value?.type || 'movie'));
const isSeries = computed(() => mediaType.value === 'series');
const title = computed(() => media.value?.title || media.value?.name || '未命名');
const tmdbId = computed(() => Number(media.value?.tmdb_id || media.value?.id || 0) || null);
const year = computed(() => {
  const direct = Number(media.value?.year || 0);
  if (direct) return direct;
  const date = media.value?.release_date || media.value?.first_air_date || '';
  return Number(String(date).slice(0, 4)) || null;
});
const totalScore = computed(() => calcTotal(ratings.value));
const editableSeasons = computed(() => seasons.value.filter(season => season.enabled && Number(season.season_number || 0) > 0));
const seasonAverage = computed(() => {
  if (!editableSeasons.value.length) return 0;
  const total = editableSeasons.value.reduce((sum, season) => sum + calcTotal(season.ratings), 0);
  return Math.round((total / editableSeasons.value.length) * 10) / 10;
});
const averagedSeasonDims = computed(() => averageSeasonDims());
const activeTotal = computed(() => mode.value === 'season' && editableSeasons.value.length ? seasonAverage.value : totalScore.value);
const modalTitle = computed(() => `${isEdit.value ? '编辑' : '评价'} ${title.value}`);
const modeTabsEnabled = computed(() => isSeries.value && !isEdit.value);
const showFallbackTotal = computed(() => mode.value === 'total' || (mode.value === 'season' && isEdit.value && !editableSeasons.value.length));
const seasonLimit = computed(() => {
  const direct = Number(media.value?.number_of_seasons || seasonDetail.value?.number_of_seasons || 0);
  if (direct > 0) return direct;
  const tmdbSeasons = tmdbSeasonRows();
  return tmdbSeasons.length ? Math.max(...tmdbSeasons.map(row => Number(row.season_number || 0)).filter(Boolean)) : 0;
});
const canAddSeason = computed(() => {
  const limit = seasonLimit.value;
  return !(limit > 0 && seasons.value.length >= limit);
});
const addSeasonLabel = computed(() => canAddSeason.value ? '+ 添加新季' : `已达到 ${seasonLimit.value} 季`);
const activeSeason = computed(() => {
  if (!seasons.value.length) return null;
  return seasons.value.find(season => season.key === activeSeasonKey.value) || seasons.value[0];
});

function normalizeMediaType(type: unknown): MediaType {
  return type === 'series' || type === 'tv' ? 'series' : 'movie';
}

function normalizeMedia(input: unknown): MediaLike | null {
  const item = input as MediaLike | null;
  if (!item) return null;
  const normalizedTitle = item.title || item.name;
  if (!normalizedTitle) return null;
  return {
    ...item,
    media_type: normalizeMediaType(item.media_type || item.type || (item.first_air_date || item.number_of_seasons ? 'series' : 'movie')),
    title: normalizedTitle,
    tmdb_id: item.tmdb_id || item.id || null,
    year: item.year || Number(String(item.release_date || item.first_air_date || '').slice(0, 4)) || null,
    poster_path: item.poster_path || '',
    director: item.director || '',
  };
}

function normalizeQuickEditOptions(opts: unknown): QuickEditOptions {
  const record = (opts || {}) as Record<string, unknown>;
  return {
    targetSeasonNumber: Number(record.targetSeasonNumber || 0) || undefined,
    enableTargetSeason: !!record.enableTargetSeason,
  };
}

function findEntry(id: Entry['id']): Entry | null {
  return entries.entries.find(entry => String(entry.id) === String(id)) ?? null;
}

function text(value: unknown): string {
  return String(value || '').trim();
}

function numberValue(value: unknown): number {
  return Number(value || 0) || 0;
}

function tmdbSeasonRows(): Array<Record<string, unknown>> {
  const detailRows = Array.isArray(seasonDetail.value?.seasons) ? seasonDetail.value.seasons : [];
  const mediaRows = Array.isArray(media.value?.seasons) ? media.value.seasons : [];
  return [...detailRows, ...mediaRows]
    .filter(row => row && typeof row === 'object')
    .map(row => row as Record<string, unknown>)
    .filter(row => Number(row.season_number || 0) > 0);
}

function seasonMetaFrom(row: Partial<SeasonRating> | SeasonDraft | Record<string, unknown>): Partial<SeasonDraft> {
  const record = row as Record<string, unknown>;
  return {
    overview: text(record.overview),
    air_date: text(record.air_date),
    episode_count: numberValue(record.episode_count),
    episode_runtime_total: numberValue(record.episode_runtime_total),
    average_episode_runtime: numberValue(record.average_episode_runtime),
    director: text(record.director),
    cast: Array.isArray(record.cast) ? record.cast : [],
  };
}

function createSeasonDraft(row: Partial<SeasonRating> | Partial<SeasonDraft> | Record<string, unknown>, enabled = true, placeholder = false): SeasonDraft {
  const record = row as Record<string, unknown>;
  return {
    key: seasonKey++,
    id: record.id as string | number | undefined,
    season_number: Number(record.season_number || 0),
    season_title: text(record.season_title || record.name),
    ratings: { ...defaultRatings(), ...((record.ratings || {}) as RatingDims) },
    comment: text(record.comment),
    total_score: Number(record.total_score || 0) || null,
    enabled,
    placeholder,
    ...seasonMetaFrom(row as Record<string, unknown>),
  };
}

function syncActiveSeason(preferredKey: number | null = activeSeasonKey.value): void {
  if (!seasons.value.length) {
    activeSeasonKey.value = null;
    return;
  }
  const preferred = preferredKey ? seasons.value.find(season => season.key === preferredKey) : null;
  const firstEnabled = seasons.value.find(season => season.enabled);
  activeSeasonKey.value = (preferred || firstEnabled || seasons.value[0]).key;
}

function setSeasonRows(rows: Array<Partial<SeasonRating> | Partial<SeasonDraft>>, fillPlaceholders = false, preferredSeasonNumber?: number): void {
  const byNumber = new Map<number, SeasonDraft>();
  rows
    .filter(row => Number(row.season_number || 0) > 0)
    .forEach(row => {
      const draft = createSeasonDraft(row, (row as Partial<SeasonDraft>).enabled !== false, (row as Partial<SeasonDraft>).placeholder === true);
      byNumber.set(draft.season_number, draft);
    });

  if (fillPlaceholders && isSeries.value) {
    tmdbSeasonRows().forEach(tmdbSeason => {
      const seasonNumber = Number(tmdbSeason.season_number || 0);
      if (!seasonNumber) return;
      const existing = byNumber.get(seasonNumber);
      if (existing) {
        byNumber.set(seasonNumber, {
          ...existing,
          season_title: existing.season_title || text(tmdbSeason.name || tmdbSeason.season_title),
          ...seasonMetaFrom(tmdbSeason),
        });
      } else {
        byNumber.set(seasonNumber, createSeasonDraft({
          ...tmdbSeason,
          season_title: tmdbSeason.name || tmdbSeason.season_title,
        }, false, true));
      }
    });

    const limit = seasonLimit.value;
    if (limit > 0 && !tmdbSeasonRows().length) {
      for (let number = 1; number <= limit; number += 1) {
        if (!byNumber.has(number)) byNumber.set(number, createSeasonDraft({ season_number: number }, false, true));
      }
    }
  }

  seasons.value = [...byNumber.values()].sort((a, b) => a.season_number - b.season_number);
  const preferred = preferredSeasonNumber
    ? seasons.value.find(season => Number(season.season_number) === Number(preferredSeasonNumber))
    : null;
  syncActiveSeason(preferred?.key || null);
}

function addSeason(): void {
  if (!canAddSeason.value) {
    ui.showToast(`该剧集共 ${seasonLimit.value} 季，不能继续添加`);
    return;
  }
  const used = seasons.value.map(row => Number(row.season_number || 0)).filter(Boolean);
  const next = used.length ? Math.max(...used) + 1 : 1;
  const draft = createSeasonDraft({ season_number: next }, true, false);
  seasons.value.push(draft);
  syncActiveSeason(draft.key);
}

function addOrFocusSeason(seasonNumber: number): void {
  const normalized = Math.max(1, Number(seasonNumber || 1));
  const exists = seasons.value.find(row => Number(row.season_number) === normalized);
  if (exists) {
    activeSeasonKey.value = exists.key;
    return;
  }
  const draft = createSeasonDraft({ season_number: normalized }, true, false);
  seasons.value.push(draft);
  seasons.value.sort((a, b) => a.season_number - b.season_number);
  syncActiveSeason(draft.key);
}

function removeSeason(key: number): void {
  seasons.value = seasons.value.filter(row => row.key !== key);
  syncActiveSeason();
}

function setActiveSeason(key: number): void {
  activeSeasonKey.value = key;
}

function enableSeason(season: SeasonDraft): void {
  season.enabled = true;
  season.placeholder = false;
  season.ratings = { ...defaultRatings(), ...(season.ratings || {}) };
  season.comment = season.comment || '';
  activeSeasonKey.value = season.key;
}

function seasonTabScore(season: SeasonDraft): string {
  return season.enabled ? calcTotal(season.ratings).toFixed(1) : '未评价';
}

function seasonMeta(season: SeasonDraft): string[] {
  return [
    season.air_date ? `首播 ${season.air_date.slice(0, 10)}` : '',
    season.episode_count ? `${season.episode_count} 集` : '',
    season.episode_runtime_total ? `本季 ${Math.round(season.episode_runtime_total).toLocaleString('zh-CN')} 分钟` : '',
    season.average_episode_runtime ? `平均 ${Number(season.average_episode_runtime).toFixed(1)} 分钟/集` : '',
  ].filter(Boolean);
}

function averageSeasonDims(): RatingDims {
  if (!editableSeasons.value.length) return defaultRatings();
  const result = defaultRatings();
  for (const key of Object.keys(result) as Array<keyof RatingDims>) {
    const total = editableSeasons.value.reduce((sum, season) => sum + Number(season.ratings[key] || 5), 0);
    result[key] = Math.round((total / editableSeasons.value.length) * 10) / 10;
  }
  return result;
}

function switchMode(nextMode: Mode): void {
  if (mode.value === nextMode) return;
  mode.value = nextMode;
  if (nextMode === 'season' && !seasons.value.length) setSeasonRows([], true);
}

async function refreshSeasonDetail(fillPlaceholders: boolean, preferredSeasonNumber?: number): Promise<void> {
  if (!isSeries.value || !tmdbId.value) return;
  const seq = ++seasonDetailSeq;
  const cached = getCachedTmdbDetail('series', tmdbId.value);
  if (cached) seasonDetail.value = cached;
  const expected = Number(media.value?.number_of_seasons || cached?.number_of_seasons || 0);
  const cachedSeasons = Array.isArray(cached?.seasons) ? cached.seasons.filter(row => Number((row as Record<string, unknown>).season_number || 0) > 0) : [];
  const missingSeasons = expected > 0 ? cachedSeasons.length < expected : !cachedSeasons.length;
  if (!needsTmdbDetailFetch(cached) && !missingSeasons) {
    if (fillPlaceholders) setSeasonRows(seasons.value, true, preferredSeasonNumber);
    return;
  }
  const fetched = await fetchTmdbDetail('series', tmdbId.value, { force: missingSeasons }).catch(() => null);
  if (seq !== seasonDetailSeq || !fetched) return;
  seasonDetail.value = fetched;
  media.value = {
    ...(media.value || {}),
    number_of_seasons: fetched.number_of_seasons || media.value?.number_of_seasons || 0,
    seasons: fetched.seasons || media.value?.seasons,
  };
  if (fillPlaceholders) setSeasonRows(seasons.value, true, preferredSeasonNumber);
}

function openQuickRate(input: unknown): boolean {
  const normalized = normalizeMedia(input);
  if (!normalized) return false;
  seasonDetailSeq++;
  editEntryId.value = null;
  media.value = normalized;
  seasonDetail.value = normalized.tmdb_id ? getCachedTmdbDetail(normalized.media_type as MediaType, Number(normalized.tmdb_id)) : null;
  mode.value = normalized.media_type === 'series' && normalized.ratingMode === 'season' ? 'season' : 'total';
  ratings.value = defaultRatings();
  comment.value = '';
  errorMessage.value = '';
  busy.value = false;
  setSeasonRows([], mode.value === 'season' && normalized.fillSeasonPlaceholders === true);
  if (mode.value === 'season') {
    if (!seasons.value.length && !normalized.fillSeasonPlaceholders) {
      addSeason();
    }
    void refreshSeasonDetail(normalized.fillSeasonPlaceholders === true);
  }
  open.value = true;
  return true;
}

function openQuickEdit(id: Entry['id'], rawOpts?: unknown): boolean {
  const opts = normalizeQuickEditOptions(rawOpts);
  const entry = findEntry(id);
  if (!entry) return false;
  seasonDetailSeq++;
  const normalizedType = normalizeMediaType(entry.type || entry.media_type || 'movie');
  const cached = entry.tmdb_id ? getCachedTmdbDetail(normalizedType, Number(entry.tmdb_id)) : null;
  editEntryId.value = entry.id;
  media.value = {
    media_type: normalizedType,
    tmdb_id: entry.tmdb_id || null,
    title: entry.title,
    year: entry.year || null,
    poster_path: entry.poster_path || '',
    director: entry.director || '',
    number_of_seasons: cached?.number_of_seasons || 0,
    seasons: cached?.seasons || [],
  };
  seasonDetail.value = cached;
  ratings.value = { ...defaultRatings(), ...(entry.ratings || {}) };
  comment.value = entry.comment || '';
  errorMessage.value = '';
  busy.value = false;
  const entrySeasons = entries.seasonRatings.filter(row => String(row.entry_id) === String(entry.id));
  mode.value = normalizedType === 'series' ? 'season' : 'total';
  setSeasonRows(entrySeasons, normalizedType === 'series', opts.targetSeasonNumber);
  if (normalizedType === 'series' && opts.targetSeasonNumber && opts.enableTargetSeason) {
    addOrFocusSeason(opts.targetSeasonNumber);
    const target = seasons.value.find(season => Number(season.season_number) === Number(opts.targetSeasonNumber));
    if (target) enableSeason(target);
  }
  open.value = true;
  if (normalizedType === 'series') void refreshSeasonDetail(true, opts.targetSeasonNumber);
  return true;
}

function close(): void {
  open.value = false;
  busy.value = false;
  errorMessage.value = '';
}

function validateSeasons(): string {
  const numbers = editableSeasons.value.map(row => Number(row.season_number || 0));
  if (numbers.some(number => number <= 0)) return '季号必须大于 0';
  const duplicate = numbers.find((number, index) => numbers.indexOf(number) !== index);
  if (duplicate) return `季号 S${duplicate} 重复，请修改后再保存`;
  const limit = seasonLimit.value;
  if (limit > 0) {
    const over = editableSeasons.value.find(row => Number(row.season_number || 0) > limit);
    if (over) return `该剧集共 ${limit} 季，不能添加 S${over.season_number}`;
  }
  return '';
}

async function refreshAfterSave(entryId: Entry['id'] | null, wasNew: boolean, savedMediaType: MediaType): Promise<void> {
  await refreshVueData();
  if (wasNew && entryId) {
    listControls.showEntry(savedMediaType);
    ui.setHighlightEntry(entryId);
    ui.setActiveTab('list');
  }
}

async function submit(): Promise<void> {
  const userId = currentUser.value?.id;
  if (!userId || !media.value) {
    errorMessage.value = '请先登录';
    return;
  }
  const useSeasonMode = isSeries.value && (isEdit.value || mode.value === 'season');
  if (!isEdit.value && isSeries.value && mode.value === 'season' && !editableSeasons.value.length) {
    errorMessage.value = '请先选择至少一季评分';
    return;
  }
  if (useSeasonMode) {
    const seasonError = validateSeasons();
    if (seasonError) {
      errorMessage.value = seasonError;
      return;
    }
  }

  busy.value = true;
  errorMessage.value = '';
  const now = new Date().toISOString();
  const useSeasonRatings = useSeasonMode && editableSeasons.value.length > 0;
  const finalRatings = useSeasonRatings ? averageSeasonDims() : ratings.value;
  const finalTotal = useSeasonRatings ? seasonAverage.value : totalScore.value;
  const finalComment = useSeasonRatings && !isEdit.value ? '' : comment.value.trim();
  let savedEntryId: Entry['id'] | null = editEntryId.value;

  try {
    if (isEdit.value && editEntryId.value !== null) {
      const { error } = await updateEntry(editEntryId.value, {
        ratings: finalRatings,
        total_score: finalTotal,
        comment: finalComment,
        updated_at: now,
      });
      if (error) throw error;
      if (isSeries.value) {
        const { error: deleteError } = await deleteSeasonRatings(editEntryId.value, userId);
        if (deleteError) throw deleteError;
      }
    } else {
      const payload: Partial<Entry> = {
        user_id: userId,
        type: mediaType.value,
        tmdb_id: tmdbId.value,
        title: title.value,
        year: year.value,
        director: media.value.director || '',
        poster_path: media.value.poster_path || '',
        ratings: finalRatings,
        total_score: finalTotal,
        comment: finalComment,
        created_at: now,
        updated_at: now,
      };
      const { data, error } = await createEntry(payload);
      if (error) throw error;
      savedEntryId = (data as { id?: Entry['id'] } | null)?.id ?? null;
    }

    if (useSeasonRatings && savedEntryId !== null) {
      const rows: SeasonRating[] = editableSeasons.value.map(row => ({
        entry_id: savedEntryId as Entry['id'],
        user_id: userId,
        season_number: Number(row.season_number),
        season_title: row.season_title.trim(),
        ratings: row.ratings,
        total_score: calcTotal(row.ratings),
        comment: row.comment.trim(),
      }));
      const { error } = await saveSeasonRatings(rows);
      if (error) throw error;
    }

    ui.showToast(isEdit.value ? '评价已更新！' : '评价已保存！');
    close();
    await refreshAfterSave(savedEntryId, !isEdit.value, mediaType.value);
  } catch (error) {
    errorMessage.value = '保存失败: ' + (error instanceof Error ? error.message : String(error));
  } finally {
    busy.value = false;
  }
}

watch(() => modals.quickRateRequest?.seq, () => {
  const request = modals.quickRateRequest;
  if (!request) return;
  if (request.kind === 'edit') {
    openQuickEdit(request.id, request.opts);
    return;
  }
  openQuickRate({ ...(request.media as Record<string, unknown>), ...(request.opts || {}) });
});
</script>

<template>
  <BaseModal :open="open" max-width="640px" labelled-by="quick-rate-title" @close="close">
    <div class="quick-rate-vue">
      <div class="quick-rate-head">
        <img v-if="media?.poster_path" :src="posterUrl(media.poster_path)" :alt="title">
        <div v-else class="qr-poster-empty">No poster</div>
        <div>
          <h3 id="quick-rate-title">{{ modalTitle }}</h3>
          <p class="modal-hint">{{ mediaType === 'series' ? '剧集' : '电影' }}<span v-if="year"> · {{ year }}</span></p>
        </div>
      </div>

      <div v-if="modeTabsEnabled" class="list-subtabs quick-rate-mode-tabs">
        <button type="button" :class="{ active: mode === 'total' }" @click="switchMode('total')">总评分</button>
        <button type="button" :class="{ active: mode === 'season' }" @click="switchMode('season')">分季评分</button>
      </div>

      <div v-if="errorMessage" class="auth-error">{{ errorMessage }}</div>

      <div v-if="showFallbackTotal">
        <RatingSliders v-model="ratings" prefix="vue-quick-rate" />
        <div class="form-group">
          <label>短评（可选）</label>
          <textarea v-model="comment" rows="2" placeholder="一句话记录感受..."></textarea>
        </div>
      </div>

      <div v-if="mode === 'season'" class="season-section">
        <div class="season-vue-toolbar">
          <span>分季评分</span>
          <button type="button" class="btn btn-sm btn-secondary" :disabled="!canAddSeason" @click="addSeason">{{ addSeasonLabel }}</button>
        </div>
        <div v-if="seasons.length" class="season-tabs">
          <button
            v-for="season in seasons"
            :key="`tab-${season.key}`"
            type="button"
            class="season-tab"
            :class="{ active: season.key === activeSeason?.key, unrated: !season.enabled }"
            @click="setActiveSeason(season.key)"
          >
            <span>S{{ season.season_number || '?' }}</span>
            <strong>{{ seasonTabScore(season) }}</strong>
          </button>
        </div>
        <div
          v-for="season in seasons"
          :key="season.key"
          class="season-card season-vue-card"
          :class="{ active: season.key === activeSeason?.key, 'season-unrated': !season.enabled }"
        >
          <div class="season-panel-head">
            <span class="season-title">
              第
              <input v-model.number="season.season_number" type="number" min="1" :max="seasonLimit || 50" :disabled="!season.enabled" aria-label="季号">
              季
              <template v-if="season.enabled"> · <input v-model="season.season_title" type="text" placeholder="季标题（可选）"></template>
              <template v-else-if="season.season_title"> · {{ season.season_title }}</template>
            </span>
            <div style="display:flex;align-items:center;gap:8px">
              <span class="season-score" :class="{ 'season-unrated-label': !season.enabled }">{{ seasonTabScore(season) }}</span>
              <button v-if="season.enabled" type="button" class="btn btn-xs btn-danger" title="删除此季" @click="removeSeason(season.key)">✕</button>
            </div>
          </div>
          <div v-if="season.enabled" class="season-body open">
            <RatingSliders v-model="season.ratings" :prefix="`vue-season-${season.key}`" :show-total="false" />
            <div class="form-group">
              <label>短评（可选）</label>
              <textarea v-model="season.comment" rows="1" placeholder="对这季的评价..."></textarea>
            </div>
          </div>
          <div v-else class="season-body open">
            <div class="season-empty">
              <p>S{{ season.season_number }} 未评价</p>
              <div v-if="seasonMeta(season).length" class="detail-season-meta">
                <span v-for="item in seasonMeta(season)" :key="item">{{ item }}</span>
              </div>
              <p v-if="season.overview" class="detail-season-overview">{{ season.overview }}</p>
              <button type="button" class="btn btn-sm btn-secondary" @click="enableSeason(season)">评价本季</button>
            </div>
          </div>
        </div>

        <div v-if="editableSeasons.length" class="dim-readonly">
          <div v-for="dim in dims" :key="dim" class="dim-readonly-item">
            <span>{{ DIM_LABELS[dim] }}</span>
            <strong style="color:var(--gold)">{{ Number(averagedSeasonDims[dim] || 5).toFixed(1) }}</strong>
          </div>
        </div>
        <div v-if="editableSeasons.length" class="total-preview">
          <span class="total-label">分季平均</span>
          <span class="total-value">{{ activeTotal.toFixed(1) }}</span>
        </div>
        <div v-if="isEdit && editableSeasons.length" class="form-group">
          <label>短评（可选）</label>
          <textarea v-model="comment" rows="2" placeholder="一句话记录感受..."></textarea>
        </div>
      </div>

      <div class="btn-group modal-actions">
        <button type="button" class="btn btn-secondary btn-sm" @click="close">取消</button>
        <button type="button" class="btn btn-primary btn-sm" :disabled="busy" @click="submit">
          {{ busy ? '保存中...' : (isEdit ? '更新评价' : '保存评价') }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>
