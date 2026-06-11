import * as Sentry from "@sentry/nextjs"
import { NextRequest } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/rate-limit"
import {
  errorResponse,
  normalizeRouteError,
  parseJsonBody,
  successResponse,
} from "@/lib/api/route-helpers"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { mapToAppTypes } from "@/lib/services/itinerary.service"
import { createTrip } from "@/lib/services/trip.service"
import { createServiceClient } from "@/lib/supabase/server"
import type { GeneratedItinerary } from "@/lib/supabase/database.types"

const claimActivitySchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  location: z.string().optional(),
  time: z.string().optional(),
  duration: z.number().optional(),
  cost: z.number().optional(),
  isLocked: z.boolean().optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  url: z.string().optional(),
  pricePerPerson: z.number().optional(),
  imageQuery: z.string().optional(),
  recommendationReason: z.string().optional(),
  indoor: z.boolean().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

const claimRequestSchema = z.object({
  trip: z.object({
    name: z.string().min(1),
    destination: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
  }),
  days: z
    .array(
      z.object({
        dayNumber: z.number(),
        date: z.string(),
        activities: z.array(claimActivitySchema),
      })
    )
    .min(1),
})

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, "trips-claim", 10, "1 h")
  if (!rl.ok) {
    return errorResponse(
      "TOO_MANY_REQUESTS",
      "Demasiados intentos de guardado. Espera un rato y vuelve a intentarlo.",
      429
    )
  }

  try {
    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return errorResponse("UNAUTHORIZED", "Inicia sesión para guardar tu itinerario.", 401)
    }

    const body = await parseJsonBody(req, claimRequestSchema)

    const itinerary: GeneratedItinerary = {
      tripName: body.trip.name,
      days: body.days.map((day) => ({
        dayNumber: day.dayNumber,
        date: day.date,
        theme: "",
        isRestDay: false,
        activities: day.activities.map((act) => ({
          name: act.name,
          type: act.type ?? "tour",
          location: act.location ?? "",
          time: act.time ?? "09:00",
          duration: act.duration ?? 60,
          cost: act.cost ?? 0,
          isLocked: act.isLocked,
          notes: act.notes,
          description: act.description,
          icon: act.icon,
          url: act.url,
          pricePerPerson: act.pricePerPerson,
          imageQuery: act.imageQuery,
          recommendationReason: act.recommendationReason,
          indoor: act.indoor,
          lat: act.lat,
          lng: act.lng,
        })),
      })),
    }

    const supabase = createServiceClient()

    // Guest onboarding answers live only in the browser, so the claimed trip
    // gets a minimal profile with the same defaults the generate route uses.
    const { data: onboardingRow, error: onboardingError } = await supabase
      .from("onboarding_profiles")
      .insert({
        user_id: identity.userId,
        destination: body.trip.destination,
        start_date: body.trip.startDate,
        end_date: body.trip.endDate,
        arrival_time: null,
        departure_time: null,
        companion: "solo",
        group_size: 1,
        kids_pets: [],
        mobility: "full",
        accommodation_zone: null,
        interests: [],
        traveler_style: null,
        famous_local: "mix",
        pace: 5,
        rest_days: false,
        rest_frequency: null,
        wake_style: 3,
        siesta: false,
        budget_level: "moderado",
        splurge_categories: [],
        dietary_restrictions: [],
        allergies: null,
        transport: [],
        weather_adaptation: true,
        first_time: true,
        must_see: null,
        must_avoid: null,
        booked_tickets: null,
        timezone: "Europe/Madrid",
      })
      .select()
      .single()

    if (onboardingError || !onboardingRow) {
      console.error("trips/claim onboarding insert error:", onboardingError)
      return errorResponse("INTERNAL_ERROR", "No se pudo guardar el itinerario.", 500)
    }

    const dbTrip = await createTrip(
      identity.userId,
      onboardingRow.id as string,
      itinerary,
      body.trip.startDate,
      body.trip.endDate,
      body.trip.destination,
      {
        initialVersionSource: "system",
        initialVersionReason: "Guest itinerary claimed after login",
      }
    )

    if (!dbTrip) {
      return errorResponse("INTERNAL_ERROR", "No se pudo guardar el itinerario.", 500)
    }

    const { trip, days } = mapToAppTypes(itinerary, dbTrip.id as string)

    return successResponse({
      trip: {
        ...trip,
        id: dbTrip.id as string,
        destination: body.trip.destination,
        country: "",
        startDate: body.trip.startDate,
        endDate: body.trip.endDate,
      },
      days,
    })
  } catch (error) {
    console.error("trips/claim error:", error)
    Sentry.captureException(error)
    return normalizeRouteError(error, "Failed to claim itinerary")
  }
}
