<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getLegacyBridge, onLegacyReady } from '../../app/legacy-bridge.js';
import { DIM_LABELS, TMDB_IMG, TMDB_PROXY, WEIGHTS, type RatingDim } from '../../config/constants.js';
import EmptyState from '../../shared/components/EmptyState.vue';
import { getEntryScore } from '../../shared/scoring.js';
import { useCoupleStore } from '../../stores/couple.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useListsStore } from '../../stores/lists.js';
import { useSessionStore } from '../../stores/session.js';
import type { Couple, CoupleQueueItem, Entry, MediaType, Profile, TmdbMedia } from '../../types/domain.js';

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
type ArchiveAxis = {
  key: string;
  label: string;
  mine: number;
  partner: number;
};
type CacheDetail = {
  genre_ids?: number[];
  genres?: Array<string | { name?: string }>;
  keyword_names?: string[];
  poster_path?: string;
};
type EntryWithMeta = Entry & {
  genre_ids?: number[];
  genres?: Array<string | { name?: string }>;
  keyword_names?: string[];
};

const coupleTypeDimensions = [
  { key: 'action', label: '动作', ids: [28], names: ['动作'] },
  { key: 'adventureFantasy', label: '冒险/奇幻', ids: [12, 14], names: ['冒险', '奇幻'] },
  { key: 'sciFi', label: '科幻', ids: [878], names: ['科幻'] },
  { key: 'thrillerHorror', label: '惊悚/恐怖', ids: [53, 27, 9648], names: ['惊悚', '恐怖', '悬疑'] },
  { key: 'comedy', label: '喜剧', ids: [35], names: ['喜剧'] },
  { key: 'romance', label: '爱情', ids: [10749], names: ['爱情'] },
  { key: 'drama', label: '剧情', ids: [18], names: ['剧情'] },
  { key: 'historyWar', label: '历史/战争', ids: [36, 10752], names: ['历史', '战争'] },
  { key: 'animation', label: '动画', ids: [16], names: ['动画'] },
  { key: 'familyKids', label: '家庭/儿童', ids: [10751], names: ['家庭', '儿童'] },
  { key: 'musicDance', label: '音乐/歌舞', ids: [10402], names: ['音乐', '歌舞'] },
  { key: 'documentaryBiopic', label: '纪录/传记', ids: [99], names: ['纪录'] },
];
const wheelLabels = ['剧情', '爱情', '科幻', '动画', '喜剧', '动作'];

const couple = useCoupleStore();
const entries = useEntriesStore();
const lists = useListsStore();
const session = useSessionStore();

const tab = ref<CoupleTab>('archive');
const search = ref('');
const queueAvailable = ref(true);
const couplesAvailable = ref(true);
const chartMode = ref<'score' | 'type'>('score');
const wheelPickId = ref<string | number | null>(null);
const detailCache = ref<Record<string, CacheDetail>>({});
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
const mineMovieEntries = computed(() => entries.entries.filter(entry => entry.user_id === currentUserId.value && mediaType(entry.type || entry.media_type) === 'movie'));
const partnerMovieEntries = computed(() => entries.entries.filter(entry => entry.user_id === partnerId.value && mediaType(entry.type || entry.media_type) === 'movie'));
const archiveData = computed(() => {
  const pairs = commonPairs.value.map(pair => {
    const mineScore = getEntryScore(pair.mine);
    const partnerScore = getEntryScore(pair.partner);
    return {
      ...pair,
      mineScore,
      partnerScore,
      avg: (mineScore + partnerScore) / 2,
      diff: Math.abs(mineScore - partnerScore),
    };
  });
  const harmony = pairs
    .filter(pair => pair.avg >= 7)
    .sort((a, b) => b.avg - a.avg || a.diff - b.diff)[0] || pairs.slice().sort((a, b) => a.diff - b.diff || b.avg - a.avg)[0] || null;
  const split = pairs.slice().sort((a, b) => b.diff - a.diff)[0] || null;
  return {
    pairs,
    harmony,
    split,
    mineDims: averageDims(mineMovieEntries.value),
    partnerDims: averageDims(partnerMovieEntries.value),
    myTypeDist: calcTypeDistribution(mineMovieEntries.value),
    partnerTypeDist: calcTypeDistribution(partnerMovieEntries.value),
    time: calcArchiveTime(pairs),
  };
});
const radarAxes = computed<ArchiveAxis[]>(() => {
  if (chartMode.value === 'type') {
    return coupleTypeDimensions.map(dim => ({
      key: dim.key,
      label: dim.label,
      mine: archiveData.value.myTypeDist[dim.key] || 0,
      partner: archiveData.value.partnerTypeDist[dim.key] || 0,
    }));
  }
  return (Object.keys(WEIGHTS) as RatingDim[]).map(dim => ({
    key: dim,
    label: DIM_LABELS[dim],
    mine: archiveData.value.mineDims[dim] || 0,
    partner: archiveData.value.partnerDims[dim] || 0,
  }));
});
const radarMaxValue = computed(() => chartMode.value === 'type'
  ? Math.max(1, ...radarAxes.value.map(axis => axis.mine), ...radarAxes.value.map(axis => axis.partner))
  : 10);
