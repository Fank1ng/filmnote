import { getSupabaseClient } from './supabase.js';
import type { Couple, CoupleQueueItem } from '../types/domain.js';

export async function loadCouples(userId: string) {
  return getSupabaseClient()
    .from('couples')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });
}

export async function createCouple(payload: Omit<Couple, 'id'> | Partial<Couple>) {
  return getSupabaseClient()
    .from('couples')
    .insert(payload);
}

export async function bindCouple(userId: string, targetUserId: string) {
  return createCouple({
    user_a: userId,
    user_b: targetUserId,
    requested_by: userId,
    status: 'pending',
  });
}

export async function confirmCouple(coupleId: Couple['id']) {
  return updateCouple(coupleId, {
    status: 'active',
    updated_at: new Date().toISOString(),
  });
}

export async function requestCoupleDisconnect(coupleId: Couple['id'], userId: string) {
  return updateCouple(coupleId, {
    disconnect_requested_by: userId,
    updated_at: new Date().toISOString(),
  });
}

export async function cancelCoupleDisconnect(coupleId: Couple['id']) {
  return updateCouple(coupleId, {
    disconnect_requested_by: null,
    updated_at: new Date().toISOString(),
  });
}

export async function updateCouple(coupleId: Couple['id'], payload: Partial<Couple>) {
  return getSupabaseClient()
    .from('couples')
    .update(payload)
    .eq('id', coupleId);
}

export async function deleteCouple(coupleId: Couple['id']) {
  return getSupabaseClient()
    .from('couples')
    .delete()
    .eq('id', coupleId);
}

export async function loadCoupleQueue(coupleId: Couple['id']) {
  return getSupabaseClient()
    .from('couple_watch_queue')
    .select('*')
    .eq('couple_id', coupleId)
    .order('position', { ascending: true });
}

export async function addCoupleQueueItem(payload: Omit<CoupleQueueItem, 'id'> | Partial<CoupleQueueItem>) {
  return getSupabaseClient()
    .from('couple_watch_queue')
    .insert(payload)
    .select('*')
    .single();
}

export async function updateCoupleQueueItem(queueId: CoupleQueueItem['id'], payload: Partial<CoupleQueueItem>) {
  return getSupabaseClient()
    .from('couple_watch_queue')
    .update(payload)
    .eq('id', queueId);
}

export async function removeCoupleQueueItem(queueId: CoupleQueueItem['id']) {
  return getSupabaseClient()
    .from('couple_watch_queue')
    .delete()
    .eq('id', queueId);
}
