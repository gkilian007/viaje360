import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { processNightlyEmails } from "@/lib/services/nightly-email"

export const dynamic = "force-dynamic"

/**
 * Nightly cron (20:00 UTC): sends the "tu día de mañana" summary email to
 * owners of trips that have a planned day tomorrow.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get("authorization")

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    const nightly = await processNightlyEmails(supabase)
    return NextResponse.json({ ok: true, nightly })
  } catch (error) {
    console.error("[cron/nightly] failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
