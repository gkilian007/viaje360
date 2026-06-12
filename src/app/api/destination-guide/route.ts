import { NextRequest } from "next/server"
import { z } from "zod"
import {
  errorResponse,
  normalizeRouteError,
  parseSearchParams,
  successResponse,
} from "@/lib/api/route-helpers"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { getDestinationGuide } from "@/lib/services/destination-guide.service"

export const maxDuration = 60

const querySchema = z.object({
  destination: z.string().trim().min(2).max(80),
})

export async function GET(req: NextRequest) {
  try {
    const { destination } = parseSearchParams(req.nextUrl.searchParams, querySchema)

    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return errorResponse("UNAUTHORIZED", "Authentication required", 401)
    }

    const result = await getDestinationGuide(destination)
    return successResponse(result)
  } catch (error) {
    return normalizeRouteError(error, "Failed to load destination guide", {
      route: "/api/destination-guide",
    })
  }
}
