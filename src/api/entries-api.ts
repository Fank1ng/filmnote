import { getSupabaseClient } from './supabase.js';
import type { Entry, SeasonRating } from '../types/domain.js';

export async function loadEntries() {
  return getSupabaseClient()
    .from('entries')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function createEntry(payload: Partial<Entry>) {
  return getSupabaseClient()
    .from('entries')
    .insert(payload)
    .select('*')
    .single();
}

export async function updateEntry(id: Entry['id'], payload: Partial<Entry>) {
  return getSupabaseClient()
    .from('entries')
    .update(payload)
    .eq('id', id);
}

export async function deleteEntry(id: Entry['id']) {
  return getSupabaseClient()
    .from('entries')
    .delete()
    .eq('id', id);
}

export async function loadSeasonRatings() {
  return getSupabaseClient()
    .from('season_ratings')
    .select('*')
    .order('season_number', { ascending: true });
}

export async function deleteSeasonRatings(entryId: Entry['id'], userId: string) {
  return getSupabaseClient()
    .from('season_ratings')
    .delete()
    .eq('entry_id', entryId)
    .eq('user_id', userId);
}

export async function saveSeasonRatings(rows: SeasonRating[]) {
  if (!rows.length) return { data: [], error: null };
  return getSupabaseClient()
    .from('season_ratings')
    .insert(rows);
}