const wheelPick = computed(() => couple.queue.find(item => String(item.id) === String(wheelPickId.value)) || null);
const topTypeLabel = computed(() => {
  const top = coupleTypeDimensions
    .map(dim => ({ label: dim.label, value: archiveData.value.myTypeDist[dim.key] || 0 }))
    .sort((a, b) => b.value - a.value)[0];
  return top && top.value > 0 ? top.label : '剧情';
});
const wheelHitCount = computed(() => {
  const top = coupleTypeDimensions.find(dim => dim.label === topTypeLabel.value);
  if (!top) return 0;
  return couple.queue.filter(item => getTypeKeys(item as unknown as Entry).includes(top.key)).length;
});
const diffRows = computed(() => (Object.keys(WEIGHTS) as RatingDim[]).map(dim => {
  const diff = Math.abs((archiveData.value.mineDims[dim] || 0) - (archiveData.value.partnerDims[dim] || 0));
  return {
    dim,
    label: DIM_LABELS[dim],
    diff,
    color: diff >= 1 ? 'var(--ceci)' : diff >= 0.5 ? 'var(--gold)' : '#63c79d',
  };
}));

function asControls(input: unknown): CoupleControls {
  return (input || {}) as CoupleControls;
}

function applyControls(controls: CoupleControls): void {
  if (controls.tab === 'archive' || controls.tab === 'recommend' || controls.tab === 'queue') tab.value = controls.tab;
  if ((controls as { archiveChart?: string }).archiveChart) chartMode.value = (controls as { archiveChart?: string }).archiveChart === 'type' ? 'type' : 'score';
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

function loadDetailCache(): void {
  try {
    detailCache.value = JSON.parse(localStorage.getItem('filmnote_movie_cache') || '{}') || {};
  } catch {
    detailCache.value = {};
  }
}

function detailFor(entry: Pick<Entry, 'tmdb_id' | 'type' | 'media_type'>): CacheDetail | null {
  const id = Number(entry.tmdb_id || 0);
  if (!id) return null;
  return detailCache.value[`${mediaType(entry.type || entry.media_type)}:${id}`] || detailCache.value[String(id)] || null;
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

function setChartMode(nextMode: 'score' | 'type'): void {
  chartMode.value = nextMode;
  getLegacyBridge()?.couple?.updateControls?.({ archiveChart: nextMode });
}

async function loadRecommendations(force = false): Promise<void> {
  const bridge = getLegacyBridge();
  if (bridge?.couple?.loadCoupleRecommendations) {
    await bridge.couple.loadCoupleRecommendations(force);
    return;
  }
  if (!activeCouple.value || !currentUserId.value || recommendationLoading.value) return;
  couple.setLoading(true);
  couple.setRecommendationState('loading');
  try {
    const response = await fetch(`${TMDB_PROXY}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'couple',
        entries: entries.entries.map(entry => ({
          user_id: entry.user_id,
          type: mediaType(entry.type || entry.media_type),
          tmdb_id: entry.tmdb_id || null,
          total_score: entry.total_score || null,
          created_at: entry.created_at || '',
        })),
        userId: currentUserId.value,
        partnerUserId: partnerId.value,
        blockedIds: [...lists.blockedMovieIds],
        blockedMovies: [...lists.blockedMovieIds].map(tmdbId => ({ tmdb_id: tmdbId, reason: '' })),
        excludeIds: couple.queue.map(item => item.tmdb_id),
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `双人推荐接口异常 (${response.status})`);
    if (data.movies === null) {
      couple.setRecommendations([]);
      couple.setRecommendationState('insufficient');
    } else {
      couple.setRecommendations((data.movies || []).map((movie: TmdbMedia) => ({ ...movie, media_type: 'movie' })));
      couple.setRecommendationState('ready');
    }
  } catch {
    couple.setRecommendations([]);
    couple.setRecommendationState('error');
  } finally {
    couple.setLoading(false);
  }
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
  const bridge = getLegacyBridge();
  if (bridge?.couple?.moveQueueItem) {
    await bridge.couple.moveQueueItem(item.id, direction);
    return;
  }
  const index = couple.queue.findIndex(row => String(row.id) === String(item.id));
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= couple.queue.length) return;
  const next = [...couple.queue];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  couple.setQueue(next);
}

async function removeQueue(item: CoupleQueueItem): Promise<void> {
  await getLegacyBridge()?.couple?.removeQueueItem?.(item.id);
}

function rateQueue(item: CoupleQueueItem): void {
  if (!window.FilmNoteVueRatings?.openQuickRate?.({
    id: item.tmdb_id,
    tmdb_id: item.tmdb_id,
    media_type: mediaType(item.media_type),
    type: mediaType(item.media_type),
    title: item.title || `TMDB #${item.tmdb_id}`,
    year: item.year || null,
    poster_path: item.poster_path || '',
  })) {
    getLegacyBridge()?.couple?.rateQueueItem?.(item.id);
  }
}

async function openQueue(item: CoupleQueueItem): Promise<void> {
  if (!window.FilmNoteVueMediaDetail?.openListItem?.(item)) {
    await getLegacyBridge()?.couple?.showQueueItemDetail?.(item.id);
  }
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
  if (!window.FilmNoteVueMediaDetail?.openMovie?.({ ...movie, id: tmdbId(movie), tmdb_id: tmdbId(movie), media_type: mediaType(movie.media_type || movie.type) })) {
    await getLegacyBridge()?.discover?.showMovieDetail?.(tmdbId(movie));
  }
}

function averageDims(source: Entry[]): Record<RatingDim, number> {
  const result = {} as Record<RatingDim, number>;
  (Object.keys(WEIGHTS) as RatingDim[]).forEach(dim => {
    result[dim] = source.length ? source.reduce((sum, entry) => sum + Number(entry.ratings?.[dim] || 5), 0) / source.length : 0;
  });
  return result;
}

function genreIds(entry: EntryWithMeta): number[] {
  const detail = detailFor(entry);
  return (detail?.genre_ids || entry.genre_ids || []).map(Number).filter(Boolean);
}

function genreNames(entry: EntryWithMeta): string[] {
  const detail = detailFor(entry);
  const names = detail?.genres || entry.genres || [];
  return names.map(genre => typeof genre === 'string' ? genre : genre.name || '').filter(Boolean);
}

function getTypeKeys(entry: EntryWithMeta): string[] {
  const ids = new Set(genreIds(entry));
  const names = new Set(genreNames(entry));
  return coupleTypeDimensions
    .filter(dim => dim.ids.some(id => ids.has(id)) || dim.names.some(name => names.has(name)))
    .map(dim => dim.key);
}

function calcTypeDistribution(source: Entry[]): Record<string, number> {
  const result = Object.fromEntries(coupleTypeDimensions.map(dim => [dim.key, 0])) as Record<string, number>;
  source.forEach(entry => {
    const keys = getTypeKeys(entry);
    if (!keys.length) return;
    const weight = 1 / keys.length;
    keys.forEach(key => { result[key] += weight; });
  });
  return result;
}

function calcArchiveTime(pairs: Array<{ mine: Entry; partner: Entry; avg: number }>): { monthCount: number; daysAgo: number | null; streak: number } {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const datedPairs = pairs.map(pair => {
    const mineDate = new Date(pair.mine.created_at || pair.mine.updated_at || 0);
    const partnerDate = new Date(pair.partner.created_at || pair.partner.updated_at || 0);
    return { ...pair, latestDate: mineDate > partnerDate ? mineDate : partnerDate };
  }).filter(pair => !Number.isNaN(pair.latestDate.getTime()));
  const monthCount = datedPairs.filter(pair => pair.latestDate >= monthStart).length;
  const recentHigh = datedPairs.filter(pair => pair.avg >= 7).sort((a, b) => Number(b.latestDate) - Number(a.latestDate))[0] || null;
  const daysAgo = recentHigh ? Math.max(0, Math.floor((Date.now() - Number(recentHigh.latestDate)) / 86400000)) : null;
  const weekStart = (date: Date): number => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - ((copy.getDay() + 6) % 7));
    return copy.getTime();
  };
  const weeks = new Set(datedPairs.map(pair => weekStart(pair.latestDate)));
  let streak = 0;
  let cursor = weekStart(now);
  while (weeks.has(cursor)) {
    streak += 1;
    cursor -= 7 * 86400000;
  }
  return { monthCount, daysAgo, streak };
}

