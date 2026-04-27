import { NextRequest } from "next/server"
import { z } from "zod"
import { parseSearchParams, successResponse, normalizeRouteError } from "@/lib/api/route-helpers"
import { assessMadridTransportFit, decideMadridSegmentMode, estimateMadridDoorToDoor, getMadridRecommendedMode, getMadridTransportKnowledge, type MadridTransportProfileContext } from "@/lib/services/madrid-transport-knowledge"

const querySchema = z.object({
  destination: z.string().min(1),
  q: z.string().optional().default(""),
  limit: z.coerce.number().int().min(1).max(12).optional().default(6),
  mobility: z.string().optional().default(""),
  kidsPets: z.string().optional().default(""),
  transport: z.string().optional().default(""),
  luggageLevel: z.enum(["light", "medium", "heavy"]).optional().default("light"),
  distanceMeters: z.coerce.number().int().min(100).max(12000).optional().default(900),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "night"]).optional().default("afternoon"),
})

function buildTransportBadge(
  item: Awaited<ReturnType<typeof getMadridTransportKnowledge>>[number],
  profileContext?: MadridTransportProfileContext
) {
  const meta = item.metadata ?? {}
  const fit = assessMadridTransportFit(item, profileContext)
  const mode = typeof meta.mode === "string" ? meta.mode : item.category
  const zone = typeof meta.zone === "string" ? meta.zone : null
  const accessibility = typeof meta.accessibility_status === "string" ? meta.accessibility_status : null
  const lines = Array.isArray(meta.lines) ? meta.lines.slice(0, 4).join(" · ") : null

  return {
    name: item.name,
    category: item.category,
    mode,
    zone,
    accessibility,
    lines,
    officialUrl: item.officialUrl,
    note: typeof meta.note === "string" ? meta.note : null,
    tags: item.tags,
    fitLabel: fit.fitLabel,
    extraMinutes: fit.extraMinutes,
    fitReasons: fit.reasons,
  }
}

export async function GET(req: NextRequest) {
  try {
    const input = parseSearchParams(req.nextUrl.searchParams, querySchema)
    if (input.destination.trim().toLowerCase() !== "madrid") {
      return successResponse({ items: [], provider: "unsupported-destination" })
    }

    const profileContext: MadridTransportProfileContext = {
      mobility: input.mobility || null,
      kidsPets: input.kidsPets ? input.kidsPets.split(",").map((v) => v.trim()).filter(Boolean) : [],
      transport: input.transport ? input.transport.split(",").map((v) => v.trim()).filter(Boolean) : [],
      luggageLevel: input.luggageLevel,
    }

    const items = await getMadridTransportKnowledge({
      queryTerms: input.q ? [input.q] : ["centro", "tourist", "museum", "shopping"],
      limit: input.limit,
      profileContext,
    })

    return successResponse({
      items: items.map((item) => {
        const badge = buildTransportBadge(item, profileContext)
        const estimate = estimateMadridDoorToDoor(item, {
          distanceMeters: input.distanceMeters,
          timeOfDay: input.timeOfDay,
          profileContext,
        })
        return {
          ...badge,
          recommendedMode: getMadridRecommendedMode(item, profileContext),
          segmentDecision: decideMadridSegmentMode(item, {
            distanceMeters: input.distanceMeters,
            timeOfDay: input.timeOfDay,
            profileContext,
          }),
          doorToDoor: estimate,
        }
      }),
      provider: "supabase-or-local-seed",
    })
  } catch (error) {
    return normalizeRouteError(error, "Failed to load destination transport", {
      route: "/api/destination-transport",
    })
  }
}
