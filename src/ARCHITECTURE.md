# FilmNote Frontend Architecture

The frontend is migrating from a single legacy script to Vue 3 + TypeScript.

## Current Phase

`src/main.ts` is the only HTML entrypoint. It mounts a Vue 3 app with Pinia, then `src/app/bootstrap.ts` installs shared globals for legacy compatibility, initializes Supabase, and loads the existing legacy scripts in their original order:

1. `tmdb-cache.js`
2. `recommend-ui.js`
3. `app.js`

This keeps current behavior stable while new code gains a clear module boundary. All product areas are now represented in the Vue feature registry as `legacy-backed` features:

1. `auth`
2. `ratings`
3. `list`
4. `stats`
5. `discover`
6. `couple`
7. `importExport`

Vite is now the development and production build path:

- `npm run dev`: local development server.
- `npm run typecheck`: `vue-tsc` checks for the new `src/` architecture layer.
- `npm run build`: typecheck plus production bundle into `dist/`.

GitHub Pages deploys the generated `dist/` artifact.

The main header, tab shell, toast, auth overlay, account modals, and import/export toolbar are now Vue-native. Legacy `app.js` publishes state snapshots through `window.FilmNoteState` and `filmnote:legacy-state`; `src/app/legacy-state-sync.ts` hydrates Pinia stores from those snapshots so each feature can be migrated without reading legacy globals directly.

Auth is partially migrated: login, register, password reset, recovery password, display-name setup, password change, invite management, and blocked-list management are rendered by Vue. Session bootstrapping, logout, profile finalization, and the broad data load still flow through the legacy bridge until ratings/list/discover/couple are migrated.

Ratings is partially migrated: the search panel and Quick Rate add/edit are now Vue-rendered. Search uses typed TMDB API helpers, selected-result actions call Vue Quick Rate and legacy list/Couple adapters, and Quick Rate writes through typed entry API helpers. Legacy `openQuickRate` / `openQuickEdit` first delegate to `window.FilmNoteVueRatings`, then fall back to the old modal if Vue is unavailable. The old full search form and detail-entry edit flows are still legacy-backed and hidden for compatibility.

## Module Direction

- `app/`: Vue root app and legacy bootstrap.
- `stores/`: Pinia stores for session, entries, lists, discover, couple, and legacy bridge state.
- `config/`: constants and deployment configuration.
- `api/`: Supabase and remote API access.
- `core/`: shared application state and cross-feature coordination.
- `shared/`: Vue components, composables, DOM helpers, cache, scoring, TMDB helpers, pure utilities.
- `features/`: business domains such as auth, ratings, list, discover, couple, stats, and import/export.

## Feature Lifecycle

- Each feature exports a `FeatureDefinition` from `src/features/*/feature.ts`.
- `src/features/registry.ts` is the complete list of app features.
- `src/app/FeatureArchitectureRoot.vue` mounts all feature boundaries after `window.FilmNoteLegacy` is ready.
- `src/app/legacy-state-sync.ts` keeps Pinia synchronized with the current legacy runtime state.
- A feature starts as `legacy-backed`, meaning Vue owns the boundary and state destination while legacy `app.js` still owns the behavior.
- When a feature is migrated to Vue, change its status to `vue-native` and remove the matching legacy render/event code.

## Migration Rules

- Do not add new behavior directly to `app.js` when a suitable `src/features/*` module exists.
- New UI should be Vue SFCs using the Composition API.
- Cross-feature state should go into Pinia stores instead of new top-level legacy variables.
- Feature-level commands should call the feature adapter, not raw `window.FilmNoteLegacy`.
- Move low-risk pure functions first, then API calls, then event/render logic.
- Keep DOM ids and CSS classes stable until the feature owning them has been fully migrated.
- Prefer explicit imports for new code. Use `window.FilmNote*` only for temporary legacy compatibility.
- Keep TypeScript coverage focused on `src/` until legacy behavior has been migrated out of `app.js`.
- Remove legacy event handlers/render functions only after their Vue feature replacement passes the manual regression path.
