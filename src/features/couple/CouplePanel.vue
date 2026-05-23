<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getLegacyBridge, onLegacyReady } from '../../app/legacy-bridge.js';
import { TMDB_IMG } from '../../config/constants.js';
import EmptyState from '../../shared/components/EmptyState.vue';
import { getEntryScore } from '../../shared/scoring.js';
import { useCoupleStore } from '../../stores/couple.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useListsStore } from '../../stores/lists.js';
import { useSessionStore } from '../../stores/session.js';
import type { Couple, CoupleQueueItem, MediaType, Profile, TmdbMedia } from '../../types/domain.js';

defineOptions({ name: 'CouplePanel' });

type CoupleTab = 'archive' | 'recommend' | 'queue';
type UserLike = { id?: string };
type CoupleControls = {
  tab?: CoupleTab;
  queueAvailable?: boolean;
  couplesAvailable?: boolean;
};
type UserColor = {
  main: string;
  dim: string;
};

const couple = useCoupleStore();
const entries = useEntriesStore();
const lists = useListsStore();
const session = useSessionStore();

const tab = ref<CoupleTab>('archive');
const search = ref('');
const queueAvailable = ref(true);
const couplesAvailable = ref(true);
let stopLegacyReady: (() => void) | null = null;

const currentUserId = computed(() => (session.currentUser as UserLike | null)?.id || '');
const activeCouple = computed(() => couple.activeCouple as Couple | null);
const currentProfile = computed(() => session.currentProfile);
const partnerId = computed(() => {
  const active = activeCouple.value;
  if (!active || !currentUserId.value) return '';
  return active.user_a === currentUserId.value ? active.user_b || '' : active.user_a || '';
});
const partnerProfile = computed<Profile | null>(() => partnerId.value ? entries.profiles[partnerId.value] || null : null);
const partnerName = computed(() => partnerProfile.value?.display_name || '对方');
const myColor = computed(() => userColor(currentUserId.value));
const partnerColor = computed(() => userColor(partnerId.value));
const watchlistIds = computed(() => lists.watchlistIds);
const queueIds = computed(() => new Set(couple.queue.map(item => `${mediaType(item.media_type)}:${item.tmdb_id}`)));
const pendingReceived = computed(() => couple.pendingCouples.filter(item => item.requested_by !== currentUserId.value));
const pendingSent = computed(() => couple.pendingCouples.filter(item => item.requested_by === currentUserId.value));
const unavailableUserIds = computed(() => {
  const ids = new Set<string>([currentUserId.value, partnerId.value].filter(Boolean));
  couple.pendingCouples.forEach(item => {
    if (item.user_a) ids.add(item.user_a);
    if (item.user_b) ids.add(item.user_b);
  });
  return ids;
});
const bindableUsers = computed(() => {
  const query = search.value.trim().toLowerCase();
  return Object.values(entries.profiles)
    .filter(profile => profile.user_id && !unavailableUserIds.value.has(profile.user_id))
    .filter(profile => !query || (profile.display_name || '').toLowerCase().includes(query))
    .slice(0, 8);
});
const commonPairs = computed(() => {
  if (!currentUserId.value || !partnerId.value) return [];
  const mine = new Map<number, typeof entries.entries[number]>();
  const theirs = new Map<number, typeof entries.entries[number]>();
  entries.entries.filter(entry => mediaType(entry.type || entry.media_type) === 'movie' && entry.tmdb_id).forEach(entry => {
    const tmdbId = Number(entry.tmdb_id);
    if (entry.user_id === currentUserId.value && !mine.has(tmdbId)) mine.set(tmdbId, entry);
    if (entry.user_id === partnerId.value && !theirs.has(tmdbId)) theirs.set(tmdbId, entry);
  });
  return [...mine.keys()]
    .filter(tmdbId => theirs.has(tmdbId))
    .map(tmdbId => ({ tmdbId, mine: mine.get(tmdbId)!, partner: theirs.get(tmdbId)! }));
});
const compatibility = computed(() => {
  const pairs = commonPairs.value;
  if (!pairs.length) return { sample: 0, avgDiff: 0, overall: 0, harmonyTitle: '暂无共同电影', splitTitle: '暂无共同电影' };
  let harmony = pairs[0];
  let split = pairs[0];
  const diffs = pairs.map(pair => {
    const diff = Math.abs(getEntryScore(pair.mine) - getEntryScore(pair.partner));
    if (diff < Math.abs(getEntryScore(harmony.mine) - getEntryScore(harmony.partner))) harmony = pair;
    if (diff > Math.abs(getEntryScore(split.mine) - getEntryScore(split.partner))) split = pair;
    return diff;
  });
  const avgDiff = diffs.reduce((sum, diff) => sum + diff, 0) / diffs.length;
  return {
    sample: pairs.length,
    avgDiff,
    overall: Math.max(0, Math.round(100 - avgDiff * 10)),
    harmonyTitle: harmony.mine.title,
    splitTitle: split.mine.title,
  };
});
const disconnectRequester = computed(() => String(activeCouple.value?.disconnect_requested_by || ''));
const disconnectByMe = computed(() => !!disconnectRequester.value && disconnectRequester.value === currentUserId.value);
const disconnectByPartner = computed(() => !!disconnectRequester.value && !disconnectByMe.value);
const disconnectText = computed(() => disconnectByMe.value ? '撤销解除申请' : (disconnectByPartner.value ? '同意解除 Couple' : '申请解除 Couple'));
const disconnectClass = computed(() => disconnectByPartner.value ? 'btn-primary' : (disconnectByMe.value ? 'btn-secondary' : 'btn-danger'));
const recommendationLoading = computed(() => couple.loading || couple.recommendationState === 'loading');

