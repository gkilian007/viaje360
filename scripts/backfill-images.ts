#!/usr/bin/env node
/**
 * Backfill images for activity_knowledge entries missing metadata.image_url.
 * Uses Wikipedia API (same as /api/activity-assets).
 * Rate limited to ~500ms between requests.
 *
 * Usage:
 *   node --import tsx scripts/backfill-images.ts --dry-run
 *   node --import tsx scripts/backfill-images.ts
 */

import fs from "node:fs"
import { createClient } from "@supabase/supabase-js"

function loadEnv(path = ".env.local") {
  const raw = fs.readFileSync(path, "utf8")
  return Object.fromEntries(
    raw.split(/\r?\n/).filter(l => l.trim() && !l.startsWith("#"))
      .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
  )
}

const isDryRun = process.argv.includes("--dry-run")
const DELAY = 600
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function fetchWikipediaImage(searchTerm: string): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      action: "query", format: "json", origin: "*",
      gsrsearch: searchTerm, generator: "search", gsrlimit: "1",
      prop: "pageimages", piprop: "thumbnail", pithumbsize: "800",
    })
    const res = await fetch(`${WIKIPEDIA_API}?${params}`, { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    const pages = data.query?.pages
    if (!pages) return null
    const page = Object.values(pages)[0] as { thumbnail?: { source?: string } }
    return page?.thumbnail?.source ?? null
  } catch { return null }
}

async function main() {
  const env = loadEnv()
  const supabase = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"])

  console.log(`\n🖼️  Image Backfill ${isDryRun ? "(DRY RUN)" : "(WRITE MODE)"}`)
  console.log("─".repeat(60))

  // Fetch all activity_knowledge
  const { data: entries, error } = await supabase
    .from("activity_knowledge")
    .select("id, canonical_name, destination, image_query, metadata")
    .order("canonical_name")

  if (error || !entries) { console.error("Error:", error?.message); process.exit(1) }

  // Filter entries without cached image
  const needsImage = entries.filter(e => {
    const meta = (e.metadata ?? {}) as Record<string, unknown>
    return !meta.image_url
  })

  console.log(`Total knowledge entries: ${entries.length}`)
  console.log(`Already have image: ${entries.length - needsImage.length}`)
  console.log(`Need image resolution: ${needsImage.length}`)
  console.log(`Estimated time: ~${Math.ceil(needsImage.length * DELAY / 60000)} minutes\n`)

  if (isDryRun) {
    console.log("Sample entries needing images:")
    for (const e of needsImage.slice(0, 10)) {
      console.log(`  - ${e.canonical_name} (${e.destination}) [query: ${e.image_query ?? "name"}]`)
    }
    console.log("\n✅ Dry-run complete.")
    return
  }

  let resolved = 0, failed = 0, errors = 0

  for (const entry of needsImage) {
    const searchTerm = entry.image_query || entry.canonical_name
    await sleep(DELAY)

    let imageUrl = await fetchWikipediaImage(searchTerm)

    // Fallback: try canonical name if imageQuery failed
    if (!imageUrl && entry.image_query && entry.image_query !== entry.canonical_name) {
      await sleep(DELAY)
      imageUrl = await fetchWikipediaImage(entry.canonical_name)
    }

    // Fallback: try with destination
    if (!imageUrl) {
      await sleep(DELAY)
      imageUrl = await fetchWikipediaImage(`${entry.canonical_name} ${entry.destination}`)
    }

    if (imageUrl) {
      resolved++
      const meta = (entry.metadata ?? {}) as Record<string, unknown>
      const { error: upErr } = await supabase
        .from("activity_knowledge")
        .update({
          metadata: {
            ...meta,
            image_url: imageUrl,
            image_source: "wikipedia",
            image_verified_at: new Date().toISOString(),
          }
        })
        .eq("id", entry.id)
      if (upErr) errors++

      // Also update the activities table image_url for matching activities
      await supabase
        .from("activities")
        .update({ image_url: imageUrl, image_source: "wikipedia" })
        .ilike("name", entry.canonical_name)
    } else {
      failed++
    }

    const total = resolved + failed
    if (total % 20 === 0 || total === needsImage.length) {
      process.stdout.write(`\r  Progress: ${total}/${needsImage.length} (${resolved} ok, ${failed} fail)`)
    }
  }

  console.log(`\n\n📊 Results:`)
  console.log(`  Images resolved:  ${resolved}/${needsImage.length}`)
  console.log(`  Failed:           ${failed}/${needsImage.length}`)
  console.log(`  DB errors:        ${errors}`)
  console.log(`\n✅ Backfill complete.`)
}

main().catch(err => { console.error("Fatal:", err); process.exit(1) })
