import { loadEntries, loadPublicEntries, loadPublicSeasonRatings, loadSeasonRatings } from '../api/entries-api.js';
import { loadBlockedMovies, loadWatchlist } from '../api/list-api.js';
import { loadProfiles, loadPublicProfiles } from '../api/profile-api.js';
import { getSupabaseClient } from '../api/supabase.js';
import { useCoupleStore } from '../stores/couple.js';
import { useEntriesStore } from '../stores/entries.js';
import { useListsStore } from '../stores/lists.js';
import { useSessionStore } from '../stores/session.js';
import type { BlockedMovie, Couple, CoupleQueueItem, Entry, Profile, SeasonRating, WatchlistItem } from '../types/domain.js';
import { getCurrentUserId } from './user-context.js';

function currentUserId(): string {
  return getCurrentUserId(useSessionStore().currentUser);
}

function profilesById(profiles: Profile[] = []): Record<string, Profile> {
  return Object.fromEntries(profiles.filter(profile => profile.user_id).map(profile => [profile.user_id, profile]));
}

function partnerId(couple: Couple | null, userId: string): string | null {
  if (!couple || !userId) return null;
  return couple.user_a === userId ? couple.user_b || null : couple.user_a || null;
}

async function refreshCouple(userId: string): Promise<void> {
  const coupleStore = useCoupleStore();
  const db = getSupabaseClient();
  const { data, error } = await db
    .from('couples')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('updated_at', { ascending: false });
  if (error) return;

  const rows = (data || []) as Couple[];
  const activeCouple = rows.find(row => row.status === 'active') || null;
  coupleStore.setActiveCouple(activeCouple);
  coupleStore.setPendingCouples(activeCouple ? [] : rows.filter(row => row.status === 'pending'));
  coupleStore.setPartnerProfileId(partnerId(activeCouple, userId));

  if (!activeCouple) {
    coupleStore.setQueue([]);
    return;
  }

  const { data: queueData, error: queueError } = await db
    .from('couple_watch_queue')
    .select('*')
    .eq('couple_id', activeCouple.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });
  if (!queueError) coupleStore.setQueue((queueData || []) as CoupleQueueItem[]);
}

export async function refreshVueData(): Promise<void> {
  const userId = currentUserId();
  const entriesStore = useEntriesStore();
  const listsStore = useListsStore();
  const authenticated = useSessionStore().isAuthenticated;

  const [entriesResult, seasonsResult, profilesResult] = await Promise.all([
    authenticated ? loadEntries() : loadPublicEntries(),
    authenticated ? loadSeasonRatings() : loadPublicSeasonRatings(),
    authenticated ? loadProfiles() : loadPublicProfiles(),
  ]);

  if (!entriesResult.error) entriesStore.setEntries((entriesResult.data || []) as Entry[]);
  if (!seasonsResult.error) entriesStore.setSeasonRatings((seasonsResult.data || []) as SeasonRating[]);
  if (!profilesResult.error) entriesStore.setProfiles(profilesById((profilesResult.data || []) as Profile[]));

  if (!userId) {
    listsStore.setWatchlist([]);
    listsStore.setBlockedMovies([]);
    const coupleStore = useCoupleStore();
    coupleStore.setActiveCouple(null);
    coupleStore.setPendingCouples([]);
    coupleStore.setPartnerProfileId(null);
    coupleStore.setQueue([]);
    coupleStore.setRecommendations([]);
    coupleStore.setRecommendationState('idle');
    return;
  }

  const [watchlistResult, blockedResult] = await Promise.all([
    loadWatchlist(userId),
    loadBlockedMovies(userId),
  ]);
  if (!watchlistResult.error) listsStore.setWatchlist((watchlistResult.data || []) as WatchlistItem[]);
  if (!blockedResult.error) listsStore.setBlockedMovies((blockedResult.data || []) as BlockedMovie[]);

  await refreshCouple(userId);
}
