import { addCoupleQueueItem } from '../../api/couple-api.js';
import { addBlockedMovie, addWatchlistItem, removeWatchlistItem } from '../../api/list-api.js';
import { refreshVueData } from '../../app/data-sync.js';
import { getCurrentUserId } from '../../app/user-context.js';
import { useCoupleStore } from '../../stores/couple.js';
import { useEntriesStore } from '../../stores/entries.js';
import { useListsStore } from '../../stores/lists.js';
import { useModalStore } from '../../stores/modals.js';
import { useSessionStore } from '../../stores/session.js';
import { useUiStore } from '../../stores/ui.js';
import type { CoupleQueueItem, Entry, MediaType, TmdbMedia, WatchlistItem } from '../../types/domain.js';

type MediaActionInput = TmdbMedia | WatchlistItem | CoupleQueueItem | Entry | Record<string, unknown>;
type NormalizedMedia = {
  id: number;
  tmdb_id: number;
  media_type: MediaType;
  type: MediaType;
  title: string;
  name?: string;
  year: number | null;
  poster_path: string;
  release_date: string;
  first_air_date?: string;
  director?: string;
  number_of_seasons?: number;
  [key: string]: unknown;
};

function text(value: unknown): string {
  return String(value || '').trim();
}

function normalizeMediaType(value: unknown, input: Record<string, unknown>): MediaType {
  if (value === 'series' || value === 'tv') return 'series';
  return input.first_air_date || input.number_of_seasons ? 'series' : 'movie';
}

function tmdbIdOf(input: Record<string, unknown>): number {
  return Number(input.tmdb_id || input.id || 0) || 0;
}

function yearOf(input: Record<string, unknown>): number | null {
  const direct = Number(input.year || 0);
  if (direct) return direct;
  const date = text(input.release_date || input.first_air_date);
  const year = Number(date.slice(0, 4));
  return year || null;
}

function normalizeMedia(input: MediaActionInput | null | undefined): NormalizedMedia | null {
  const record = (input || {}) as Record<string, unknown>;
  const tmdbId = tmdbIdOf(record);
  const title = text(record.title || record.name) || (tmdbId ? `TMDB #${tmdbId}` : '');
  if (!tmdbId || !title) return null;
  const mediaType = normalizeMediaType(record.media_type || record.type, record);
  return {
    ...record,
    id: tmdbId,
    tmdb_id: tmdbId,
    media_type: mediaType,
    type: mediaType,
    title,
    name: text(record.name) || title,
    year: yearOf(record),
    poster_path: text(record.poster_path),
    release_date: text(record.release_date || record.first_air_date),
    first_air_date: text(record.first_air_date),
    director: text(record.director),
    number_of_seasons: Number(record.number_of_seasons || 0) || undefined,
  };
}

function listKey(media: Pick<NormalizedMedia, 'media_type' | 'tmdb_id'>): string {
  return `${media.media_type}:${media.tmdb_id}`;
}

function listRuleErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : String(error || '');
  if (/list_rule_already_rated_watchlist/i.test(message)) return '你已评价，不能加入想看';
  if (/list_rule_watchlist_queue_conflict/i.test(message)) return '已在另一个清单里，不能重复加入';
  if (/watchlist_movies|schema cache|does not exist|relation|media_type|column/i.test(message)) return '想看清单表尚未升级，请先执行升级 SQL';
  return message ? `${fallback}: ${message}` : fallback;
}

