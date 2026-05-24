import type { SupabaseFactory } from './supabase';

declare global {
  interface Window {
    supabase?: SupabaseFactory;
  }
}

export {};
