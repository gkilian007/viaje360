import { NextRequest } from "next/server"
import { generateChatResponse } from "@/lib/gemini"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { chatRequestSchema } from "@/lib/api/contracts"
import {
  errorResponse,
  normalizeRouteError,
  parseJsonBody,
  successResponse,
} from "@/lib/api/route-helpers"
import { addChatMessage, getChatHistory } from "@/lib/services/trip.service"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req, chatRequestSchema)
    const identity = await resolveRequestIdentity()
    const { message, tripId } = body
    let { history } = body

    if (tripId && !identity.userId) {
      return errorResponse("UNAUTHORIZED", "Authentication required for trip chat", 401)
    }

    let systemContext = ""
    if (tripId) {
      try {
        const supabase = createServiceClient()
        const { data: trip } = await supabase.from("trips").select("*").eq("id", tripId).single()
        const { data: onboarding } = trip
          ? await supabase.from("onboarding_profiles").select("*").eq("id", trip.onboarding_id).single()
          : { data: null }

        if (trip) {
          systemContext = `
Current trip context:
- Destination: ${trip.destination}
- Trip name: ${trip.name}
- Dates: ${trip.start_date} to ${trip.end_date}
- Budget: €${trip.budget} (spent €${trip.spent})
${onboarding ? `
User preferences:
- Companion: ${onboarding.companion} (${onboarding.group_size} people)
- Interests: ${(onboarding.interests as string[]).join(", ")}
- Dietary: ${(onboarding.dietary_restrictions as string[]).join(", ") || "none"}
- Transport: ${(onboarding.transport as string[]).join(", ")}
- Budget level: ${onboarding.budget_level}
` : ""}`
        }

        if (history.length === 0) {
          const savedMessages = await getChatHistory(tripId)
          history = savedMessages.map((savedMessage) => ({
            role: (savedMessage.role === "assistant" ? "model" : "user") as "user" | "model",
            text: savedMessage.content,
          }))
        }
      } catch (contextError) {
        console.warn("Could not load trip context:", contextError)
      }
    }

    const response = await generateChatResponse(history, message, systemContext)

    if (tripId && identity.userId) {
      try {
        await addChatMessage(tripId, identity.userId, "user", message)
        await addChatMessage(tripId, identity.userId, "assistant", response)
      } catch (saveError) {
        console.warn("Could not save chat messages:", saveError)
      }
    }

    return successResponse({ response })
  } catch (error) {
    console.error("Chat API error:", error)
    return normalizeRouteError(error, "Failed to generate response")
  }
}