export function useMediaActions() {
  const ui = useUiStore();
  const session = useSessionStore();
  const entries = useEntriesStore();
  const lists = useListsStore();
  const couple = useCoupleStore();
  const modals = useModalStore();

  const userId = () => getCurrentUserId(session.currentUser);

  function rateMedia(input: MediaActionInput, opts: Record<string, unknown> = {}): boolean {
    const media = normalizeMedia(input);
    if (!media) {
      ui.showToast('无法识别影片信息');
      return false;
    }
    modals.openQuickRate({ ...media, ...opts });
    return true;
  }

  function openMediaDetail(input: MediaActionInput): boolean {
    const media = normalizeMedia(input);
    if (!media) {
      ui.showToast('无法打开详情，影片信息不完整');
      return false;
    }
    modals.openMediaDetail(media);
    return true;
  }

  function openEntryDetail(id: Entry['id']): boolean {
    modals.openEntryDetail(id);
    return true;
  }

  async function toggleWatchlist(input: MediaActionInput): Promise<boolean> {
    const currentUserId = userId();
    const media = normalizeMedia(input);
    if (!currentUserId) {
      ui.showToast('请先登录');
      return false;
    }
    if (!media) {
      ui.showToast('无法更新想看清单，影片信息不完整');
      return false;
    }
    let fallbackError = '加入想看失败';
    try {
      if (lists.watchlistIds.has(listKey(media))) {
        fallbackError = '移除想看失败';
        const { error } = await removeWatchlistItem(currentUserId, media.media_type, media.tmdb_id);
        if (error) throw error;
        ui.showToast('已移出想看');
      } else {
        if (isRated(media)) {
          ui.showToast('你已评价，不能加入想看');
          return false;
        }
        if (couple.queue.some(item => item.media_type === media.media_type && Number(item.tmdb_id) === media.tmdb_id)) {
          ui.showToast('已在下次看，不能重复加入想看');
          return false;
        }
        const { error } = await addWatchlistItem({
          user_id: currentUserId,
          media_type: media.media_type,
          tmdb_id: media.tmdb_id,
          title: media.title,
          year: media.year,
          poster_path: media.poster_path,
        });
        if (error) throw error;
        ui.showToast('已加入想看');
      }
      await refreshVueData();
      return true;
    } catch (error) {
      ui.showToast(listRuleErrorMessage(error, fallbackError));
      return false;
    }
  }

  async function addToNextWatch(input: MediaActionInput): Promise<boolean> {
    const currentUserId = userId();
    const media = normalizeMedia(input);
    if (!currentUserId) {
      ui.showToast('请先登录');
      return false;
    }
    if (!couple.activeCouple) {
      ui.showToast('请先绑定 Couple');
      return false;
    }
    if (!media) {
      ui.showToast('无法加入下次看，影片信息不完整');
      return false;
    }
    if (couple.queue.some(item => item.media_type === media.media_type && Number(item.tmdb_id) === media.tmdb_id)) {
      ui.showToast('已在下次看');
      return true;
    }
    if (lists.watchlistIds.has(listKey(media))) {
      ui.showToast('已在想看，不能重复加入下次看');
      return false;
    }
    try {
      const maxPosition = couple.queue.reduce((max, item) => Math.max(max, Number(item.position || 0)), 0);
      const { error } = await addCoupleQueueItem({
        couple_id: couple.activeCouple.id,
        media_type: media.media_type,
        tmdb_id: media.tmdb_id,
        title: media.title,
        year: media.year,
        poster_path: media.poster_path,
        position: maxPosition + 1,
        added_by: currentUserId,
      });
      if (error) throw error;
      await refreshVueData();
      ui.showToast('已加入下次看');
      return true;
    } catch (error) {
      ui.showToast(listRuleErrorMessage(error, '加入下次看失败'));
      return false;
    }
  }

  async function blockMedia(input: MediaActionInput, reason = ''): Promise<boolean> {
    const currentUserId = userId();
    const media = normalizeMedia(input);
    if (!currentUserId) {
      ui.showToast('请先登录');
      return false;
    }
    if (!media) {
      ui.showToast('无法屏蔽，影片信息不完整');
      return false;
    }
    try {
      const { error } = await addBlockedMovie({ user_id: currentUserId, tmdb_id: media.tmdb_id, reason });
      if (error) throw error;
      await refreshVueData();
      ui.showToast('已屏蔽该推荐');
      return true;
    } catch (error) {
      ui.showToast(`屏蔽失败: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  function isRated(input: MediaActionInput): boolean {
    const currentUserId = userId();
    const media = normalizeMedia(input);
    if (!currentUserId || !media) return false;
    return entries.entries.some(entry =>
      entry.user_id === currentUserId
      && (entry.type || entry.media_type || 'movie') === media.media_type
      && Number(entry.tmdb_id || 0) === media.tmdb_id
    );
  }

  return {
    addToNextWatch,
    blockMedia,
    isRated,
    openEntryDetail,
    openMediaDetail,
    rateMedia,
    toggleWatchlist,
  };
}
