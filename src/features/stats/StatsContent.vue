<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getLegacyBridge, onLegacyReady } from '../../app/legacy-bridge.js';
import { getCurrentUserId } from '../../app/user-context.js';
import { DIM_LABELS, WEIGHTS, type RatingDim } from '../../config/constants.js';
import EmptyState from '../../shared/components/EmptyState.vue';
import { getEntryScore } from '../../shared/scoring.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useSessionStore } from '../../stores/session.js';
import type { Entry, MediaType, SeasonRating } from '../../types/domain.js';
import { asStatsControlState, type StatsControlState, type StatsFilter, type UserColor } from './state.js';

defineOptions({ name: 'StatsContent' });

type CachedSeasonDetail = {
  season_number?: number;
  episode_count?: number;
  episode_runtime_total?: number;
};

type CachedMediaDetail = {
  runtime?: number;
  seasons?: CachedSeasonDetail[];
};

type RuntimeEntry = Entry & {
  runtime?: number;
};

type StatsResult = {
  avgTotal: number;
  best: Entry;
  worst: Entry;
  dimAvgs: Record<RatingDim, number>;
  dist: number[];
  count: number;
  type: MediaType;
  movies?: number;
  series?: number;
  ratedSeasonCount?: number;
  episodeCount?: number;
  totalMinutes: number;
};

type StatCard = {
  value: string;
  label: string;
  color?: string;
};

type RadarSeries = {
  label: string;
  shortLabel: string;
  dimAvgs: Partial<Record<RatingDim, number>>;
  color: string;
};

const entries = useEntriesStore();
const session = useSessionStore();
const filter = ref<StatsFilter>('me');
const type = ref<MediaType>('movie');
const otherUser = ref<string | null>(null);
const detailCache = ref<Record<string, CachedMediaDetail>>({});
let stopLegacyReady: (() => void) | null = null;

const axes = Object.keys(WEIGHTS) as RatingDim[];
const radarLevels = [0.2, 0.4, 0.6, 0.8, 1];
const radarCx = 210;
const radarCy = 210;
const radarRadius = 136;
const currentUserId = computed(() => getCurrentUserId(session.currentUser));
const typeLabel = computed(() => (type.value === 'series' ? '剧集' : '电影'));
const typeSuffix = computed(() => ` · ${typeLabel.value}`);

function loadDetailCache(): void {
  try {
    detailCache.value = JSON.parse(localStorage.getItem('filmnote_movie_cache') || '{}') || {};
  } catch {
    detailCache.value = {};
  }
}

function mediaType(entry: Entry): MediaType {
  return (entry.type || entry.media_type) === 'series' ? 'series' : 'movie';
}

function detailForEntry(entry: Entry): CachedMediaDetail | null {
  const tmdbId = Number(entry.tmdb_id || 0);
  if (!tmdbId) return null;
  const key = `${mediaType(entry)}:${tmdbId}`;
  return detailCache.value[key] || detailCache.value[String(tmdbId)] || null;
}

function displayName(userId: string, fallback = '未知'): string {
  return entries.profiles[userId]?.display_name || fallback;
}

function userColor(userId: string): UserColor {
  const name = displayName(userId, '').toLowerCase();
  if (name === 'fank1ng') return { key: 'mine', main: '#d4a853', dim: '#3a3020' };
  if (name === 'ceci') return { key: 'ceci', main: '#FF69B4', dim: '#2a1525' };
  return { key: 'friend', main: '#5b9db0', dim: '#1a2a30' };
}

function formatStatNumber(value: unknown): string {
  return Math.round(Number(value || 0)).toLocaleString('zh-CN');
}

function getEntryRuntimeMinutes(entry: Entry): number {
  const detail = detailForEntry(entry);
  return Math.max(0, Number(detail?.runtime || (entry as RuntimeEntry).runtime || 0));
}

function getEntryRatedSeasons(entry: Entry): SeasonRating[] {
  if (!entry.id) return [];
  return entries.seasonRatings.filter(season =>
    season.entry_id === entry.id &&
    season.user_id === entry.user_id &&
    Number(season.season_number) > 0
  );
}

