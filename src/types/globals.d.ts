import type { SupabaseClient, SupabaseFactory } from './supabase';
import type { LegacyBridge } from '../features/types';
import type { AppState } from '../core/state';

type FilmNoteStateApi = {
  getState?: () => AppState;
  setState?: (patch: Partial<AppState>) => AppState;
  subscribe?: (listener: (state: AppState) => void) => () => void;
};

declare global {
  interface Window {
    supabase?: SupabaseFactory;
    db?: SupabaseClient;
    FilmNoteAPI?: Record<string, unknown>;
    FilmNoteCache?: Record<string, unknown>;
    FilmNoteDOM?: Record<string, unknown>;
    FilmNoteRecommendUI?: Record<string, unknown>;
    FilmNoteScoring?: Record<string, unknown>;
    FilmNoteState?: FilmNoteStateApi;
    FilmNoteTmdb?: Record<string, unknown>;
    FilmNoteTmdbCache?: Record<string, unknown>;
    FilmNoteUtils?: Record<string, unknown>;
    FilmNoteLegacy?: LegacyBridge;
    FilmNoteVueUi?: {
      toast?: (message: string) => void;
    };
    FilmNoteVueRatings?: {
      openQuickRate?: (movie: unknown) => boolean;
      openQuickEdit?: (id: string | number, opts?: unknown) => boolean;
    };
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