function asControls(input: unknown): CoupleControls {
  return (input || {}) as CoupleControls;
}

function applyControls(controls: CoupleControls): void {
  if (controls.tab === 'archive' || controls.tab === 'recommend' || controls.tab === 'queue') tab.value = controls.tab;
  if ('queueAvailable' in controls) queueAvailable.value = !!controls.queueAvailable;
  if ('couplesAvailable' in controls) couplesAvailable.value = !!controls.couplesAvailable;
}

function onControls(event: Event): void {
  applyControls(asControls((event as CustomEvent<CoupleControls>).detail));
}

function mediaType(value: unknown): MediaType {
  return value === 'series' || value === 'tv' ? 'series' : 'movie';
}

function mediaTypeLabel(value: unknown): string {
  return mediaType(value) === 'series' ? '剧集' : '电影';
}

function tmdbId(movie: Partial<TmdbMedia>): number {
  return Number(movie.id || movie.tmdb_id || 0);
}

function movieTitle(movie: TmdbMedia): string {
  return movie.title || movie.name || `TMDB #${tmdbId(movie)}`;
}

function movieYear(movie: TmdbMedia): string {
  return String(movie.year || movie.release_date || movie.first_air_date || '').slice(0, 4) || '未知';
}

function posterUrl(path: string | null | undefined): string {
  return path ? TMDB_IMG + path : '';
}

function displayName(userId: string | undefined, fallback = '未知'): string {
  return userId ? entries.profiles[userId]?.display_name || fallback : fallback;
}

function userColor(userId: string): UserColor {
  const name = displayName(userId, '').toLowerCase();
  if (name === 'fank1ng') return { main: '#d4a853', dim: '#3a3020' };
  if (name === 'ceci') return { main: '#FF69B4', dim: '#2a1525' };
  return { main: '#5b9db0', dim: '#1a2a30' };
}

function otherUserId(item: Couple): string {
  return item.user_a === currentUserId.value ? item.user_b || '' : item.user_a || '';
}

function setTab(nextTab: CoupleTab): void {
  tab.value = nextTab;
  getLegacyBridge()?.couple?.updateControls?.({ tab: nextTab });
  if (nextTab === 'recommend' && couple.recommendationState === 'idle') void loadRecommendations(false);
}

async function loadRecommendations(force = false): Promise<void> {
  await getLegacyBridge()?.couple?.loadCoupleRecommendations?.(force);
}

