const OPEN_METEO = "https://api.open-meteo.com/v1/forecast"

export interface DayWeather {
  date: string
  tempMax: number
  tempMin: number
  precipitationProbability: number
  weatherCode: number
}

const WMO_ICONS: Record<number, { icon: string; label: string }> = {
  0: { icon: "☀️", label: "Despejado" },
  1: { icon: "🌤️", label: "Mayormente despejado" },
  2: { icon: "⛅", label: "Parcialmente nublado" },
  3: { icon: "☁️", label: "Nublado" },
  45: { icon: "🌫️", label: "Niebla" },
  48: { icon: "🌫️", label: "Niebla helada" },
  51: { icon: "🌦️", label: "Llovizna ligera" },
  53: { icon: "🌦️", label: "Llovizna" },
  55: { icon: "🌧️", label: "Llovizna intensa" },
  61: { icon: "🌧️", label: "Lluvia ligera" },
  63: { icon: "🌧️", label: "Lluvia" },
  65: { icon: "🌧️", label: "Lluvia intensa" },
  71: { icon: "🌨️", label: "Nieve ligera" },
  73: { icon: "🌨️", label: "Nieve" },
  75: { icon: "❄️", label: "Nieve intensa" },
  80: { icon: "🌦️", label: "Chubascos" },
  81: { icon: "🌧️", label: "Chubascos moderados" },
  82: { icon: "⛈️", label: "Chubascos fuertes" },
  95: { icon: "⛈️", label: "Tormenta" },
  96: { icon: "⛈️", label: "Tormenta con granizo" },
  99: { icon: "⛈️", label: "Tormenta severa" },
}

export function getWeatherDisplay(code: number) {
  return WMO_ICONS[code] ?? { icon: "🌡️", label: "Desconocido" }
}

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
