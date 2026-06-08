import type {
  BlockedMovie,
  Couple,
  CoupleQueueItem,
  Entry,
  Profile,
  SeasonRating,
  WatchlistItem,
} from './domain.js';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type InviteCode = {
  code: string;
  created_at?: string;
  created_by?: string | null;
  claimed_by?: string | null;
  claimed_at?: string | null;
  expires_at?: string | null;
  [key: string]: unknown;
};

type PublicProfile = Pick<Profile, 'user_id' | 'display_name'>;

export type Database = {
  public: {
    Tables: {
      entries: Table<Entry>;
      season_ratings: Table<SeasonRating>;
      user_preferences: Table<Profile>;
      watchlist_movies: Table<WatchlistItem>;
      blocked_movies: Table<BlockedMovie>;
      couples: Table<Couple>;
      couple_watch_queue: Table<CoupleQueueItem>;
      invite_codes: Table<InviteCode>;
    };
    Views: {
      public_entries: Table<Entry>;
      public_season_ratings: Table<SeasonRating>;
      public_profiles: Table<PublicProfile>;
    };
    Functions: {
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
      claim_invite_code: {
        Args: { p_code: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
