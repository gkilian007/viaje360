import test from "node:test"
import assert from "node:assert/strict"

import { selectHydratedAppState } from "./hydration"
import { demoChatMessages, demoTrip, demoItinerary } from "@/lib/demo-data"

test("selectHydratedAppState replaces local trip and chat with backend state when available", () => {
  const state = selectHydratedAppState({
    local: {
      currentTrip: demoTrip,
      generatedItinerary: demoItinerary,
      chatMessages: demoChatMessages,
    },
    remote: {
      trip: {
        ...demoTrip,
        id: "trip-remote",
        name: "Remote Trip",
      },
      days: [
        {
          date: "2026-03-25",
          dayNumber: 1,
          activities: [],
        },
      ],
      chatMessages: [
        {
          id: "remote-1",
          role: "assistant",
          content: "Persisted hello",
          timestamp: "2026-03-22T10:00:00.000Z",
        },
      ],
    },
  })

  assert.equal(state.currentTrip?.id, "trip-remote")
  assert.equal(state.generatedItinerary?.[0]?.date, "2026-03-25")
  assert.deepEqual(state.chatMessages.map((message) => message.id), ["remote-1"])
})

test("selectHydratedAppState preserves local demo state when backend has no active trip", () => {
  const state = selectHydratedAppState({
    local: {
      currentTrip: demoTrip,
      generatedItinerary: demoItinerary,
      chatMessages: demoChatMessages,
    },
    remote: {
      trip: null,
      days: [],
      chatMessages: [],
    },
  })

  assert.equal(state.currentTrip?.id, demoTrip.id)
  assert.equal(state.generatedItinerary?.length, demoItinerary.length)
  assert.equal(state.chatMessages.length, demoChatMessages.length)
})
