import { getSupabaseClient } from './supabase.js';
import type { Profile } from '../types/domain.js';

export async function loadProfiles() {
  return getSupabaseClient()
    .from('user_preferences')
    .select('*');
}

export async function loadPublicProfiles() {
  return getSupabaseClient()
    .from('public_profiles')
    .select('user_id, display_name');
}

export async function loadProfile(userId: string) {
  return getSupabaseClient()
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
}

export async function findProfileByDisplayName(displayName: string) {
  return getSupabaseClient()
    .from('user_preferences')
    .select('user_id')
    .eq('display_name', displayName)
    .maybeSingle();
}

export async function upsertProfile(payload: Partial<Profile> & Pick<Profile, 'user_id'>) {
  return getSupabaseClient()
    .from('user_preferences')
    .upsert(payload);
}

export async function updateProfile(userId: string, payload: Partial<Profile>) {
  return getSupabaseClient()
    .from('user_preferences')
    .update(payload)
    .eq('user_id', userId);
}

export async function loadInviteCodes() {
  return getSupabaseClient()
    .from('invite_codes')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function generateInviteCode() {
  return getSupabaseClient().rpc('generate_invite_code');
}

export async function claimInviteCode(code: string) {
  return getSupabaseClient().rpc('claim_invite_code', { p_code: code });
}
