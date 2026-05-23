<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import {
  createEntry,
  deleteSeasonRatings,
  saveSeasonRatings,
  updateEntry,
} from '../../api/entries-api.js';
import { getLegacyBridge, switchLegacyTab } from '../../app/legacy-bridge.js';
import { refreshVueData } from '../../app/data-sync.js';
import { BaseModal, RatingSliders } from '../../shared/components/index.js';
import { posterUrl } from '../../shared/tmdb.js';
import { calcTotal } from '../../shared/scoring.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useSessionStore } from '../../stores/session.js';
import { useUiStore } from '../../stores/ui.js';
import type { Entry, MediaType, RatingDims, SeasonRating } from '../../types/domain.js';

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
  ratingMode?: 'total' | 'season';
  fillSeasonPlaceholders?: boolean;
};

type SeasonDraft = {
  key: number;
  season_number: number;
  season_title: string;
  ratings: RatingDims;
  comment: string;
};

type Mode = 'total' | 'season';

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

const open = ref(false);
const busy = ref(false);
const errorMessage = ref('');
const editEntryId = ref<Entry['id'] | null>(null);
const mode = ref<Mode>('total');
const media = ref<MediaLike | null>(null);
const ratings = ref<RatingDims>(defaultRatings());
const comment = ref('');
const seasons = ref<SeasonDraft[]>([]);
let seasonKey = 1;

const currentUser = computed(() => session.currentUser as UserLike | null);
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
const seasonAverage = computed(() => {
  if (!seasons.value.length) return 0;
  const total = seasons.value.reduce((sum, season) => sum + calcTotal(season.ratings), 0);
  return Math.round((total / seasons.value.length) * 10) / 10;
});
const activeTotal = computed(() => mode.value === 'season' && seasons.value.length ? seasonAverage.value : totalScore.value);
const modalTitle = computed(() => `${isEdit.value ? '编辑' : '评价'} ${title.value}`);

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

function findEntry(id: Entry['id']): Entry | null {
  return entries.entries.find(entry => String(entry.id) === String(id)) ?? null;
}

function setSeasonRows(rows: Array<Partial<SeasonRating>>): void {
  seasons.value = rows
    .filter(row => Number(row.season_number || 0) > 0)
    .map(row => ({
      key: seasonKey++,
      season_number: Number(row.season_number),
      season_title: row.season_title || '',
      ratings: { ...defaultRatings(), ...(row.ratings || {}) },
      comment: row.comment || '',
    }));
}

function addSeason(): void {
  const next = seasons.value.length
    ? Math.max(...seasons.value.map(row => row.season_number)) + 1
    : 1;
  seasons.value.push({
    key: seasonKey++,
    season_number: next,
    season_title: '',
    ratings: defaultRatings(),
    comment: '',
  });
}

function removeSeason(key: number): void {
  seasons.value = seasons.value.filter(row => row.key !== key);
}

function openQuickRate(input: unknown): boolean {
  const normalized = normalizeMedia(input);
  if (!normalized) return false;
  editEntryId.value = null;
  media.value = normalized;
  mode.value = normalized.media_type === 'series' && normalized.ratingMode === 'season' ? 'season' : 'total';
  ratings.value = defaultRatings();
  comment.value = '';
  errorMessage.value = '';
  busy.value = false;
  setSeasonRows([]);
  if (mode.value === 'season') addSeason();
  open.value = true;
  return true;
}

function openQuickEdit(id: Entry['id']): boolean {
  const entry = findEntry(id);
  if (!entry) return false;
  editEntryId.value = entry.id;
  media.value = {
    media_type: normalizeMediaType(entry.type || entry.media_type || 'movie'),
    tmdb_id: entry.tmdb_id || null,
    title: entry.title,
    year: entry.year || null,
    poster_path: entry.poster_path || '',
    director: entry.director || '',
  };
  ratings.value = { ...defaultRatings(), ...(entry.ratings || {}) };
  comment.value = entry.comment || '';
  errorMessage.value = '';
  busy.value = false;
  const entrySeasons = entries.seasonRatings.filter(row => String(row.entry_id) === String(entry.id));
  setSeasonRows(entrySeasons);
  mode.value = normalizeMediaType(entry.type || entry.media_type || 'movie') === 'series' && entrySeasons.length ? 'season' : 'total';
  open.value = true;
  return true;
}

function close(): void {
  open.value = false;
  busy.value = false;
  errorMessage.value = '';
}

