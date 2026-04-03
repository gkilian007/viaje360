/**
 * POST /api/proactive/evaluate
 *
 * Evaluates proactive insights for a trip.
 * Called by the cron worker or client-side for in-app banners.
 */

import { NextRequest } from "next/server"
import { rateLimit } from "@/lib/rate-limit"
import { successResponse, errorResponse, normalizeRouteError } from "@/lib/api/route-helpers"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { evaluateProactiveInsights } from "@/lib/services/proactive-engine"

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, "proactive-evaluate", 10, "1 m")
  if (!rl.ok) return rl.response!

  try {
    const body = await req.json()
    const { tripId, context = "anytime" } = body as {
      tripId?: string
      context?: "evening" | "morning" | "postday" | "anytime"
    }

    if (!tripId) {
      return errorResponse("VALIDATION_ERROR", "tripId required", 400)
    }

    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401)
    }

    const insights = await evaluateProactiveInsights({
      tripId,
      userId: identity.userId,
      context,
    })

    return successResponse({ insights })
  } catch (error) {
    return normalizeRouteError(error, "Failed to evaluate proactive insights")
  }
}
