import type { DayWeather } from "@/lib/weather-utils"
export type { DayWeather }

const OPEN_METEO = "https://api.open-meteo.com/v1/forecast"

export async function getForecast(lat: number, lng: number, days = 7): Promise<DayWeather[]> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
    timezone: "auto",
    forecast_days: days.toString(),
  })

  const res = await fetch(`${OPEN_METEO}?${params}`, { next: { revalidate: 3600 } })
  if (!res.ok) return []

  const data = await res.json()
  const daily = data.daily
  if (!daily?.time) return []

  return daily.time.map((date: string, i: number) => ({
    date,
    tempMax: Math.round(daily.temperature_2m_max[i]),
    tempMin: Math.round(daily.temperature_2m_min[i]),
    precipitationProbability: daily.precipitation_probability_max[i] ?? 0,
    weatherCode: daily.weather_code[i] ?? 0,
  }))
}
