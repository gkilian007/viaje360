"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useAppStore } from "@/store/useAppStore"
import { selectHydratedAppState } from "@/lib/bootstrap/hydration"
import type { ChatMessage, DayItinerary, Trip } from "@/lib/types"

interface ActiveTripResponse {
  trip: Trip | null
  days: DayItinerary[]
  chatMessages: ChatMessage[]
}

interface ActiveTripEnvelope {
  ok: true
  data: ActiveTripResponse
}

export function AppBootstrap() {
  const pathname = usePathname()
  const hasFetchedRef = useRef(false)
  const {
    currentTrip,
    generatedItinerary,
    chatMessages,
    setCurrentTrip,
    setGeneratedItinerary,
    replaceChatMessages,
  } = useAppStore()

  useEffect(() => {
    if (pathname?.startsWith("/onboarding")) return
    if (hasFetchedRef.current) return
    if (currentTrip && generatedItinerary?.length) return

    hasFetchedRef.current = true

    async function hydrateActiveTrip() {
      try {
        const res = await fetch("/api/trips/active", { cache: "no-store" })
        if (!res.ok) return

        const payload = (await res.json()) as ActiveTripEnvelope
        const nextState = selectHydratedAppState({
          local: {
            currentTrip,
            generatedItinerary,
            chatMessages,
          },
          remote: payload.data,
        })

        setCurrentTrip(nextState.currentTrip)
        setGeneratedItinerary(nextState.generatedItinerary)
        replaceChatMessages(nextState.chatMessages)
      } catch (err) {
        console.warn("Could not hydrate active trip:", err)
      }
    }

    void hydrateActiveTrip()
  }, [
    pathname,
    currentTrip,
    generatedItinerary,
    chatMessages,
    setCurrentTrip,
    setGeneratedItinerary,
    replaceChatMessages,
  ])

  return null
}
