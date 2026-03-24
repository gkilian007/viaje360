import { NextRequest } from "next/server"
import { successResponse, normalizeRouteError } from "@/lib/api/route-helpers"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { verifySubscription } from "@/lib/services/paypal.service"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { subscriptionId } = body

    if (!subscriptionId) {
      return successResponse({ error: "subscriptionId required" }, 400)
    }

    // Verify with PayPal
    const sub = await verifySubscription(subscriptionId)

    if (sub.status !== "ACTIVE") {
      return successResponse({ error: "Subscription not active", status: sub.status }, 400)
    }

    // Record in Supabase
    const identity = await resolveRequestIdentity()
    if (identity.userId) {
      const supabase = createServiceClient()
      const oneYearFromNow = new Date()
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

      await supabase.from("user_subscriptions").insert({
        user_id: identity.userId,
        plan: "annual",
        status: "active",
        stripe_subscription_id: subscriptionId, // reusing column for PayPal sub ID
        started_at: new Date().toISOString(),
        expires_at: oneYearFromNow.toISOString(),
      })
    }

    return successResponse({
      status: "active",
      subscriptionId,
    })
  } catch (error) {
    console.error("PayPal confirm-subscription error:", error)
    return normalizeRouteError(error, "Failed to confirm subscription")
  }
}
