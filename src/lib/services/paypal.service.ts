/**
 * PayPal service — handles OAuth, orders, and subscription verification.
 * Uses PayPal REST API v2 directly (no SDK dependency on server).
 */

const PAYPAL_API = process.env.PAYPAL_API_URL ?? "https://api-m.sandbox.paypal.com"
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ""
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? ""

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`)
  }

  const data = await res.json()
  return data.access_token
}

/**
 * Create a PayPal order for a one-time destination purchase.
 */
export async function createDestinationOrder(
  destination: string,
  amount: string = "4.99",
  currency: string = "EUR"
): Promise<{ id: string; status: string }> {
  const token = await getAccessToken()

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: `Viaje360 — Acceso permanente a ${destination}`,
          amount: {
            currency_code: currency,
            value: amount,
          },
          custom_id: `dest:${destination.toLowerCase().trim()}`,
        },
      ],
      application_context: {
        brand_name: "Viaje360",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayPal create order failed: ${err}`)
  }

  return res.json()
}

/**
 * Capture a PayPal order after user approval.
 */
export async function captureOrder(
  orderId: string
): Promise<{
  id: string
  status: string
  payer?: { email_address?: string; name?: { given_name?: string } }
}> {
  const token = await getAccessToken()

  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayPal capture failed: ${err}`)
  }

  return res.json()
}

/**
 * Verify a PayPal subscription is active.
 */
export async function verifySubscription(
  subscriptionId: string
): Promise<{ id: string; status: string; plan_id?: string }> {
  const token = await getAccessToken()

  const res = await fetch(`${PAYPAL_API}/v1/billing/subscriptions/${subscriptionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`PayPal subscription verify failed: ${err}`)
  }

  return res.json()
}
