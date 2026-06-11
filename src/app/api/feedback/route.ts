import { NextRequest } from "next/server"
import { z } from "zod"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  normalizeRouteError,
} from "@/lib/api/route-helpers"

const feedbackSchema = z.object({
  category: z.enum(["bug", "idea", "otro"]),
  message: z.string().trim().min(3).max(2000),
  pagePath: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "feedback", 10, "1 d")
    if (!limited.ok && limited.response) return limited.response

    const body = await parseJsonBody(req, feedbackSchema)

    if (!isSupabaseConfigured()) {
      return errorResponse("CONFIG_ERROR", "Supabase no está configurado", 503)
    }

    const identity = await resolveRequestIdentity()
    const supabase = createServiceClient()
    const { error } = await supabase.from("app_feedback").insert({
      user_id: identity.userId ?? null,
      category: body.category,
      message: body.message,
      page_path: body.pagePath ?? null,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    })
    if (error) {
      throw new Error(`Error guardando feedback: ${error.message}`)
    }

    return successResponse({ received: true })
  } catch (error) {
    return normalizeRouteError(error, "No se pudo guardar el feedback", {
      route: "/api/feedback",
    })
  }
}