function getSeriesRuntimeStats(entry: Entry, ratedSeasons: SeasonRating[]): { episodeCount: number; totalMinutes: number } {
  const seasonDetails = detailForEntry(entry)?.seasons || [];
  const fallbackRuntime = getEntryRuntimeMinutes(entry);
  return ratedSeasons.reduce((sum, season) => {
    const seasonNumber = Number(season.season_number || 0);
    const seasonDetail = seasonDetails.find(item => Number(item.season_number) === seasonNumber);
    const episodeCount = Math.max(0, Number(seasonDetail?.episode_count || 0));
    const realRuntimeTotal = Math.max(0, Number(seasonDetail?.episode_runtime_total || 0));
    return {
      episodeCount: sum.episodeCount + episodeCount,
      totalMinutes: sum.totalMinutes + (realRuntimeTotal || episodeCount * fallbackRuntime),
    };
  }, { episodeCount: 0, totalMinutes: 0 });
}

function calcStats(sourceEntries: Entry[], media: MediaType): StatsResult | null {
  if (!sourceEntries.length) return null;
  const avgTotal = sourceEntries.reduce((sum, entry) => sum + getEntryScore(entry), 0) / sourceEntries.length;
  const best = sourceEntries.reduce((current, entry) => (getEntryScore(current) > getEntryScore(entry) ? current : entry));
  const worst = sourceEntries.reduce((current, entry) => (getEntryScore(current) < getEntryScore(entry) ? current : entry));
  const dimAvgs = {} as Record<RatingDim, number>;
  for (const dim of axes) {
    dimAvgs[dim] = sourceEntries.reduce((sum, entry) => sum + Number(entry.ratings?.[dim] || 5), 0) / sourceEntries.length;
  }
  const dist = new Array(10).fill(0);
  sourceEntries.forEach(entry => {
    const bucket = Math.min(Math.floor(getEntryScore(entry)) - 1, 9);
    if (bucket >= 0) dist[bucket]++;
  });

  if (media === 'series') {
    let ratedSeasonCount = 0;
    let episodeCount = 0;
    let totalMinutes = 0;
    sourceEntries.forEach(entry => {
      const ratedSeasons = getEntryRatedSeasons(entry);
      const runtimeStats = getSeriesRuntimeStats(entry, ratedSeasons);
      ratedSeasonCount += ratedSeasons.length;
      episodeCount += runtimeStats.episodeCount;
      totalMinutes += runtimeStats.totalMinutes;
    });
    return { avgTotal, best, worst, dimAvgs, dist, count: sourceEntries.length, type: media, series: sourceEntries.length, ratedSeasonCount, episodeCount, totalMinutes };
  }

  return {
    avgTotal,
    best,
    worst,
    dimAvgs,
    dist,
    count: sourceEntries.length,
    type: media,
    movies: sourceEntries.length,
    totalMinutes: sourceEntries.reduce((sum, entry) => sum + getEntryRuntimeMinutes(entry), 0),
  };
}

function applyState(state: StatsControlState): void {
  if ('filter' in state) filter.value = state.filter === 'others' || state.filter === 'compare' ? state.filter : 'me';
  if ('type' in state) type.value = state.type === 'series' ? 'series' : 'movie';
  if ('otherUser' in state) otherUser.value = state.otherUser || null;
  loadDetailCache();
}

function onLegacyControls(event: Event): void {
  applyState(asStatsControlState((event as CustomEvent<StatsControlState>).detail));
}

const myEntries = computed(() => entries.entries.filter(entry => entry.user_id === currentUserId.value && mediaType(entry) === type.value));
const otherEntries = computed(() => {
  const selectedUser = otherUser.value;
  return entries.entries.filter(entry => {
    if (mediaType(entry) !== type.value) return false;
    if (selectedUser) return entry.user_id === selectedUser;
    return entry.user_id !== currentUserId.value;
  });
});
const myStats = computed(() => calcStats(myEntries.value, type.value));
const otherStats = computed(() => calcStats(otherEntries.value, type.value));
const myColor = computed(() => userColor(currentUserId.value));
const otherColor = computed<UserColor>(() => otherUser.value ? userColor(otherUser.value) : { key: 'friend', main: '#5b9db0', dim: '#1a2a30' });
const myName = computed(() => session.currentProfile?.display_name || '我');
const otherLabel = computed(() => otherUser.value ? displayName(otherUser.value, '对方') : '所有他人');
const visibleStats = computed(() => {
  if (filter.value === 'me') return myStats.value;
  if (filter.value === 'others') return otherStats.value;
  return myStats.value || otherStats.value;
});
const singleStats = computed(() => (filter.value === 'me' ? myStats.value : otherStats.value));
const singleColor = computed(() => (filter.value === 'me' ? myColor.value : otherColor.value));
const singleTitle = computed(() => (filter.value === 'others' ? `${otherLabel.value}${typeSuffix.value}` : ''));

