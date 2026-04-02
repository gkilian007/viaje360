import { resolveAccess, type AccessResult } from "@/lib/services/access.service"
import { errorResponse } from "@/lib/api/route-helpers"

type AccessCapability = "canGenerate" | "canAdapt" | "canDiary"

/**
 * Server-side access guard for API routes.
 * Returns the AccessResult if authorized, or a 403 Response if not.
 */
export async function requireAccess(
  userId: string | null,
  destination: string,
  capability: AccessCapability,
  tripStartDate?: string | null
): Promise<{ ok: true; access: AccessResult } | { ok: false; response: Response }> {
  const access = await resolveAccess(userId, destination, tripStartDate)

  if (!access.hasAccess || !access[capability]) {
    return {
      ok: false,
      response: errorResponse(
        "UNAUTHORIZED",
        access.reason === "expired"
          ? "Tu periodo de prueba ha expirado. Mejora tu plan para continuar."
          : "Acceso no disponible para esta función.",
        403
      ),
    }
  }

  return { ok: true, access }
}
