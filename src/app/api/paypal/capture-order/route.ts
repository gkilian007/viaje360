import { NextRequest } from "next/server"
import { successResponse, normalizeRouteError } from "@/lib/api/route-helpers"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { captureOrder } from "@/lib/services/paypal.service"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, destination } = body

    if (!orderId || !destination) {
      return successResponse({ error: "orderId and destination required" }, 400)
    }

    // Capture the payment with PayPal
    const capture = await captureOrder(orderId)

    if (capture.status !== "COMPLETED") {
      return successResponse({ error: "Payment not completed", status: capture.status }, 400)
    }

    // Record the purchase in Supabase
    const identity = await resolveRequestIdentity()
    if (identity.userId) {
      const supabase = createServiceClient()
      const dest = destination.toLowerCase().trim()

      await supabase.from("destination_purchases").upsert(
        {
          user_id: identity.userId,
          destination: dest,
          stripe_payment_intent_id: orderId, // reusing column for PayPal order ID
          amount: 4.99,
          currency: "EUR",
          purchased_at: new Date().toISOString(),
        },
        { onConflict: "user_id,destination" }
      )
    }

    return successResponse({
      status: "completed",
      destination,
      payer: capture.payer?.email_address ?? null,
    })
  } catch (error) {
    console.error("PayPal capture-order error:", error)
    return normalizeRouteError(error, "Failed to capture PayPal payment")
  }
}