function posterFor(entry: Partial<Entry | CoupleQueueItem> | null | undefined): string {
  if (!entry) return '';
  return entry.poster_path || detailFor(entry as Entry)?.poster_path || '';
}

function posterStack(source: Array<Partial<Entry | CoupleQueueItem> | null | undefined>): string[] {
  return source.map(posterFor).filter(Boolean).slice(0, 3);
}

function radarPoint(radius: number, index: number): [number, number] {
  const angle = -Math.PI / 2 + (index * Math.PI * 2 / radarAxes.value.length);
  return [210 + Math.cos(angle) * radius, 210 + Math.sin(angle) * radius];
}

function radarLevelPoints(level: number): string {
  const radius = (chartMode.value === 'type' ? 148 : 136) * level;
  return radarAxes.value.map((_, index) => radarPoint(radius, index).map(value => value.toFixed(1)).join(',')).join(' ');
}

function radarPolygon(side: 'mine' | 'partner'): string {
  const radius = chartMode.value === 'type' ? 148 : 136;
  return radarAxes.value.map((axis, index) => {
    const value = Math.min(Number(axis[side] || 0) / radarMaxValue.value, 1);
    return radarPoint(radius * value, index).map(point => point.toFixed(1)).join(',');
  }).join(' ');
}

function axisPoint(index: number): { x: number; y: number; anchor: 'start' | 'middle' | 'end' } {
  const [x, y] = radarPoint((chartMode.value === 'type' ? 148 : 136) + (chartMode.value === 'type' ? 36 : 48), index);
  return {
    x,
    y,
    anchor: x < 194 ? 'end' : x > 226 ? 'start' : 'middle',
  };
}

