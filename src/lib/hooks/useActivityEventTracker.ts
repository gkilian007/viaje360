"use client"

import { useCallback, useRef } from "react"
import { useAppStore } from "@/store/useAppStore"

type EventType =
  | "detail_opened"
  | "external_link_clicked"
  | "bookmark_toggled"
  | "share_clicked"
  | "map_pin_clicked"

interface PendingEvent {
  tripId: string
  activityId: string
  eventType: EventType
  metadata: Record<string, unknown>
}

const FLUSH_DELAY_MS = 2_000
const MAX_BATCH_SIZE = 20

/**
 * Lightweight hook that batches activity interaction events
 * and sends them to the backend in a single request.
 *
 * Usage:
 *   const { trackEvent } = useActivityEventTracker()
 *   trackEvent(activity.id, "detail_opened", { source: "timeline-card" })
 */
export function useActivityEventTracker() {
  const bufferRef = useRef<PendingEvent[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushingRef = useRef(false)

  const flush = useCallback(async () => {
    if (flushingRef.current || bufferRef.current.length === 0) return

    flushingRef.current = true
    const batch = bufferRef.current.splice(0, MAX_BATCH_SIZE)

    try {
      await fetch("/api/activity-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      })
    } catch (error) {
      // Non-critical: silently discard failed events
      console.warn("[activity-events] flush failed:", error)
    } finally {
      flushingRef.current = false
      // If there are still events, schedule another flush
      if (bufferRef.current.length > 0) {
        timerRef.current = setTimeout(flush, FLUSH_DELAY_MS)
      }
    }
  }, [])

  const trackEvent = useCallback(
    (activityId: string, eventType: EventType, metadata: Record<string, unknown> = {}) => {
      const tripId = useAppStore.getState().currentTrip?.id
      if (!tripId) return

      bufferRef.current.push({ tripId, activityId, eventType, metadata })

      // Debounce: reset timer on each new event
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(flush, FLUSH_DELAY_MS)

      // Force flush if batch is full
      if (bufferRef.current.length >= MAX_BATCH_SIZE) {
        if (timerRef.current) clearTimeout(timerRef.current)
        flush()
      }
    },
    [flush]
  )

  return { trackEvent }
}
