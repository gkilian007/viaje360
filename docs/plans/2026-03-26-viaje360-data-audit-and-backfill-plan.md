# Viaje360 Data Audit & Backfill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auditar la calidad real de los datos guardados en Viaje360, rellenar los huecos más importantes desde snapshots/versiones y dejar estable la siguiente fase de persistencia rica.

**Architecture:** La auditoría debe medir dos capas: (1) tablas operativas (`trips`, `itinerary_days`, `activities`) y (2) tablas de conocimiento/enriquecimiento (`activity_knowledge`, `itinerary_versions`, `trip_activity_events`). El backfill debe usar como fuente de verdad el snapshot más reciente de `itinerary_versions` para rehidratar campos ricos en `activities`, y `activity_knowledge` para persistir/servir imágenes y links verificados.

**Tech Stack:** Next.js route handlers, Supabase (`@supabase/supabase-js`), Node scripts via `tsx`, existing trip-learning services, SQL migrations.

---

### Task 1: Add a reproducible data quality audit script

**Files:**
- Create: `scripts/audit-data-quality.ts`
- Test: manual run via `node --import tsx scripts/audit-data-quality.ts`
- Reference: `src/lib/supabase/server.ts`, `src/lib/supabase/database.types.ts`

**Step 1: Write the script skeleton**

Create a standalone Node script that:
- reads `.env.local`
- connects to Supabase with service role
- prints JSON summary to stdout
- exits non-zero on connection/query failure

```ts
import fs from "node:fs"
import { createClient } from "@supabase/supabase-js"

function loadEnv(path = ".env.local") {
  const raw = fs.readFileSync(path, "utf8")
  return Object.fromEntries(
    raw.split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf("=")
        return [line.slice(0, idx), line.slice(idx + 1)]
      })
  )
}
```

**Step 2: Add audit queries**

The script must collect at least:
- counts for `trips`, `onboarding_profiles`, `itinerary_days`, `activities`, `activity_knowledge`, `itinerary_versions`, `trip_activity_events`, `adaptation_events`
- null/missing rates for `activities.address`, `activities.latitude`, `activities.longitude`, `activities.booked`, `activities.is_locked`
- null/missing rates for `activity_knowledge.official_url`, `booking_url`, `menu_url`, `image_query`
- metadata coverage for `activity_knowledge.metadata.image_url`, `metadata.resolved_url`, `metadata.description`
- a sample of 5 problematic rows per category

**Step 3: Print a stable report shape**

Output should be machine-friendly JSON like:

```json
{
  "generatedAt": "...",
  "counts": { "trips": 0 },
  "coverage": {
    "activities.latitude": { "missing": 0, "total": 0, "pct": 0 },
    "activity_knowledge.metadata.image_url": { "present": 0, "total": 0, "pct": 0 }
  },
  "samples": {
    "activities_missing_coordinates": [],
    "knowledge_missing_urls": []
  }
}
```

**Step 4: Run the script**

Run:

```bash
node --import tsx scripts/audit-data-quality.ts > /tmp/viaje360-audit.json && cat /tmp/viaje360-audit.json | head -80
```

Expected:
- valid JSON
- no secrets in output

**Step 5: Commit**

```bash
git add scripts/audit-data-quality.ts
git commit -m "feat: add Viaje360 data quality audit script"
```

---

### Task 2: Persist rich activity fields in the operational table

**Files:**
- Create: `supabase/migrations/20260326000100_activity_details_backfill_columns.sql`
- Modify: `src/lib/supabase/database.types.ts`
- Modify: `src/lib/services/trip.service.ts`
- Test: `node --import tsx scripts/audit-data-quality.ts`

**Step 1: Add missing columns to `activities`**

Migration should add if missing:
- `description text`
- `url text`
- `image_query text`
- `price_per_person numeric`
- `recommendation_reason text`

Optional but recommended:
- `link_type text`
- `image_url text`
- `image_source text`

**Step 2: Update TS types**

Extend `DbActivity` in `src/lib/supabase/database.types.ts` with the new fields.

**Step 3: Save the rich fields on itinerary insert**

In `src/lib/services/trip.service.ts`, update `insertItinerarySchedule()` so each inserted activity writes the new columns directly.

Minimal patch target:

```ts
        description: act.description ?? null,
        url: act.url ?? null,
        image_query: act.imageQuery ?? null,
        price_per_person: act.pricePerPerson ?? null,
        recommendation_reason: act.recommendationReason ?? null,
```

**Step 4: Verify new trips persist the fields**

Run one itinerary generation locally, then query Supabase for the inserted activities.

**Step 5: Commit**

```bash
git add supabase/migrations/20260326000100_activity_details_backfill_columns.sql src/lib/supabase/database.types.ts src/lib/services/trip.service.ts
git commit -m "feat: persist rich activity detail fields in activities table"
```

---

### Task 3: Backfill existing activities from itinerary version snapshots

