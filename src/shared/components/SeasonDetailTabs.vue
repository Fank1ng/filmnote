<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { DIM_LABELS, WEIGHTS, type RatingDim } from '../../config/constants.js';
import type { RatingDims, SeasonRating } from '../../types/domain.js';
import { getEntryScore } from '../scoring.js';

defineOptions({ name: 'SeasonDetailTabs' });

type SeasonRecord = {
  number: number;
  title?: string;
  local?: SeasonRating | null;
  tmdb?: Record<string, unknown> | null;
};

const props = withDefaults(defineProps<{
  records: SeasonRecord[];
  canEdit?: boolean;
  heading?: string;
}>(), {
  canEdit: false,
  heading: '每季详情',
});

const emit = defineEmits<{
  seasonAction: [seasonNumber: number];
}>();

const dims = Object.keys(WEIGHTS) as RatingDim[];
const activeSeasonNumber = ref<number | null>(null);

const sortedRecords = computed(() => [...props.records].sort((a, b) => a.number - b.number));
const activeRecord = computed(() => {
  if (!sortedRecords.value.length) return null;
  return sortedRecords.value.find(record => record.number === activeSeasonNumber.value) || sortedRecords.value[0];
});

watch(sortedRecords, records => {
  if (!records.length) {
    activeSeasonNumber.value = null;
    return;
  }
  if (!records.some(record => record.number === activeSeasonNumber.value)) {
    activeSeasonNumber.value = records[0].number;
  }
}, { immediate: true });

function setActiveSeason(number: number): void {
  activeSeasonNumber.value = number;
}

function seasonTitle(record: SeasonRecord): string {
  return record.title || String(record.local?.season_title || record.tmdb?.season_title || record.tmdb?.name || '');
}

function localScore(record: SeasonRecord): string {
  return record.local ? getEntryScore(record.local).toFixed(1) : '未评价';
}

function dimValue(ratings: RatingDims | undefined, dim: RatingDim): number {
  return Number(ratings?.[dim] || 5);
}

function text(value: unknown): string {
  return String(value || '').trim();
}

function castNames(value: unknown): string {
  if (!Array.isArray(value)) return '';
  return value
    .map(item => typeof item === 'string' ? item : text((item as Record<string, unknown>)?.name))
    .filter(Boolean)
    .slice(0, 8)
    .join(' / ');
}

function formatMinutes(value: unknown): string {
  const minutes = Number(value || 0);
  if (!minutes) return '';
  return `${Math.round(minutes).toLocaleString('zh-CN')} 分钟`;
}

function seasonMeta(record: SeasonRecord): string[] {
  const tmdb = record.tmdb || {};
  return [
    tmdb.air_date ? `首播 ${text(tmdb.air_date).slice(0, 10)}` : '',
    tmdb.episode_count ? `${Number(tmdb.episode_count)} 集` : '',
    tmdb.episode_runtime_total ? `本季 ${formatMinutes(tmdb.episode_runtime_total)}` : '',
    tmdb.average_episode_runtime ? `平均 ${Number(tmdb.average_episode_runtime).toFixed(1)} 分钟/集` : '',
    tmdb.director ? `导演/主创 ${text(tmdb.director)}` : '',
    castNames(tmdb.cast) ? `演员 ${castNames(tmdb.cast)}` : '',
  ].filter(Boolean);
}
</script>

<template>
  <div v-if="sortedRecords.length" class="detail-season-section">
    <h4 style="font-size:0.85rem;color:var(--text2);margin-bottom:8px">{{ heading }}</h4>
    <div class="season-tabs detail-season-tabs">
      <button
        v-for="record in sortedRecords"
        :key="record.number"
        type="button"
        class="season-tab"
        :class="{ active: record.number === activeRecord?.number, unrated: !record.local }"
        @click="setActiveSeason(record.number)"
      >
        <span>S{{ record.number }}</span>
        <strong>{{ localScore(record) }}</strong>
      </button>
    </div>

    <div v-if="activeRecord" class="detail-season-panel active">
      <div class="detail-season-head">
        <strong>S{{ activeRecord.number }}<template v-if="seasonTitle(activeRecord)"> · {{ seasonTitle(activeRecord) }}</template></strong>
        <span>
          {{ localScore(activeRecord) }}<template v-if="activeRecord.local"> / 10</template>
          <button
            v-if="canEdit"
            type="button"
            class="btn btn-xs btn-secondary"
            style="margin-left:8px"
            @click="emit('seasonAction', activeRecord.number)"
          >
            {{ activeRecord.local ? '编辑' : '评价' }}
          </button>
        </span>
      </div>

      <div v-if="activeRecord.local?.ratings" class="mc-dim-dots" style="margin:8px 0">
        <span
          v-for="dim in dims"
          :key="dim"
          class="mc-dim-item"
          style="border-color:var(--gold)"
        >
          <span class="dim-lab">{{ DIM_LABELS[dim].slice(0, 2) }}</span>
          <span class="dim-val" style="color:var(--gold)">{{ dimValue(activeRecord.local.ratings, dim) }}</span>
        </span>
      </div>
      <p v-if="activeRecord.local?.comment" class="detail-season-comment">"{{ activeRecord.local.comment }}"</p>
      <p v-if="activeRecord.tmdb?.overview" class="detail-season-overview">{{ activeRecord.tmdb.overview }}</p>
      <div v-if="seasonMeta(activeRecord).length" class="detail-season-meta">
        <span v-for="item in seasonMeta(activeRecord)" :key="item">{{ item }}</span>
      </div>
    </div>
  </div>
</template>
