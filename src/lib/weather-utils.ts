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
