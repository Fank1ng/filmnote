# FilmNote Architecture

FilmNote is a Vue 3 + TypeScript + Pinia application backed by Supabase and a Cloudflare Worker. The runtime entry is `src/main.ts`, which imports the app stylesheet, initializes app configuration and Supabase, mounts `App.vue`, and lets Vue own the full UI tree.

## Frontend Runtime

- `index.html` contains only the Vue root and Vite module entry. Supabase is loaded from the npm package, not a CDN global.
- `src/config/constants.ts` reads public runtime configuration from Vite env values, with current production defaults for local compatibility.
- `src/app/bootstrap.ts` initializes frontend configuration and the Supabase client.
- `src/app/session.ts` restores Supabase auth state, manages profile/session-token checks, and refreshes Pinia data.
- `src/app/data-sync.ts` is the shared refresh path for entries, season ratings, profiles, watchlist, blocked movies, Couple state, and queue.
- `src/styles/index.css` contains only global base tokens/reset. App layout styles live with `App.vue`, feature styles are imported from each feature module, and shared UI styles live under `src/shared/styles/`.

## State And Features

- Pinia stores are the source of truth for session, entries, lists, discover, Couple, UI state, list controls, and stats controls.
- Feature modules under `src/features/` render Vue-native search, ratings, list, discover, Couple, stats, auth, account, and import/export flows.
- API modules under `src/api/` are the only database mutation/read layer for Supabase-backed features.
- Shared UI, scoring, TMDB detail/cache helpers, browser platform helpers, browser-side composables, media actions, and pagination live under `src/shared/`.

## Backend Runtime

- Supabase handles Auth and Postgres persistence; browser code uses the typed Supabase client directly.
- Cloudflare Worker lives under `worker/` and exposes TMDB proxy, detail aggregation, recommendation, cache warming, and scheduled IMDb Top100 refresh endpoints.
- Worker runtime entry is `worker/src/index.ts`; routing, HTTP helpers, cache, TMDB access, IMDb Top100 refresh, request normalization, and recommendation scoring are separated into focused modules.
- Database upgrade scripts are organized under `supabase/migrations/` in execution order. Root-level SQL files are retained as compatibility copies.
- Supabase RLS verification is documented in `supabase/AUDIT.md`; `supabase/rls_audit.sql` is the runnable audit query for production checks.

## Legacy Removal

The former plain-script runtime, cache shim, recommendation shim, bridge, state sync, and feature adapter layer have been removed from the runtime. `movie-rater.html` is retained only as a static redirect for old links. New behavior should be implemented with explicit imports, Pinia state, composables, and typed API helpers.
