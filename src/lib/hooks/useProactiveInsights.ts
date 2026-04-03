"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { ProactiveInsight, ProactiveAction } from "@/lib/services/proactive-engine"

interface UseProactiveInsightsProps {
  tripId: string | null
  /** Only fetch when trip is active (started and not ended) */
  isActive: boolean
}

export function useProactiveInsights({ tripId, isActive }: UseProactiveInsightsProps) {
  const [insights, setInsights] = useState<ProactiveInsight[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [isAdapting, setIsAdapting] = useState(false)
  const fetchedRef = useRef(false)

  // Determine context based on time of day
  const getContext = useCallback((): "morning" | "evening" | "postday" | "anytime" => {
    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return "morning"
    if (hour >= 18 && hour < 22) return "evening"
    if (hour >= 22 || hour < 6) return "postday"
    return "anytime"
  }, [])

  // Fetch insights from server
  const fetchInsights = useCallback(async () => {
    if (!tripId || !isActive) return

    try {
      const res = await fetch("/api/proactive/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, context: getContext() }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data?.insights) {
          setInsights(data.data.insights)
        }
      }
    } catch {
      // Non-critical — fail silently
    }
  }, [tripId, isActive, getContext])

  // Fetch on mount and every 30 minutes
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchInsights()

    const interval = setInterval(fetchInsights, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchInsights])

  // Get the top visible insight (not dismissed, not expired)
  const topInsight = insights.find(i => {
    if (dismissed.has(i.id)) return false
    if (i.expiresAt && new Date(i.expiresAt) < new Date()) return false
    return true
  }) ?? null

  function dismiss(insightId: string) {
    setDismissed(prev => new Set([...prev, insightId]))
  }

  async function handleAction(action: ProactiveAction, insight: ProactiveInsight) {
    if (action.type === "open_url" && action.payload) {
      window.open(action.payload, "_blank", "noopener,noreferrer")
    }
    if (action.type === "open_screen" && action.payload) {
      // Use Next.js router if available, otherwise fallback
      window.location.href = action.payload
    }
    if (action.type === "adapt" && action.payload && tripId) {
      setIsAdapting(true)
      try {
        const res = await fetch("/api/itinerary/adapt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId,
            reason: action.payload,
            startFromDayNumber: insight.dayNumber,
          }),
        })
        if (res.ok) {
          dismiss(insight.id)
          // Refresh insights after adaptation
          setTimeout(fetchInsights, 2000)
        }
      } catch {
        // silent
      } finally {
        setIsAdapting(false)
      }
    }
    if (action.type === "dismiss") {
      dismiss(insight.id)
    }
  }

  return {
    topInsight,
    insights: insights.filter(i => !dismissed.has(i.id)),
    dismiss,
    handleAction,
    isAdapting,
    refresh: fetchInsights,
  }
}
