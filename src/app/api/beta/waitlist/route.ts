import { NextRequest } from "next/server"
import { z } from "zod"
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  normalizeRouteError,
} from "@/lib/api/route-helpers"

const waitlistSchema = z.object({
  email: z.email().max(320),
})

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "beta-waitlist", 10, "1 d")
    if (!limited.ok && limited.response) return limited.response

    const body = await parseJsonBody(req, waitlistSchema)

    if (!isSupabaseConfigured()) {
      return errorResponse("CONFIG_ERROR", "Supabase no está configurado", 503)
    }

    const supabase = createServiceClient()
    const { error } = await supabase
      .from("beta_waitlist")
      .insert({ email: body.email.toLowerCase() })
    // 23505 = unique violation: already on the waitlist, treat as success
    if (error && error.code !== "23505") {
      throw new Error(`Error guardando email en lista de espera: ${error.message}`)
    }

    return successResponse({ joined: true })
  } catch (error) {
    return normalizeRouteError(error, "No se pudo guardar tu email", {
      route: "/api/beta/waitlist",
    })
  }
}
