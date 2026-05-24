import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_KEY, SUPABASE_URL } from '../config/constants.js';
import type { Database } from '../types/database.js';

let client: SupabaseClient<Database> | null = null;

export function initSupabaseClient(): SupabaseClient<Database> {
  if (client) return client;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase configuration is missing');
  }
  client = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
  return client;
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!client) return initSupabaseClient();
  return client;
}