const singleCards = computed<StatCard[]>(() => singleStats.value ? statCards(singleStats.value, singleColor.value) : []);
const compareCards = computed<StatCard[]>(() => buildCompareCards());
const radarSeries = computed<RadarSeries[]>(() => {
  if (filter.value === 'compare') {
    return [
      { label: myName.value, shortLabel: '我', dimAvgs: myStats.value?.dimAvgs || {}, color: myColor.value.main },
      { label: otherLabel.value, shortLabel: '他人', dimAvgs: otherStats.value?.dimAvgs || {}, color: otherColor.value.main },
    ];
  }
  const stats = singleStats.value;
  if (!stats) return [];
  return [{
    label: filter.value === 'others' ? otherLabel.value : myName.value,
    shortLabel: filter.value === 'others' ? '他人' : '我',
    dimAvgs: stats.dimAvgs,
    color: singleColor.value.main,
  }];
});
const maxDist = computed(() => Math.max(...(singleStats.value?.dist || []), 1));
const maxCompareDist = computed(() => Math.max(...(myStats.value?.dist || []), ...(otherStats.value?.dist || []), 1));

function statCards(stats: StatsResult, color: UserColor): StatCard[] {
  const cards: StatCard[] = [{ value: stats.avgTotal.toFixed(1), label: '平均分', color: color.main }];
  if (stats.type === 'series') {
    cards.push(
      { value: formatStatNumber(stats.series), label: '剧集数', color: color.main },
      { value: formatStatNumber(stats.ratedSeasonCount), label: '已评价季数', color: color.main },
      { value: formatStatNumber(stats.episodeCount), label: '已评价集数', color: color.main },
      { value: formatStatNumber(stats.totalMinutes), label: '总分钟数', color: color.main },
    );
  } else {
    cards.push(
      { value: formatStatNumber(stats.movies), label: '电影部数', color: color.main },
      { value: formatStatNumber(stats.totalMinutes), label: '总分钟数', color: color.main },
    );
  }
  cards.push(
    { value: getEntryScore(stats.best).toFixed(1), label: `最高分 · ${stats.best.title.slice(0, 8)}`, color: color.main },
    { value: getEntryScore(stats.worst).toFixed(1), label: `最低分 · ${stats.worst.title.slice(0, 8)}`, color: color.main },
  );
  return cards;
}

function buildCompareCards(): StatCard[] {
  const cards: StatCard[] = [
    { value: myStats.value ? myStats.value.avgTotal.toFixed(1) : '-', label: `${myName.value}均分${typeSuffix.value}`, color: myColor.value.main },
    { value: otherStats.value ? otherStats.value.avgTotal.toFixed(1) : '-', label: `${otherLabel.value}均分${typeSuffix.value}`, color: otherColor.value.main },
  ];
  if (type.value === 'series') {
    cards.push(
      { value: `${formatStatNumber(myStats.value?.series)}/${formatStatNumber(otherStats.value?.series)}`, label: `剧集数 (我/${otherLabel.value})` },
      { value: `${formatStatNumber(myStats.value?.ratedSeasonCount)}/${formatStatNumber(otherStats.value?.ratedSeasonCount)}`, label: `已评价季数 (我/${otherLabel.value})` },
      { value: `${formatStatNumber(myStats.value?.episodeCount)}/${formatStatNumber(otherStats.value?.episodeCount)}`, label: `已评价集数 (我/${otherLabel.value})` },
      { value: `${formatStatNumber(myStats.value?.totalMinutes)}/${formatStatNumber(otherStats.value?.totalMinutes)}`, label: `总分钟数 (我/${otherLabel.value})` },
    );
  } else {
    cards.push(
      { value: `${formatStatNumber(myStats.value?.movies)}/${formatStatNumber(otherStats.value?.movies)}`, label: `电影部数 (我/${otherLabel.value})` },
      { value: `${formatStatNumber(myStats.value?.totalMinutes)}/${formatStatNumber(otherStats.value?.totalMinutes)}`, label: `总分钟数 (我/${otherLabel.value})` },
    );
  }
  return cards;
}

