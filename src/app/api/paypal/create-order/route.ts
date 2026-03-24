import { NextRequest } from "next/server"
import { successResponse, normalizeRouteError } from "@/lib/api/route-helpers"
import { createDestinationOrder } from "@/lib/services/paypal.service"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { destination, amount, currency } = body

    if (!destination) {
      return successResponse({ error: "destination required" }, 400)
    }

    const order = await createDestinationOrder(
      destination,
      amount ?? "4.99",
      currency ?? "EUR"
    )

    return successResponse({ orderId: order.id, status: order.status })
  } catch (error) {
    console.error("PayPal create-order error:", error)
    return normalizeRouteError(error, "Failed to create PayPal order")
  }
}