async function bindUser(userId: string): Promise<void> {
  await getLegacyBridge()?.couple?.bindCoupleWith?.(userId);
  search.value = '';
}

async function confirm(coupleId: string | number): Promise<void> {
  await getLegacyBridge()?.couple?.confirmCouple?.(coupleId);
}

async function disconnect(coupleId: string | number): Promise<void> {
  await getLegacyBridge()?.couple?.disconnectCouple?.(coupleId);
}

async function moveQueue(item: CoupleQueueItem, direction: number): Promise<void> {
  await getLegacyBridge()?.couple?.moveQueueItem?.(item.id, direction);
}

async function removeQueue(item: CoupleQueueItem): Promise<void> {
  await getLegacyBridge()?.couple?.removeQueueItem?.(item.id);
}

function rateQueue(item: CoupleQueueItem): void {
  getLegacyBridge()?.couple?.rateQueueItem?.(item.id);
}

async function openQueue(item: CoupleQueueItem): Promise<void> {
  await getLegacyBridge()?.couple?.showQueueItemDetail?.(item.id);
}

function listKey(movie: TmdbMedia): string {
  return `${mediaType(movie.media_type || movie.type)}:${tmdbId(movie)}`;
}

function isRated(movie: TmdbMedia): boolean {
  const id = tmdbId(movie);
  return entries.entries.some(entry => entry.user_id === currentUserId.value && Number(entry.tmdb_id) === id && mediaType(entry.type || entry.media_type) === mediaType(movie.media_type || movie.type));
}

function rateMovie(movie: TmdbMedia): void {
  getLegacyBridge()?.ratings?.openQuickRate?.({ ...movie, id: tmdbId(movie), tmdb_id: tmdbId(movie), media_type: mediaType(movie.media_type || movie.type) });
}

async function toggleWatch(movie: TmdbMedia): Promise<void> {
  await getLegacyBridge()?.list?.toggleWatchlist?.(tmdbId(movie), { ...movie, id: tmdbId(movie), tmdb_id: tmdbId(movie), media_type: mediaType(movie.media_type || movie.type) });
}

async function addNext(movie: TmdbMedia): Promise<void> {
  await getLegacyBridge()?.couple?.addToCoupleQueue?.({ ...movie, id: tmdbId(movie), tmdb_id: tmdbId(movie), media_type: mediaType(movie.media_type || movie.type) });
}

async function openRecommendation(movie: TmdbMedia): Promise<void> {
  await getLegacyBridge()?.discover?.showMovieDetail?.(tmdbId(movie));
}

function ratingState(item: CoupleQueueItem): string {
  const mine = entries.entries.find(entry => entry.user_id === currentUserId.value && mediaType(entry.type || entry.media_type) === mediaType(item.media_type) && Number(entry.tmdb_id) === Number(item.tmdb_id));
  const partner = entries.entries.find(entry => entry.user_id === partnerId.value && mediaType(entry.type || entry.media_type) === mediaType(item.media_type) && Number(entry.tmdb_id) === Number(item.tmdb_id));
  if (mine && partner) return '双方已评分';
  if (mine) return '已评分 · 待对方评分';
  if (partner) return '对方已评分 · 等你评分';
  return '';
}

onMounted(() => {
  stopLegacyReady = onLegacyReady(bridge => applyControls(asControls(bridge.couple?.getControls?.())));
  window.addEventListener('filmnote:couple-controls', onControls);
});

onBeforeUnmount(() => {
  stopLegacyReady?.();
  window.removeEventListener('filmnote:couple-controls', onControls);
});
</script>

