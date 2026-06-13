/**
 * Admin savings metrics API endpoint
 * GET /api/admin/metrics
 *
 * Returns library-reuse and cache-hit rates plus estimated API savings.
 * Protected by SUPABASE_SERVICE_ROLE_KEY (internal use only).
 */

import { NextRequest } from "next/server"
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { successResponse, normalizeRouteError } from "@/lib/api/route-helpers"
import { fetchSavingsReport, type SavingsQueryClient } from "@/lib/services/savings-metrics"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!token || !serviceKey || token !== serviceKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!isSupabaseConfigured()) {
      return successResponse({ error: "Supabase not configured" })
    }

    const supabase = createServiceClient() as unknown as SavingsQueryClient
    const report = await fetchSavingsReport(supabase)

    return successResponse({ generatedAt: new Date().toISOString(), ...report })
  } catch (error) {
    return normalizeRouteError(error, "Savings metrics failed")
  }
}
