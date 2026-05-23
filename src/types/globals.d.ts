import type { SupabaseClient, SupabaseFactory } from './supabase';

declare global {
  interface Window {
    supabase?: SupabaseFactory;
    db?: SupabaseClient;
    FilmNoteAPI?: Record<string, unknown>;
    FilmNoteCache?: Record<string, unknown>;
    FilmNoteDOM?: Record<string, unknown>;
    FilmNoteRecommendUI?: Record<string, unknown>;
    FilmNoteScoring?: Record<string, unknown>;
    FilmNoteState?: Record<string, unknown>;
    FilmNoteTmdb?: Record<string, unknown>;
    FilmNoteTmdbCache?: Record<string, unknown>;
    FilmNoteUtils?: Record<string, unknown>;
    SUPABASE_URL?: string;
    SUPABASE_KEY?: string;
    TMDB_IMG?: string;
    TMDB_PROXY?: string;
    SESSION_KEY?: string;
    WEIGHTS?: Record<string, number>;
    DIM_LABELS?: Record<string, string>;
    tmdbFetch?: (path: string, opts?: RequestInit) => Promise<Response>;
  }
}

export {};
