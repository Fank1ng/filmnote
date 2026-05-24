# Supabase Migrations

The migration files in `supabase/migrations/` mirror the existing root SQL upgrade scripts in execution order. Root-level copies are kept for existing manual deployment workflows.

Recommended order:

1. `202605240001_base_constraints.sql`
2. `202605240002_entries_upgrade.sql`
3. `202605240003_media_type_upgrade.sql`
4. `202605240004_couple_upgrade.sql`
5. `202605240005_couple_disconnect_request.sql`
6. `202605240006_list_rules_upgrade.sql`

Security notes:

- Public tables touched by the app should have RLS enabled before granting browser access.
- Current policies intentionally allow signed-in users to read shared rating data for comparison.
- Security-definer functions in `public` should be reviewed before the next schema change; if possible, move privileged helpers to a private schema and expose only safe RPC surfaces.