**Files:**
- Create: `scripts/backfill-activities-from-versions.ts`
- Modify: `src/app/api/trips/active/route.ts` (only if needed after backfill)
- Test: `node --import tsx scripts/backfill-activities-from-versions.ts --dry-run`

**Step 1: Build a dry-run backfill script**

The script should:
- fetch all trips
- fetch the latest `itinerary_versions.snapshot` per trip
- match each DB activity by `(trip_id, day_number, sort_order)`
- compute updates for missing fields only
- support `--dry-run`

Fields to backfill:
- `description`
- `url`
- `image_query`
- `price_per_person`
- `recommendation_reason`
- `latitude`
- `longitude`
- `address`

**Step 2: Print a patch summary**

The dry run must print:
- how many activities can be patched
- how many remain unresolved
- example updates

**Step 3: Add write mode**

When run without `--dry-run`, update only missing/null fields.

**Step 4: Run dry-run first**

```bash
node --import tsx scripts/backfill-activities-from-versions.ts --dry-run
```

Expected:
- counts and examples
- no writes yet

**Step 5: Run real backfill**

```bash
node --import tsx scripts/backfill-activities-from-versions.ts
```

**Step 6: Re-run audit**

```bash
node --import tsx scripts/audit-data-quality.ts > /tmp/viaje360-audit-after.json
```

Expected:
- lower missing % for coordinates, description, urls, image_query

**Step 7: Commit**

```bash
git add scripts/backfill-activities-from-versions.ts
git commit -m "feat: backfill existing activities from itinerary version snapshots"
```

---

### Task 4: Persist and reuse verified image/link assets consistently

**Files:**
- Modify: `src/app/api/activity-assets/route.ts`
- Modify: `src/lib/services/trip-learning.ts`
- Modify: `src/lib/services/trip-learning.db.ts`
- Test: local API calls + audit script

**Step 1: Normalize asset persistence shape**

Decide one canonical structure in `activity_knowledge.metadata`:

```ts
{
  image_url: string | null,
  image_source: "wikipedia" | "google_places" | null,
  image_verified_at: string | null,
  resolved_url: string | null,
  resolved_url_type: "menu" | "booking" | "maps" | null,
  resolved_url_verified_at: string | null
}
```

**Step 2: Make `activity-assets` write assets every time it successfully resolves**

Ensure it upserts not only metadata but also:
- `official_url`
- `booking_url`
- `menu_url`
where appropriate.

**Step 3: Reuse persisted assets before external fetches**

Confirm route behavior order:
1. read cached metadata from `activity_knowledge`
2. if present, return immediately
3. only then hit Google Places / Wikipedia

**Step 4: Add audit coverage for asset cache hit rate**

Update the audit script to show:
- `activity_knowledge.metadata.image_url`
- `activity_knowledge.metadata.resolved_url`
- `% direct cache hits vs fresh resolutions` if available

**Step 5: Commit**

```bash
git add src/app/api/activity-assets/route.ts src/lib/services/trip-learning.ts src/lib/services/trip-learning.db.ts scripts/audit-data-quality.ts
git commit -m "feat: normalize and persist verified activity assets"
```

---

### Task 5: Add a lightweight admin/debug surface for current data health

**Files:**
- Create: `src/app/api/admin/data-audit/route.ts`
- Optional Create: `src/app/status/data/page.tsx`
- Reuse: `scripts/audit-data-quality.ts`

**Step 1: Add protected API route**

Return the same audit JSON from the script logic through a route handler.

**Step 2: Optional human-readable page**

A small internal page can show:
- counts
- top missing fields
- sample broken records
- last audit timestamp

**Step 3: Verify route**

Run:

```bash
curl -s http://localhost:3090/api/admin/data-audit | jq '.counts'
```

**Step 4: Commit**

```bash
git add src/app/api/admin/data-audit/route.ts src/app/status/data/page.tsx
git commit -m "feat: add internal data audit endpoint for Viaje360"
```

---

### Task 6: Verification and rollout checklist

**Files:**
- Modify: `docs/plans/2026-03-26-viaje360-data-audit-and-backfill-plan.md` (checklist only)
- Test: local + prod smoke checks

**Step 1: Verify locally**

Run:

```bash
npm test
npm run build
node --import tsx scripts/audit-data-quality.ts > /tmp/viaje360-audit.json
node --import tsx scripts/backfill-activities-from-versions.ts --dry-run
```

Expected:
- tests pass
- build passes
- audit JSON valid
- dry-run shows meaningful patch plan

**Step 2: Verify DB improvements after backfill**

Check for improvement in:
- `activities.latitude/longitude`
- `activities.description/url/image_query`
- `activity_knowledge.metadata.image_url`
- `activity_knowledge.metadata.resolved_url`

**Step 3: Verify UI**

Manual checks in app:
- open plan
- open 5 different detail modals
- confirm description, image, link, booked toggle, lock toggle
- refresh page and confirm data survives

**Step 4: Commit final integration**

```bash
git add -A
git commit -m "chore: complete Viaje360 data audit and backfill phase 1"
```
