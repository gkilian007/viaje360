import { NextRequest } from "next/server"
import { z } from "zod"
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { rateLimit } from "@/lib/rate-limit"
import { sendEmail } from "@/lib/services/email.service"
import {
  successResponse,
  errorResponse,
  parseJsonBody,
  normalizeRouteError,
} from "@/lib/api/route-helpers"

const MAX_INVITES_PER_USER = 3

const inviteSchema = z.object({
  email: z.email().max(320),
})

function buildInviteEmailHtml(): string {
  return `
    <div style="font-family: Inter, system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1C1C1E;">
      <h2 style="color: #0A84FF; margin-bottom: 8px;">Te han invitado a Viaje360</h2>
      <p>Un viajero de la beta privada de Viaje360 te ha invitado a unirte.</p>
      <p>Viaje360 crea itinerarios de viaje personalizados con IA: planifica tu próximo viaje día a día en segundos.</p>
      <p style="margin: 24px 0;">
        <a href="https://viaje360.app/login" style="background: #0A84FF; color: #fff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">Crear mi cuenta</a>
      </p>
      <p style="font-size: 12px; color: #8E8E93;">Regístrate con este mismo email para que la invitación sea válida.</p>
    </div>
  `
}

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "beta-invite", 10, "1 d")
    if (!limited.ok && limited.response) return limited.response

    const body = await parseJsonBody(req, inviteSchema)

    const identity = await resolveRequestIdentity()
    if (!identity.isAuthenticated || !identity.userId) {
      return errorResponse("UNAUTHORIZED", "Inicia sesión para enviar invitaciones", 401)
    }

    if (!isSupabaseConfigured()) {
      return errorResponse("CONFIG_ERROR", "Supabase no está configurado", 503)
    }

    const supabase = createServiceClient()
    const email = body.email.toLowerCase()

    const { count, error: countError } = await supabase
      .from("beta_invites")
      .select("id", { count: "exact", head: true })
      .eq("invited_by", identity.userId)
    if (countError) {
      throw new Error(`Error consultando invitaciones: ${countError.message}`)
    }

    const used = count ?? 0
    if (used >= MAX_INVITES_PER_USER) {
      return errorResponse(
        "TOO_MANY_REQUESTS",
        "Has usado todas tus invitaciones",
        429
      )
    }

    const { error: insertError } = await supabase
      .from("beta_invites")
      .insert({ email, invited_by: identity.userId })
    // 23505 = unique violation: ese email ya tiene invitación
    if (insertError && insertError.code === "23505") {
      return successResponse({
        invited: false,
        alreadyInvited: true,
        remaining: MAX_INVITES_PER_USER - used,
      })
    }
    if (insertError) {
      throw new Error(`Error guardando invitación: ${insertError.message}`)
    }

    // sendEmail nunca lanza; si falla, la invitación sigue siendo válida
    await sendEmail(email, "Te han invitado a la beta de Viaje360", buildInviteEmailHtml())

    return successResponse({
      invited: true,
      alreadyInvited: false,
      remaining: MAX_INVITES_PER_USER - used - 1,
    })
  } catch (error) {
    return normalizeRouteError(error, "No se pudo enviar la invitación", {
      route: "/api/beta/invite",
    })
  }
}