function scoreQueueItem(item: CoupleQueueItem): number {
  const keys = getTypeKeys(item as unknown as Entry);
  const typeScore = keys.length
    ? keys.reduce((sum, key) => sum + (archiveData.value.myTypeDist[key] || 0) + (archiveData.value.partnerTypeDist[key] || 0), 0) / keys.length
    : 0;
  const safety = keys.some(key => ['drama', 'romance', 'comedy', 'adventureFantasy', 'sciFi'].includes(key)) ? 1.4 : 1;
  return Math.max(1, 1 + typeScore * 0.25) * safety;
}

function spinWheel(): void {
  if (!couple.queue.length) return;
  const weighted = couple.queue.map(item => ({ item, weight: scoreQueueItem(item) }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let needle = Math.random() * total;
  for (const item of weighted) {
    needle -= item.weight;
    if (needle <= 0) {
      wheelPickId.value = item.item.id;
      return;
    }
  }
  wheelPickId.value = weighted[0]?.item.id || null;
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
  loadDetailCache();
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

      <div v-if="tab === 'archive'" class="couple-archive">
        <div class="couple-archive-top">
          <div class="couple-archive-card">
            <div class="couple-poster-stack" :class="{ 'couple-poster-stack-empty': !posterStack(archiveData.pairs.map(pair => pair.mine)).length }">
              <img v-for="poster in posterStack(archiveData.pairs.map(pair => pair.mine))" :key="poster" :src="poster" alt="">
            </div>
            <div class="couple-archive-card-body">
              <span>关系仪表盘</span>
              <strong style="color:var(--gold)">{{ compatibility.overall }}</strong>
              <p>默契指数 · 共同样本 {{ compatibility.sample }} 部</p>
            </div>
          </div>
          <div class="couple-archive-card">
            <div class="couple-poster-stack" :class="{ 'couple-poster-stack-empty': !posterStack([archiveData.harmony?.mine]).length }">
              <img v-for="poster in posterStack([archiveData.harmony?.mine])" :key="poster" :src="poster" alt="">
            </div>
            <div class="couple-archive-card-body">
              <span>共同封神</span>
              <strong :style="{ color: partnerColor.main }">{{ archiveData.harmony?.mine.title || '暂无共同电影' }}</strong>
              <p>{{ archiveData.harmony ? `你 ${archiveData.harmony.mineScore.toFixed(1)} / ${partnerName} ${archiveData.harmony.partnerScore.toFixed(1)}` : '共同评分后生成' }}</p>
            </div>
          </div>
          <div class="couple-archive-card">
            <div class="couple-poster-stack" :class="{ 'couple-poster-stack-empty': !posterStack(couple.queue).length }">
              <img v-for="poster in posterStack(couple.queue)" :key="poster" :src="poster" alt="">
            </div>
            <div class="couple-archive-card-body">
              <span>下次看决策</span>
              <strong style="color:var(--friend)">{{ couple.queue.length }} 部</strong>
              <p>点击转盘抽一部</p>
            </div>
          </div>
          <div class="couple-archive-card">
            <div class="couple-poster-stack couple-poster-stack-empty"></div>
            <div class="couple-archive-card-body">
              <span>时间节奏</span>
              <strong style="color:#63c79d">{{ archiveData.time.monthCount }} 部</strong>
              <p>本月共同评分 · 连续 {{ archiveData.time.streak || 0 }} 周</p>
            </div>
          </div>
        </div>

        <div class="couple-archive-layout">
          <div class="couple-archive-main">
            <div class="couple-section-head">
              <div>
                <div class="couple-section-title">主图切换区</div>
                <p class="couple-note">同一位置切换评分默契与 12 维类型分布</p>
              </div>
              <div class="couple-chart-toggle">
                <button type="button" :class="{ active: chartMode === 'score' }" @click="setChartMode('score')">评分默契</button>
                <button type="button" :class="{ active: chartMode === 'type' }" @click="setChartMode('type')">类型分布</button>
              </div>
            </div>
            <svg class="couple-radar" viewBox="0 0 420 420" role="img" :aria-label="chartMode === 'type' ? '类型分布雷达图' : '评分默契雷达图'">
              <polygon v-for="level in [0.2, 0.4, 0.6, 0.8, 1]" :key="level" :points="radarLevelPoints(level)" fill="none" stroke="var(--border)" stroke-width="1" />
              <line
                v-for="(_, index) in radarAxes"
                :key="`spoke-${index}`"
                x1="210"
                y1="210"
                :x2="radarPoint(chartMode === 'type' ? 148 : 136, index)[0].toFixed(1)"
                :y2="radarPoint(chartMode === 'type' ? 148 : 136, index)[1].toFixed(1)"
                stroke="var(--border)"
                stroke-width="1"
              />
              <polygon :points="radarPolygon('mine')" :fill="myColor.main" fill-opacity="0.22" :stroke="myColor.main" stroke-width="3" stroke-linejoin="round"></polygon>
              <polygon :points="radarPolygon('partner')" :fill="partnerColor.main" fill-opacity="0.22" :stroke="partnerColor.main" stroke-width="3" stroke-linejoin="round"></polygon>
              <circle cx="210" cy="210" r="3" fill="var(--text2)"></circle>
              <template v-for="(axis, index) in radarAxes" :key="axis.key">
                <text :x="axisPoint(index).x.toFixed(1)" :y="(axisPoint(index).y - 4).toFixed(1)" :text-anchor="axisPoint(index).anchor" class="couple-radar-label" :class="{ type: chartMode === 'type' }">{{ axis.label }}</text>
                <text :x="axisPoint(index).x.toFixed(1)" :y="(axisPoint(index).y + 13).toFixed(1)" :text-anchor="axisPoint(index).anchor" class="couple-radar-score">{{ axis.mine.toFixed(1) }} / {{ axis.partner.toFixed(1) }}</text>
              </template>
            </svg>
            <div class="couple-radar-legend">
              <span><i :style="{ background: myColor.main }"></i>我</span>
              <span><i :style="{ background: partnerColor.main }"></i>{{ partnerName }}</span>
              <em>{{ chartMode === 'type' ? '多类型电影按命中大类平分权重' : '重叠面积越大，评分默契越高' }}</em>
            </div>
          </div>

          <div class="couple-archive-left">
            <div class="couple-story-card">
              <div class="couple-poster-stack" :class="{ 'couple-poster-stack-empty': !posterStack([archiveData.harmony?.mine]).length }">
                <img v-for="poster in posterStack([archiveData.harmony?.mine])" :key="poster" :src="poster" alt="">
              </div>
              <span>最大共鸣</span>
              <strong>{{ archiveData.harmony?.mine.title || '暂无共同电影' }}</strong>
              <em>{{ archiveData.harmony ? `共同高分 · 差 ${archiveData.harmony.diff.toFixed(1)}` : '共同样本越多越准' }}</em>
              <p>统计像故事，不只是数字</p>
            </div>
            <div class="couple-story-card">
              <div class="couple-poster-stack" :class="{ 'couple-poster-stack-empty': !posterStack([archiveData.split?.mine]).length }">
                <img v-for="poster in posterStack([archiveData.split?.mine])" :key="poster" :src="poster" alt="">
              </div>
              <span>最大分歧</span>
              <strong>{{ archiveData.split?.mine.title || '暂无共同电影' }}</strong>
              <em>{{ archiveData.split ? `总分差 ${archiveData.split.diff.toFixed(1)}` : '共同样本越多越准' }}</em>
              <p>保留一点饭后讨论的趣味</p>
            </div>
            <div class="couple-story-card no-poster">
              <span>Couple 成就</span>
              <div class="couple-achievement"><strong style="color:var(--gold)">同步审美</strong><span>{{ archiveData.pairs.filter(pair => pair.diff < 1).length }} 部分差 &lt; 1</span></div>
              <div class="couple-achievement"><strong style="color:var(--ceci)">分歧名场面</strong><span>{{ archiveData.pairs.filter(pair => pair.diff >= 3).length }} 部差距 >= 3</span></div>
              <div class="couple-achievement"><strong style="color:var(--friend)">意见领袖</strong><span>{{ couple.queue.length }} 部待验证</span></div>
            </div>
          </div>

          <div class="couple-archive-right">
            <div class="couple-archive-side-card">
              <div class="couple-section-title">下次看：转盘抽一部</div>
              <p class="couple-note">从队列按默契权重随机</p>
              <div class="couple-wheel-row">
                <button class="couple-wheel" type="button" aria-label="抽一部" @click="spinWheel">
                  <span v-for="(label, index) in wheelLabels" :key="label" :style="{ '--i': index }">{{ label }}</span>
                  <b>抽</b>
                </button>
                <div class="couple-wheel-stats">
                  <span>今晚命中率</span><strong>{{ wheelHitCount }}/{{ couple.queue.length || 0 }}</strong>
                  <span>安全选择</span><strong>{{ topTypeLabel }}</strong>
                </div>
              </div>
              <div v-if="wheelPick" class="couple-wheel-result" :data-queue-id="wheelPick.id" @click="openQueue(wheelPick)">
                <img v-if="posterUrl(wheelPick.poster_path)" :src="posterUrl(wheelPick.poster_path)" alt="">
                <div v-else></div>
                <strong>{{ wheelPick.title }}</strong>
                <span>{{ wheelPick.year || '未知' }} · {{ mediaTypeLabel(wheelPick.media_type) }}</span>
                <button class="btn btn-xs btn-secondary" type="button" @click.stop="rateQueue(wheelPick)">评分</button>
                <button class="btn btn-xs btn-danger" type="button" @click.stop="removeQueue(wheelPick); wheelPickId = null">移除</button>
              </div>
              <p v-else class="couple-muted">{{ couple.queue.length ? '点击转盘抽一部' : '下次看队列为空' }}</p>
            </div>

            <div class="couple-archive-side-card">
              <div class="couple-section-title">分歧雷达</div>
              <p class="couple-note">辅助评分默契图</p>
              <div v-for="row in diffRows" :key="row.dim" class="couple-diff-row">
                <span>{{ row.label }}</span>
                <i><b :style="{ width: `${Math.min(row.diff / 2, 1) * 100}%`, background: row.color }"></b></i>
                <em>{{ row.diff.toFixed(1) }}</em>
              </div>
            </div>

            <div class="couple-archive-side-card">
              <div class="couple-section-title">时间动态</div>
              <strong class="couple-time-highlight">{{ archiveData.time.daysAgo === null ? '暂无同步高分' : `最近一次同步高分：${archiveData.time.daysAgo} 天前` }}</strong>
              <p>本月共同评分 {{ archiveData.time.monthCount }} 部</p>
              <p>连续 {{ archiveData.time.streak || 0 }} 周都有共同观影记录</p>
            </div>
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
