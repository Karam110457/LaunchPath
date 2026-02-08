# Waitlist backend audit (LaunchPath Supabase)

**Date:** 2026-02  
**Project:** LaunchPath (`zpsavoyotyqlnepqkwkj`), region eu-west-1

## Supabase schema: `public.waitlist`

| Column            | Type      | Nullable | Default     | Notes                                      |
|------------------|-----------|----------|-------------|--------------------------------------------|
| id               | uuid      | no       | gen_random_uuid() | Primary key                         |
| email            | text      | no       | —           | Unique                                    |
| created_at       | timestamptz | no     | now()       |                                            |
| status           | text      | yes      | 'pending'   | Check: pending, invited, joined            |
| source           | text      | yes      | —           | e.g. homepage_v1                           |
| source_page      | text      | yes      | 'homepage'  |                                            |
| role_stage       | text      | yes      | —           | User-selected stage from step 2            |
| biggest_blocker  | text      | yes      | —           | Free text from step 2 (max 500 chars)      |
| step2_completed  | boolean   | yes      | false       | True when user completed or skipped step 2 |

**RLS:** Enabled on `waitlist`.

## Saving behaviour

- **Step 1 (join waitlist):** `join-waitlist` inserts a row with `email`, `source`, `source_page`. `role_stage`, `biggest_blocker`, and `step2_completed` stay at default (null / false).
- **Step 2 (qualification):** `complete-waitlist-step2` updates the row for that `email` with:
  - `role_stage` — value from the stage dropdown (or null if skipped)
  - `biggest_blocker` — trimmed, max 500 chars (or null if skipped)
  - `step2_completed` — set to `true` whether they submit or skip

So we do save both **stage** and **biggest blocker** when the user submits step 2; if they skip, both are stored as null and `step2_completed` is still set to true.

## Stage dropdown values (stored in `role_stage`)

- `dont_know_start` — Don't know where to start
- `exploring` — Just exploring
- `building_side` — Building something on the side
- `ready_first_client` — Ready to get first client
- `have_clients_scale` — Already have clients, want to scale
- `other` — Other

Empty string is not stored (treated as null when skipped or when placeholder is “selected”).
