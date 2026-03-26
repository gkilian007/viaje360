"use client"

import { useEffect, useState } from "react"
import type { DayWeather } from "@/lib/services/weather.service"

const cache = new Map<string, DayWeather[]>()

export function useWeather(lat: number | undefined, lng: number | undefined) {
  const [forecast, setForecast] = useState<DayWeather[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!lat || !lng) return

    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`
    if (cache.has(key)) {
      setForecast(cache.get(key)!)
      return
    }

    setLoading(true)
    fetch(`/api/weather?lat=${lat}&lng=${lng}`)
      .then(r => r.json())
      .then(({ data }) => {
        if (data) {
          cache.set(key, data)
          setForecast(data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [lat, lng])

  function getForDate(date: string): DayWeather | undefined {
    return forecast.find(d => d.date === date)
  }

  return { forecast, loading, getForDate }
}
