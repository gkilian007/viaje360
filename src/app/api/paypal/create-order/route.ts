import { NextRequest } from "next/server"
import { errorResponse } from "@/lib/api/route-helpers"

// PayPal integration is not yet active.
// Configure NEXT_PUBLIC_PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to enable it.
// Currently all payments go through Stripe (/api/stripe/create-checkout-session).

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_req: NextRequest) {
  return errorResponse(
    "INTERNAL_ERROR",
    "PayPal integration is not active. Please use Stripe checkout.",
    501
  )
}
