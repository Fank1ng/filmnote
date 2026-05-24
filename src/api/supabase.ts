import { SUPABASE_KEY, SUPABASE_URL } from '../config/constants.js';
import type { SupabaseClient, SupabaseFactory } from '../types/supabase.js';

let client: SupabaseClient | null = null;

export function initSupabaseClient(factory: SupabaseFactory | undefined = window.supabase): SupabaseClient {
  if (client) return client;
  if (!factory || typeof factory.createClient !== 'function') {
    throw new Error('Supabase client library is not loaded');
  }
  client = factory.createClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}

export function getSupabaseClient(): SupabaseClient {
  if (!client) return initSupabaseClient();
  return client;
}
