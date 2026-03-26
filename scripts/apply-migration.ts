#!/usr/bin/env node
/**
 * Apply SQL migration directly via Supabase service role
 * Usage: node --import tsx scripts/apply-migration.ts <migration-file>
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

async function main() {
  const migrationFile = process.argv[2]
  if (!migrationFile) {
    console.error("Usage: node --import tsx scripts/apply-migration.ts <migration-file>")
    process.exit(1)
  }

  const env = loadEnv()
  const url = env["NEXT_PUBLIC_SUPABASE_URL"]
  const key = env["SUPABASE_SERVICE_ROLE_KEY"]

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const sql = fs.readFileSync(migrationFile, "utf8")
  console.log(`Applying migration: ${migrationFile}`)
  console.log("SQL:", sql.slice(0, 200), "...")

  // Use the Supabase REST API to run arbitrary SQL
  const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ sql }),
  })

  if (!response.ok) {
    // Try via pg directly
    console.log("REST RPC not available, trying direct query approach...")
    const supabase = createClient(url, key)
    
    // Execute each statement separately
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--") && !s.startsWith("COMMENT"))

    for (const stmt of statements) {
      if (!stmt) continue
      console.log("Executing:", stmt.slice(0, 80))
      const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" })
      if (error) {
        console.error("Error:", error.message)
      } else {
        console.log("✓ OK")
      }
    }
  } else {
    const data = await response.json()
    console.log("✓ Migration applied:", data)
  }
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
