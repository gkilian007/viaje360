import type { ChatMessage, DayItinerary, Trip } from "@/lib/types"

interface LocalBootstrapState {
  currentTrip: Trip | null
  generatedItinerary: DayItinerary[] | null
  chatMessages: ChatMessage[]
}

interface RemoteBootstrapState {
  trip: Trip | null
  days: DayItinerary[]
  chatMessages: ChatMessage[]
}

interface SelectHydratedAppStateOptions {
  local: LocalBootstrapState
  remote: RemoteBootstrapState
}

export function selectHydratedAppState({
  local,
  remote,
}: SelectHydratedAppStateOptions): LocalBootstrapState {
  if (!remote.trip) {
    return local
  }

  return {
    currentTrip: remote.trip,
    generatedItinerary: remote.days.length > 0 ? remote.days : local.generatedItinerary,
    chatMessages: remote.chatMessages.length > 0 ? remote.chatMessages : local.chatMessages,
  }
}