<template>
  <section class="vue-couple-panel">
    <EmptyState v-if="!couplesAvailable" title="Couple 表尚未创建，请先执行升级 SQL" />

    <div v-else-if="!activeCouple" class="couple-empty">
      <h3>绑定 Couple 后启用双人观影功能</h3>
      <p>绑定后可查看评分默契度、偏好对比、双人推荐，并共同维护“下次看”队列。</p>

      <div v-if="pendingReceived.length || pendingSent.length" class="couple-pending">
        <div v-for="item in pendingReceived" :key="`received-${item.id}`" class="couple-pending-row">
          <span>{{ displayName(item.requested_by, '对方') }} 请求绑定 Couple</span>
          <button class="btn btn-sm btn-primary" type="button" @click="confirm(item.id)">确认绑定</button>
        </div>
        <div v-for="item in pendingSent" :key="`sent-${item.id}`" class="couple-pending-row">
          <span>已向 {{ displayName(otherUserId(item), '对方') }} 发送请求，等待确认</span>
          <button class="btn btn-sm btn-danger" type="button" @click="disconnect(item.id)">撤销</button>
        </div>
      </div>

      <div class="couple-bind-box">
        <input v-model="search" type="text" placeholder="搜索用户名绑定 Couple">
        <div class="couple-user-results">
          <button v-for="user in bindableUsers" :key="user.user_id" class="couple-user-result" type="button" @click="bindUser(user.user_id)">
            <span>{{ user.display_name || '未命名' }}</span>
            <em>发送绑定请求</em>
          </button>
          <div v-if="search && !bindableUsers.length" class="couple-muted">没有可绑定用户</div>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="couple-hero">
        <div>
          <p>已绑定</p>
          <h3>
            <span :style="{ color: myColor.main }">{{ currentProfile?.display_name || '我' }}</span>
            &
            <span :style="{ color: partnerColor.main }">{{ partnerName }}</span>
          </h3>
        </div>
        <button class="btn btn-xs" :class="disconnectClass" type="button" @click="disconnect(activeCouple.id)">{{ disconnectText }}</button>
      </div>

      <div v-if="disconnectRequester" class="couple-section couple-disconnect-notice">
        <p>{{ disconnectByMe ? '已发送解除申请，等待对方同意。' : `${partnerName} 请求解除 Couple，同意后共享下次看队列会一起删除。` }}</p>
      </div>

      <div class="discover-subtabs couple-subtabs">
        <button type="button" :class="{ active: tab === 'archive' }" @click="setTab('archive')">档案</button>
        <button type="button" :class="{ active: tab === 'recommend' }" @click="setTab('recommend')">双人推荐</button>
        <button type="button" :class="{ active: tab === 'queue' }" @click="setTab('queue')">下次看</button>
      </div>

      <div v-if="tab === 'archive'" class="couple-section">
        <div class="couple-section-title">关系仪表盘</div>
        <div class="couple-stat-grid">
          <div><strong>{{ compatibility.overall }}</strong><span>默契指数</span></div>
          <div><strong>{{ compatibility.sample }}</strong><span>共同电影</span></div>
          <div><strong>{{ couple.queue.length }}</strong><span>下次看</span></div>
        </div>
        <div class="couple-split-grid">
          <div>
            <span>最大共鸣</span>
            <strong>{{ compatibility.harmonyTitle }}</strong>
            <p>共同评分越多越准</p>
          </div>
          <div>
            <span>最大分歧</span>
            <strong>{{ compatibility.splitTitle }}</strong>
            <p>平均分差 {{ compatibility.avgDiff.toFixed(1) }}</p>
          </div>
        </div>
      </div>

      <div v-else-if="tab === 'recommend'" class="couple-section">
        <div class="couple-section-head">
          <div class="couple-section-title">双人推荐</div>
          <button class="btn btn-xs btn-secondary" type="button" :disabled="recommendationLoading" @click="loadRecommendations(true)">换一批</button>
        </div>
        <div v-if="recommendationLoading" class="discover-spinner"><div class="spinner"></div></div>
        <EmptyState v-else-if="couple.recommendationState === 'insufficient'" title="双方各评价 5 部、合计 25 部电影后生成双人推荐" />
        <EmptyState v-else-if="couple.recommendationState === 'error'" title="双人推荐加载失败" detail="稍后可再换一批。" />
        <div v-else-if="couple.recommendations.length" class="discover-grid">
          <article
            v-for="movie in couple.recommendations.slice(0, 8)"
            :key="tmdbId(movie)"
            class="discover-card"
            :data-tmdb-id="tmdbId(movie)"
            :data-media-type="mediaType(movie.media_type || movie.type)"
            @click="openRecommendation(movie)"
          >
            <div class="dc-poster-wrap">
              <img v-if="posterUrl(movie.poster_path)" :src="posterUrl(movie.poster_path)" :alt="movieTitle(movie)" loading="lazy">
              <div v-else class="dc-no-poster">🎬</div>
              <span v-if="movie.vote_average" class="dc-tmdb-score">⭐ {{ Number(movie.vote_average).toFixed(1) }}</span>
            </div>
            <div class="dc-info">
              <div class="dc-title">{{ movieTitle(movie) }}</div>
              <div class="dc-meta">{{ movieYear(movie) }}{{ movie.original_language ? ` · ${movie.original_language.toUpperCase()}` : '' }}</div>
              <div class="dc-action" @click.stop>
                <div v-if="isRated(movie)" class="dc-rated-badge">已评价 ✓</div>
                <div v-else class="dc-action-row">
                  <button class="btn btn-sm btn-secondary dc-rate-btn" type="button" @click="rateMovie(movie)">＋我的评分</button>
                  <button
                    class="btn btn-xs dc-watch-btn"
                    type="button"
                    :class="{ active: watchlistIds.has(listKey(movie)) }"
                    :title="watchlistIds.has(listKey(movie)) ? '移出想看' : '加入想看'"
                    @click="toggleWatch(movie)"
                  >
                    {{ watchlistIds.has(listKey(movie)) ? '★' : '☆' }}
                  </button>
                  <button
                    class="btn btn-xs dc-next-btn"
                    type="button"
                    :class="{ active: queueIds.has(listKey(movie)) }"
                    :title="queueIds.has(listKey(movie)) ? '已在下次看' : '加入下次看'"
                    @click="addNext(movie)"
                  >
                    ▶
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
        <EmptyState v-else title="暂时没有可用的双人推荐" />
      </div>

      <div v-else class="couple-section">
        <div class="couple-section-title">下次看</div>
        <EmptyState v-if="!queueAvailable" title="下次看表尚未创建，请先执行升级 SQL" />
        <div v-else-if="couple.queue.length" class="queue-list">
          <div
            v-for="(item, index) in couple.queue"
            :key="item.id"
            class="queue-row"
            :data-queue-id="item.id"
            :data-media-type="item.media_type"
            @click="openQueue(item)"
          >
            <div class="queue-rank">{{ index + 1 }}</div>
            <img v-if="posterUrl(item.poster_path)" :src="posterUrl(item.poster_path)" :alt="item.title || ''" loading="lazy">
            <div v-else class="queue-poster"></div>
            <div class="queue-info">
              <strong>{{ item.title || `TMDB #${item.tmdb_id}` }}</strong>
              <span>{{ item.year || '未知' }} · {{ mediaTypeLabel(item.media_type) }} · <em :style="{ color: userColor(item.added_by || '').main }">{{ displayName(item.added_by, '未知') }}</em> 加入</span>
            </div>
            <div class="queue-actions" @click.stop>
              <button class="btn btn-xs btn-secondary" type="button" :disabled="index === 0" @click="moveQueue(item, -1)">上移</button>
              <button class="btn btn-xs btn-secondary" type="button" :disabled="index === couple.queue.length - 1" @click="moveQueue(item, 1)">下移</button>
              <span v-if="ratingState(item) && ratingState(item) !== '对方已评分 · 等你评分'" class="queue-rating-state">{{ ratingState(item) }}</span>
              <button v-else class="btn btn-xs btn-secondary" type="button" @click="rateQueue(item)">评分</button>
              <button class="btn btn-xs btn-danger" type="button" @click="removeQueue(item)">移除</button>
            </div>
          </div>
        </div>
        <EmptyState v-else title="还没有下次看的电影/剧集" detail="可从发现页或搜索结果加入。" />
      </div>
    </template>
  </section>
</template>
