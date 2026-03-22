import { getItinerary, mapDbItineraryToAppTypes } from "@/lib/services/itinerary.service"
import { getActiveTrip, getChatHistory, mapDbChatMessagesToAppMessages } from "@/lib/services/trip.service"
import { successResponse } from "@/lib/api/route-helpers"
import { resolveRequestIdentity } from "@/lib/auth/server"

export async function GET() {
  try {
    const identity = await resolveRequestIdentity()
    if (!identity.userId) {
      return successResponse({ trip: null, days: [], chatMessages: [] })
    }

    const trip = await getActiveTrip(identity.userId)
    if (!trip) {
      return successResponse({ trip: null, days: [], chatMessages: [] })
    }

    const [itinerary, chatHistory] = await Promise.all([
      getItinerary(trip.id),
      getChatHistory(trip.id),
    ])

    if (!itinerary) {
      return successResponse({ trip: null, days: [], chatMessages: [] })
    }

    const mapped = mapDbItineraryToAppTypes(itinerary.trip, itinerary.days)
    return successResponse({
      ...mapped,
      chatMessages: mapDbChatMessagesToAppMessages(chatHistory),
    })
  } catch (error) {
    console.error("trips/active error:", error)
    return successResponse({ trip: null, days: [], chatMessages: [] })
  }
}