function distHeight(count: number, max: number): string {
  return `${Math.max((count / max) * 100, 4)}%`;
}

function radarPoint(radius: number, index: number): [number, number] {
  const angle = (Math.PI * 2 * index / axes.length) - Math.PI / 2;
  return [radarCx + radius * Math.cos(angle), radarCy + radius * Math.sin(angle)];
}

function polygonPoints(level: number): string {
  return axes.map((_, index) => radarPoint(radarRadius * level, index).map(value => value.toFixed(1)).join(',')).join(' ');
}

function radarPolygon(dimAvgs: Partial<Record<RatingDim, number>>): string {
  return axes.map((axis, index) => {
    const radius = radarRadius * Math.max(0, Math.min(10, Number(dimAvgs[axis] || 0))) / 10;
    return radarPoint(radius, index).map(value => value.toFixed(1)).join(',');
  }).join(' ');
}

function axisPoint(index: number): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  const [x, y] = radarPoint(radarRadius + 44, index);
  return {
    x,
    y,
    anchor: x < radarCx - 16 ? 'end' : x > radarCx + 16 ? 'start' : 'middle',
  };
}

function axisValues(axis: RatingDim): string {
  return radarSeries.value
    .map(series => `${series.shortLabel} ${Number(series.dimAvgs[axis] || 0).toFixed(1)}`)
    .join(' / ');
}

onMounted(() => {
  loadDetailCache();
  stopLegacyReady = onLegacyReady(bridge => applyState(asStatsControlState(bridge.stats?.getControls?.())));
  window.addEventListener('filmnote:stats-controls', onLegacyControls);
});

onBeforeUnmount(() => {
  stopLegacyReady?.();
  window.removeEventListener('filmnote:stats-controls', onLegacyControls);
});
</script>

