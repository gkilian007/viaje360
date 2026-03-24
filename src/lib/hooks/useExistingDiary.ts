"use client"

import { useState, useEffect } from "react"

export interface ExistingDiaryData {
  journal: {
    mood: string | null
    energy_score: number | null
    pace_score: number | null
    free_text_summary: string | null
    would_repeat: boolean | null
    conversation: Array<{ role: "assistant" | "user"; content: string }>
  } | null
  activityFeedback: Array<{
    activityId: string
    liked: boolean | null
    wouldRepeat: boolean | null
    notes: string
  }>
}

/**
 * Fetches an existing diary entry for a given trip + day.
 * Returns null while loading, the data when ready, or an empty state if none exists.
 */
export function useExistingDiary(tripId: string | null, dayNumber: number) {
  const [data, setData] = useState<ExistingDiaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tripId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchDiary() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/diary?tripId=${tripId}&dayNumber=${dayNumber}`)
        if (!res.ok) throw new Error("Failed to fetch diary")

        const json = await res.json()
        if (!cancelled) {
          setData(json.data as ExistingDiaryData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error")
          setData({ journal: null, activityFeedback: [] })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchDiary()

    return () => {
      cancelled = true
    }
  }, [tripId, dayNumber])

  return { data, loading, error, hasExistingDiary: Boolean(data?.journal) }
}
