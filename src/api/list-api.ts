import { getSupabaseClient } from './supabase.js';
import type { BlockedMovie, MediaType, WatchlistItem } from '../types/domain.js';

export async function loadWatchlist(userId: string) {
  return getSupabaseClient()
    .from('watchlist_movies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function addWatchlistItem(payload: WatchlistItem) {
  return getSupabaseClient()
    .from('watchlist_movies')
    .insert(payload);
}

export async function removeWatchlistItem(userId: string, mediaType: MediaType, tmdbId: number) {
  return getSupabaseClient()
    .from('watchlist_movies')
    .delete()
    .eq('user_id', userId)
    .eq('media_type', mediaType)
    .eq('tmdb_id', tmdbId);
}

export async function loadBlockedMovies(userId: string) {
  return getSupabaseClient()
    .from('blocked_movies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

export async function addBlockedMovie(payload: BlockedMovie) {
  return getSupabaseClient()
    .from('blocked_movies')
    .insert(payload);
}

export async function removeBlockedMovie(userId: string, tmdbId: number) {
  return getSupabaseClient()
    .from('blocked_movies')
    .delete()
    .eq('user_id', userId)
    .eq('tmdb_id', tmdbId);
}