function validateSeasons(): string {
  const numbers = seasons.value.map(row => Number(row.season_number || 0));
  if (numbers.some(number => number <= 0)) return '季号必须大于 0';
  const duplicate = numbers.find((number, index) => numbers.indexOf(number) !== index);
  if (duplicate) return `季号 S${duplicate} 重复，请修改后再保存`;
  return '';
}

function averageSeasonDims(): RatingDims {
  if (!seasons.value.length) return defaultRatings();
  const result = defaultRatings();
  for (const key of Object.keys(result) as Array<keyof RatingDims>) {
    const total = seasons.value.reduce((sum, season) => sum + Number(season.ratings[key] || 5), 0);
    result[key] = Math.round((total / seasons.value.length) * 10) / 10;
  }
  return result;
}

async function refreshLegacyAfterSave(entryId: Entry['id'] | null, wasNew: boolean): Promise<void> {
  const bridge = getLegacyBridge();
  await bridge?.shell?.loadAllData?.();
  bridge?.state?.sync?.('vue-rating-saved');
  await refreshVueData();
  const activeTab = bridge?.shell?.getActiveTab?.();
  if (wasNew && activeTab === 'rate' && entryId) {
    bridge?.list?.locateAndGoToList?.(entryId);
    switchLegacyTab('list');
    return;
  }
  bridge?.shell?.renderActiveTab?.();
}

async function submit(): Promise<void> {
  const userId = currentUser.value?.id;
  if (!userId || !media.value) {
    errorMessage.value = '请先登录';
    return;
  }
  const useSeasonMode = isSeries.value && mode.value === 'season';
  if (useSeasonMode && !seasons.value.length) {
    errorMessage.value = '请先添加至少一季评分';
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
  const finalRatings = useSeasonMode ? averageSeasonDims() : ratings.value;
  const finalTotal = useSeasonMode ? seasonAverage.value : totalScore.value;
  const finalComment = useSeasonMode && !isEdit.value ? '' : comment.value.trim();
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

    if (useSeasonMode && savedEntryId !== null) {
      const rows: SeasonRating[] = seasons.value.map(row => ({
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
    await refreshLegacyAfterSave(savedEntryId, !isEdit.value);
  } catch (error) {
    errorMessage.value = '保存失败: ' + (error instanceof Error ? error.message : String(error));
  } finally {
    busy.value = false;
  }
}

const api = reactive({
  openQuickRate,
  openQuickEdit,
});

onMounted(() => {
  window.FilmNoteVueRatings = api;
});

onBeforeUnmount(() => {
  if (window.FilmNoteVueRatings === api) delete window.FilmNoteVueRatings;
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

      <div v-if="isSeries" class="list-subtabs quick-rate-mode-tabs">
        <button type="button" :class="{ active: mode === 'total' }" @click="mode = 'total'">总评分</button>
        <button type="button" :class="{ active: mode === 'season' }" @click="mode = 'season'; if (!seasons.length) addSeason()">分季评分</button>
      </div>

      <div v-if="errorMessage" class="auth-error">{{ errorMessage }}</div>

      <div v-if="mode === 'total'">
        <RatingSliders v-model="ratings" prefix="vue-quick-rate" />
        <div class="form-group">
          <label>短评（可选）</label>
          <textarea v-model="comment" rows="2" placeholder="一句话记录感受..."></textarea>
        </div>
      </div>

      <div v-else class="season-section">
        <div class="season-vue-toolbar">
          <span>分季评分</span>
          <button type="button" class="btn btn-sm btn-secondary" @click="addSeason">+ 添加新季</button>
        </div>
        <div v-for="season in seasons" :key="season.key" class="season-card season-vue-card">
          <div class="season-panel-head">
            <strong>S</strong>
            <input v-model.number="season.season_number" type="number" min="1" aria-label="季号">
            <input v-model="season.season_title" type="text" placeholder="本季标题（可选）">
            <span class="season-score">{{ calcTotal(season.ratings).toFixed(1) }}</span>
            <button type="button" class="btn btn-xs btn-secondary" @click="removeSeason(season.key)">移除</button>
          </div>
          <RatingSliders v-model="season.ratings" :prefix="`vue-season-${season.key}`" />
          <textarea v-model="season.comment" rows="2" placeholder="本季短评（可选）"></textarea>
        </div>
        <div class="total-preview">
          <span class="total-label">分季平均</span>
          <span class="total-value">{{ activeTotal.toFixed(1) }}</span>
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
