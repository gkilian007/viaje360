#!/usr/bin/env node
/**
 * Backfill rich activity fields from itinerary_versions.snapshot
 *
 * Usage:
 *   node --import tsx scripts/backfill-activities-from-versions.ts --dry-run
 *   node --import tsx scripts/backfill-activities-from-versions.ts
 */

import fs from "node:fs"
import { createClient } from "@supabase/supabase-js"

function loadEnv(path = ".env.local") {
  const raw = fs.readFileSync(path, "utf8")
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => {
        const idx = line.indexOf("=")
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
      })
  )
}

const isDryRun = process.argv.includes("--dry-run")

interface SnapshotActivity {
  name?: string
  description?: string
  url?: string
  imageQuery?: string
  pricePerPerson?: number
  recommendationReason?: string
  lat?: number
  lng?: number
  address?: string
  location?: string
}

interface SnapshotDay {
  dayNumber: number
  activities: SnapshotActivity[]
}

interface Snapshot {
  days: SnapshotDay[]
}

interface DbActivityRow {
  id: string
  trip_id: string
  name: string
  day_id: string
  sort_order: number
  description: string | null
  url: string | null
  image_query: string | null
  price_per_person: number | null
  recommendation_reason: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
}

interface ItineraryVersion {
  id: string
  trip_id: string
  version_number: number
  snapshot: Snapshot
  created_at: string
}

interface ItineraryDay {
  id: string
  trip_id: string
  day_number: number
}

async function main() {
  const env = loadEnv()
  const url = env["NEXT_PUBLIC_SUPABASE_URL"]
  const key = env["SUPABASE_SERVICE_ROLE_KEY"]

  if (!url || !key) {
    console.error("Missing env vars")
    process.exit(1)
  }

  const supabase = createClient(url, key)

  console.log(`\n🔍 Viaje360 Activity Backfill ${isDryRun ? "(DRY RUN)" : "(WRITE MODE)"}`)
  console.log("─".repeat(60))

  // 1. Fetch all itinerary versions (latest per trip)
  const { data: versions, error: vErr } = await supabase
    .from("itinerary_versions")
    .select("id, trip_id, version_number, snapshot, created_at")
    .order("version_number", { ascending: false })

  if (vErr || !versions) {
    console.error("Error fetching itinerary_versions:", vErr?.message)
    process.exit(1)
  }

  // Keep only the latest version per trip
  const latestPerTrip = new Map<string, ItineraryVersion>()
  for (const v of versions as ItineraryVersion[]) {
    if (!latestPerTrip.has(v.trip_id)) {
      latestPerTrip.set(v.trip_id, v)
    }
  }
  console.log(`Found ${latestPerTrip.size} trips with snapshot versions`)

  // 2. Fetch all activities
  const { data: activities, error: aErr } = await supabase
    .from("activities")
    .select(
      "id, trip_id, name, day_id, sort_order, description, url, image_query, price_per_person, recommendation_reason, latitude, longitude, address"
    )

  if (aErr || !activities) {
    console.error("Error fetching activities:", aErr?.message)
    process.exit(1)
  }

  // 3. Fetch itinerary_days for day_number mapping
  const { data: days, error: dErr } = await supabase
    .from("itinerary_days")
    .select("id, trip_id, day_number")

  if (dErr || !days) {
    console.error("Error fetching itinerary_days:", dErr?.message)
    process.exit(1)
  }

  const dayNumberMap = new Map<string, number>()
  for (const d of days as ItineraryDay[]) {
    dayNumberMap.set(d.id, d.day_number)
  }

  // 4. Build update patches
  const patches: Array<{ id: string; updates: Record<string, unknown>; actName: string }> = []
  let unresolved = 0
  let alreadyFull = 0

  for (const act of activities as DbActivityRow[]) {
    // Check if this activity already has all fields
    const hasFull =
      act.description !== null &&
      act.url !== null &&
      act.image_query !== null

    if (hasFull) {
      alreadyFull++
      continue
    }

    const version = latestPerTrip.get(act.trip_id)
    if (!version) {
      unresolved++
      continue
    }

    const dayNumber = dayNumberMap.get(act.day_id)
    if (dayNumber === undefined) {
      unresolved++
      continue
    }

    const snapshotDay = version.snapshot.days.find((d) => d.dayNumber === dayNumber)
    if (!snapshotDay) {
      unresolved++
      continue
    }

    // Match activity by sort_order position
    const snapshotAct = snapshotDay.activities[act.sort_order]
    if (!snapshotAct) {
      unresolved++
      continue
    }

    // Build update with only missing fields
    const updates: Record<string, unknown> = {}

    if (!act.description && snapshotAct.description) {
      updates.description = snapshotAct.description
    }
    if (!act.url && snapshotAct.url) {
      updates.url = snapshotAct.url
    }
    if (!act.image_query && snapshotAct.imageQuery) {
      updates.image_query = snapshotAct.imageQuery
    }
    if (act.price_per_person === null && snapshotAct.pricePerPerson !== undefined) {
      updates.price_per_person = snapshotAct.pricePerPerson
    }
    if (!act.recommendation_reason && snapshotAct.recommendationReason) {
      updates.recommendation_reason = snapshotAct.recommendationReason
    }
    if (act.latitude === null && snapshotAct.lat !== undefined) {
      updates.latitude = snapshotAct.lat
    }
    if (act.longitude === null && snapshotAct.lng !== undefined) {
      updates.longitude = snapshotAct.lng
    }
    if (!act.address && (snapshotAct.address || snapshotAct.location)) {
      updates.address = snapshotAct.address ?? snapshotAct.location
    }

    if (Object.keys(updates).length > 0) {
      patches.push({ id: act.id, updates, actName: act.name })
    } else {
      unresolved++
    }
  }

  console.log(`\n📊 Patch Summary:`)
  console.log(`  Already complete: ${alreadyFull}`)
  console.log(`  Patchable:        ${patches.length}`)
  console.log(`  Unresolvable:     ${unresolved}`)
  console.log(`  Total:            ${(activities as DbActivityRow[]).length}`)

  if (patches.length > 0) {
    console.log(`\n📝 Example patches (first 3):`)
    for (const p of patches.slice(0, 3)) {
      console.log(`  [${p.actName.slice(0, 40)}]`)
      for (const [k, v] of Object.entries(p.updates)) {
        const val = String(v).slice(0, 60)
        console.log(`    ${k}: ${val}`)
      }
    }
  }

  if (isDryRun) {
    console.log("\n✅ Dry-run complete. No writes performed.")
    return
  }

  // 5. Write updates in batches
  console.log(`\n💾 Writing ${patches.length} updates...`)
  let updated = 0
  let errors = 0

  // Batch in groups of 50
  const BATCH_SIZE = 50
  for (let i = 0; i < patches.length; i += BATCH_SIZE) {
    const batch = patches.slice(i, i + BATCH_SIZE)
    for (const patch of batch) {
      const { error } = await supabase
        .from("activities")
        .update(patch.updates)
        .eq("id", patch.id)
      if (error) {
        console.error(`  Error updating ${patch.id}:`, error.message)
        errors++
      } else {
        updated++
      }
    }
    process.stdout.write(`\r  Progress: ${updated}/${patches.length}`)
  }

  console.log(`\n\n✅ Backfill complete: ${updated} updated, ${errors} errors`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
