export type MediaType = 'movie' | 'series';

export type RatingDims = {
  story?: number;
  character?: number;
  visual?: number;
  editing?: number;
  sound?: number;
  emotion?: number;
};

export type Entry = {
  id: string | number;
  user_id: string;
  type?: MediaType;
  media_type?: MediaType;
  tmdb_id?: number | null;
  title: string;
  year?: number | null;
  director?: string;
  poster_path?: string;
  ratings?: RatingDims;
  score?: number | null;
  total_score?: number | null;
  comment?: string;
  created_at?: string;
  updated_at?: string;
};

export type SeasonRating = {
  id?: string | number;
  entry_id: string | number;
  user_id: string;
  season_number: number;
  season_title?: string;
  ratings?: RatingDims;
  total_score?: number | null;
  comment?: string;
};

export type Profile = {
  user_id: string;
  display_name?: string;
  session_token?: string;
  [key: string]: unknown;
};

export type Couple = {
  id: string | number;
  user1_id: string;
  user2_id: string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type WatchlistItem = {
  id?: string | number;
  user_id: string;
  media_type: MediaType;
  tmdb_id: number;
  title?: string;
  year?: number | null;
  poster_path?: string;
  release_date?: string;
  created_at?: string;
};

export type BlockedMovie = {
  id?: string | number;
  user_id: string;
  tmdb_id: number;
  reason?: string;
  created_at?: string;
};

export type CoupleQueueItem = {
  id: string | number;
  couple_id: string | number;
  media_type: MediaType;
  tmdb_id: number;
  position?: number;
  title?: string;
  poster_path?: string;
};

export type TmdbMedia = {
  id: number;
  tmdb_id?: number;
  media_type?: MediaType | 'tv';
  type?: MediaType;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  year?: number | null;
  poster_path?: string | null;
  overview?: string;
  original_language?: string;
  vote_average?: number;
  genre_ids?: number[];
  genres?: Array<string | { id?: number; name?: string }>;
  reasons?: string[];
};

export type TmdbDetail = TmdbMedia & {
  runtime?: number | null;
  episode_run_time?: number[];
  genres?: Array<{ id: number; name: string }>;
  credits?: unknown;
  seasons?: unknown[];
};
