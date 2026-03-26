#!/usr/bin/env node
/**
 * Apply SQL migration via Supabase REST API (pg_execute workaround)
 * Usage: node --import tsx scripts/run-migration-via-api.ts
 */

import fs from "node:fs"

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

const MIGRATION_SQL = `
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS url text,
  ADD COLUMN IF NOT EXISTS image_query text,
  ADD COLUMN IF NOT EXISTS price_per_person numeric,
  ADD COLUMN IF NOT EXISTS recommendation_reason text,
  ADD COLUMN IF NOT EXISTS link_type text,
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_source text;
`

async function main() {
  const env = loadEnv()
  const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"]
  const serviceKey = env["SUPABASE_SERVICE_ROLE_KEY"]

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing env vars")
    process.exit(1)
  }

  // Extract project ref from URL: https://xhwkigbrdgojtesbztec.supabase.co
  const projectRef = supabaseUrl.replace("https://", "").split(".")[0]
  console.log("Project ref:", projectRef)

  // Use Supabase Management API to run SQL
  const mgmtUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`
  
  console.log("Attempting Supabase Management API...")
  const resp = await fetch(mgmtUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: MIGRATION_SQL }),
  })

  if (resp.ok) {
    const data = await resp.json()
    console.log("✓ Migration applied via Management API:", JSON.stringify(data))
    return
  }

  console.log(`Management API returned ${resp.status}: ${await resp.text()}`)

  // Fallback: Try using the pg_execute function if it exists
  console.log("Trying pg_execute RPC fallback...")
  const rpcUrl = `${supabaseUrl}/rest/v1/rpc/pg_execute`
  const rpcResp = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: MIGRATION_SQL }),
  })

  if (rpcResp.ok) {
    const data = await rpcResp.json()
    console.log("✓ Migration applied via pg_execute:", JSON.stringify(data))
    return
  }

  console.log(`pg_execute returned ${rpcResp.status}: ${await rpcResp.text()}`)

  // Last resort: use the Supabase REST API to check if columns exist
  console.log("\nChecking if columns already exist via REST...")
  const checkUrl = `${supabaseUrl}/rest/v1/activities?select=description,url,image_query,price_per_person,recommendation_reason&limit=1`
  const checkResp = await fetch(checkUrl, {
    headers: {
      "apikey": serviceKey,
      "Authorization": `Bearer ${serviceKey}`,
    },
  })
  
  if (checkResp.ok) {
    console.log("✓ Columns already exist!")
    return
  }
  
  console.error("✗ Columns don't exist and couldn't apply migration automatically.")
  console.log("\n⚠️  Please run this SQL manually in the Supabase SQL editor:")
  console.log(MIGRATION_SQL)
  process.exit(1)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
