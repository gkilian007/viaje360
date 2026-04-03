"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DayItinerary } from "@/lib/types"
import type { DayWeather } from "@/lib/weather-utils"
import {
  detectTripIssues,
  getAutoAdaptIssues,
  itineraryToDaySnapshots,
  type TripIssue,
} from "@/lib/proactive-adaptation"

interface UseProactiveAdaptationProps {
  itinerary: DayItinerary[]
  getWeatherForDate: (date: string) => DayWeather | undefined
  tripId: string
  onAdapted?: (days: DayItinerary[]) => void
}

export function useProactiveAdaptation({
  itinerary,
  getWeatherForDate,
  tripId,
  onAdapted,
}: UseProactiveAdaptationProps) {
  const [dismissedKinds, setDismissedKinds] = useState<Set<string>>(new Set())
  const [adaptingKind, setAdaptingKind] = useState<string | null>(null)
  const [doneKinds, setDoneKinds] = useState<Set<string>>(new Set())
  const [autoAdaptedDays, setAutoAdaptedDays] = useState<number[]>([])
  const autoAdaptTriggered = useRef<Set<string>>(new Set())

  const issues = useMemo(() => {
    const snapshots = itineraryToDaySnapshots(itinerary, getWeatherForDate)
    return detectTripIssues(snapshots)
  }, [itinerary, getWeatherForDate])

  // Auto-adapt: when precipitation >= 80%, adapt automatically
  const adaptIssue = useCallback(async (issue: TripIssue) => {
    const key = `${issue.kind}-${issue.dayNumber}`
    setAdaptingKind(key)
    try {
      const res = await fetch("/api/itinerary/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          reason: issue.adaptationPrompt,
          startFromDayNumber: issue.dayNumber,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.data?.days && onAdapted) {
          onAdapted(data.data.days)
        }
        setDoneKinds(prev => new Set([...prev, key]))
        return true
      }
    } catch {
      // silent fail
    } finally {
      setAdaptingKind(null)
    }
    return false
  }, [tripId, onAdapted])

  // Auto-adapt effect: triggers once per issue when precipitation >= 80%
  useEffect(() => {
    const autoIssues = getAutoAdaptIssues(issues)
    for (const issue of autoIssues) {
      const key = `auto-${issue.kind}-${issue.dayNumber}`
      if (autoAdaptTriggered.current.has(key)) continue
      if (doneKinds.has(`${issue.kind}-${issue.dayNumber}`)) continue
      autoAdaptTriggered.current.add(key)

      adaptIssue(issue).then(success => {
        if (success) {
          setAutoAdaptedDays(prev => [...prev, issue.dayNumber])
        }
      })
      // Only auto-adapt one at a time to avoid overwhelming the API
      break
    }
  }, [issues, doneKinds, adaptIssue])

  // The most urgent issue not yet dismissed or done
  const topIssue: TripIssue | null = useMemo(() => {
    return issues.find(
      i => !dismissedKinds.has(`${i.kind}-${i.dayNumber}`) &&
           !doneKinds.has(`${i.kind}-${i.dayNumber}`)
    ) ?? null
  }, [issues, dismissedKinds, doneKinds])

  function dismiss(issue: TripIssue) {
    setDismissedKinds(prev => new Set([...prev, `${issue.kind}-${issue.dayNumber}`]))
  }

  async function adapt(issue: TripIssue) {
    return adaptIssue(issue)
  }

  /** Clear the auto-adapted notification after user sees it */
  function clearAutoAdapted() {
    setAutoAdaptedDays([])
  }

  const isAdapting = adaptingKind !== null

  return {
    topIssue,
    issues,
    dismiss,
    adapt,
    isAdapting,
    adaptingKind,
    /** Days that were auto-adapted due to high rain probability (>=80%) */
    autoAdaptedDays,
    clearAutoAdapted,
  }
}