<template>
  <section class="vue-stats-content">
    <EmptyState v-if="!entries.entries.length || !visibleStats" title="暂无评价数据" />

    <template v-else-if="filter === 'compare'">
      <div class="stats-grid">
        <div v-for="card in compareCards" :key="card.label" class="stat-card">
          <div class="stat-value" :style="{ color: card.color || '' }">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </div>

      <h3 class="stats-section-title">六维图对比{{ typeSuffix }}</h3>
      <div class="stats-radar-wrap">
        <svg class="stats-radar" viewBox="0 0 420 420" role="img" :aria-label="`六维图对比${typeSuffix}`">
          <polygon v-for="level in radarLevels" :key="level" :points="polygonPoints(level)" fill="none" stroke="var(--border)" stroke-width="1" />
          <line
            v-for="(_, index) in axes"
            :key="`spoke-${index}`"
            :x1="radarCx"
            :y1="radarCy"
            :x2="radarPoint(radarRadius, index)[0].toFixed(1)"
            :y2="radarPoint(radarRadius, index)[1].toFixed(1)"
            stroke="var(--border)"
            stroke-width="1"
          />
          <polygon
            v-for="series in radarSeries"
            :key="series.label"
            :points="radarPolygon(series.dimAvgs)"
            :fill="series.color"
            fill-opacity="0.2"
            :stroke="series.color"
            stroke-width="3"
            stroke-linejoin="round"
          />
          <circle :cx="radarCx" :cy="radarCy" r="3" fill="var(--text2)" />
          <template v-for="(axis, index) in axes" :key="axis">
            <text :x="axisPoint(index).x.toFixed(1)" :y="(axisPoint(index).y - 4).toFixed(1)" :text-anchor="axisPoint(index).anchor" class="stats-radar-label">{{ DIM_LABELS[axis] }}</text>
            <text :x="axisPoint(index).x.toFixed(1)" :y="(axisPoint(index).y + 13).toFixed(1)" :text-anchor="axisPoint(index).anchor" class="stats-radar-score">{{ axisValues(axis) }}</text>
          </template>
        </svg>
        <div class="stats-radar-legend">
          <span v-for="series in radarSeries" :key="series.label"><i :style="{ background: series.color }"></i>{{ series.label }}</span>
        </div>
      </div>

      <h3 class="stats-section-title stats-section-title-spaced">评分分布对比</h3>
      <div class="stats-dist-legend">
        <span><i :style="{ background: myColor.main }"></i>{{ myName }}</span>
        <span><i :style="{ background: otherColor.main }"></i>{{ otherLabel }}</span>
      </div>
      <div class="compare-dist">
        <div v-for="(_, index) in 10" :key="index" class="cd-bar-group">
          <div class="cd-bars">
            <div
              v-if="myStats?.dist[index]"
              class="cd-bar"
              :style="{ height: distHeight(myStats.dist[index], maxCompareDist), background: myColor.main }"
            >
              <span class="cd-count">{{ myStats.dist[index] }}</span>
            </div>
            <div
              v-if="otherStats?.dist[index]"
              class="cd-bar"
              :style="{ height: distHeight(otherStats.dist[index], maxCompareDist), background: otherColor.main }"
            >
              <span class="cd-count">{{ otherStats.dist[index] }}</span>
            </div>
          </div>
          <span class="cd-label">{{ index + 1 }}分</span>
        </div>
      </div>
    </template>

    <template v-else-if="singleStats">
      <h3 v-if="singleTitle" class="stats-section-title" :style="{ color: singleColor.main }">{{ singleTitle }}</h3>
      <div class="stats-grid">
        <div v-for="card in singleCards" :key="card.label" class="stat-card">
          <div class="stat-value" :style="{ color: card.color || singleColor.main }">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </div>

      <h3 class="stats-section-title">六维图{{ typeSuffix }}</h3>
      <div class="stats-radar-wrap">
        <svg class="stats-radar" viewBox="0 0 420 420" role="img" :aria-label="`六维图${typeSuffix}`">
          <polygon v-for="level in radarLevels" :key="level" :points="polygonPoints(level)" fill="none" stroke="var(--border)" stroke-width="1" />
          <line
            v-for="(_, index) in axes"
            :key="`spoke-${index}`"
            :x1="radarCx"
            :y1="radarCy"
            :x2="radarPoint(radarRadius, index)[0].toFixed(1)"
            :y2="radarPoint(radarRadius, index)[1].toFixed(1)"
            stroke="var(--border)"
            stroke-width="1"
          />
          <polygon
            v-for="series in radarSeries"
            :key="series.label"
            :points="radarPolygon(series.dimAvgs)"
            :fill="series.color"
            fill-opacity="0.2"
            :stroke="series.color"
            stroke-width="3"
            stroke-linejoin="round"
          />
          <circle :cx="radarCx" :cy="radarCy" r="3" fill="var(--text2)" />
          <template v-for="(axis, index) in axes" :key="axis">
            <text :x="axisPoint(index).x.toFixed(1)" :y="(axisPoint(index).y - 4).toFixed(1)" :text-anchor="axisPoint(index).anchor" class="stats-radar-label">{{ DIM_LABELS[axis] }}</text>
            <text :x="axisPoint(index).x.toFixed(1)" :y="(axisPoint(index).y + 13).toFixed(1)" :text-anchor="axisPoint(index).anchor" class="stats-radar-score">{{ axisValues(axis) }}</text>
          </template>
        </svg>
      </div>

      <h3 class="stats-section-title stats-section-title-spaced">评分分布{{ typeSuffix }}</h3>
      <div class="score-dist">
        <div v-for="(count, index) in singleStats.dist" :key="index" class="score-dist-bar">
          <span class="score-dist-count" :style="{ color: singleColor.main }">{{ count || '' }}</span>
          <div
            v-if="count"
            class="score-dist-fill"
            :style="{ height: distHeight(count, maxDist), background: singleColor.main }"
          ></div>
          <span class="score-dist-label">{{ index + 1 }}分</span>
        </div>
      </div>
    </template>
  </section>
</template>
