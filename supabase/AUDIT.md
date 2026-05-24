# Supabase RLS Audit

This audit is a verification workflow, not a migration. The current local environment does not have the Supabase CLI installed, so live database results are not recorded in this repository yet.

## How To Run

Run the audit SQL against the target Supabase project:

```sh
supabase db query -f supabase/rls_audit.sql
```

If the Supabase CLI is unavailable, paste the contents of `supabase/rls_audit.sql` into the Supabase SQL editor for the production project.

## Required Tables

The following public tables are app-facing and must be checked:

- `entries`
- `season_ratings`
- `watchlist_movies`
- `blocked_movies`
- `couples`
- `couple_watch_queue`
- `invite_codes`
- `user_preferences`

## Pass Criteria

- Every required public table exists or is intentionally absent from the deployed schema.
- Every existing required public table has `rls_enabled = true`.
- Policies exist for each app-facing read/write path used by the Vue client.
- Private user-owned rows can only be read or changed by their owner.
- Couple-shared rows are visible only to the two accepted couple members.
- Invite-code and couple-binding policies do not allow arbitrary authenticated users to claim or inspect unrelated rows.
- Any `security definer` helper is reviewed before further schema changes; privileged helpers should move out of exposed schemas when practical.

## Manual Verification Scenarios

- User A cannot read or mutate User B private `entries`, `season_ratings`, `watchlist_movies`, `blocked_movies`, or `user_preferences`.
- User A and User B can read only the Couple data that belongs to their accepted relationship.
- A non-member cannot read or mutate `couple_watch_queue` rows for another Couple.
- Expired, used, or unrelated invite codes cannot bind a Couple.
- Updates that should be allowed have both matching `SELECT` and `UPDATE` policies, because PostgreSQL RLS requires row visibility before update.

## Result Recording

After a live audit is run, add a dated note here with:

- Supabase project reference or environment name.
- Date and operator.
- Whether all required tables had RLS enabled.
- Policy gaps found and the migration or SQL used to close them.
