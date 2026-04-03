/**
 * Proactive Companion Engine
 *
 * Evaluates trip state and produces actionable insights for the user.
 * Called server-side by the notification cron or client-side for in-app banners.
 */

import { createServiceClient } from "@/lib/supabase/server"
import { getForecast, type DayWeather } from "@/lib/services/weather.service"
import { getBudgetSummary } from "@/lib/services/budget.service"

// ─── Types ────────────────────────────────────────────────────────────────────

export type InsightTrigger =
  | "evening_briefing"
  | "morning_briefing"
  | "post_day"
  | "budget_pulse"
  | "weather_change"
  | "ticket_reminder"
  | "local_tip"

export type InsightSeverity = "urgent" | "helpful" | "nice_to_know"

export interface ProactiveAction {
  label: string
  type: "adapt" | "dismiss" | "open_url" | "open_screen"
  payload?: string
}

export interface ProactiveInsight {
  id: string
  trigger: InsightTrigger
  severity: InsightSeverity
  dayNumber: number
  title: string
  body: string
  actions?: ProactiveAction[]
  expiresAt?: string
  autoAdapt?: boolean
  adaptationPrompt?: string
}

// ─── Weather helpers ──────────────────────────────────────────────────────────

function weatherEmoji(code: number): string {
  if (code <= 1) return "☀️"
  if (code <= 3) return "⛅"
  if (code <= 48) return "☁️"
  if (code <= 67) return "🌧️"
  if (code <= 77) return "🌨️"
  if (code <= 82) return "🌧️"
  if (code >= 95) return "⛈️"
  return "🌤️"
}

function weatherDescription(weather: DayWeather): string {
  const emoji = weatherEmoji(weather.weatherCode)
  const rain = weather.precipitationProbability
  if (rain >= 80) return `${emoji} Lluvia muy probable (${rain}%)`
  if (rain >= 50) return `${emoji} Posible lluvia (${rain}%)`
  return `${emoji} ${weather.tempMin}°–${weather.tempMax}°C`
}

// ─── Activity helpers ─────────────────────────────────────────────────────────

interface ActivitySnapshot {
  name: string
  type: string
  time: string
  endTime: string
  duration: number
  cost: number
  url?: string
  lat?: number
  lng?: number
}

interface DaySnapshot {
  dayNumber: number
  date: string
  theme: string
  activities: ActivitySnapshot[]
}

function estimateDayIntensity(activities: ActivitySnapshot[]): {
  totalMinutes: number
  activityCount: number
  estimatedKm: number
  intensity: "light" | "moderate" | "intense"
} {
  const nonHotel = activities.filter(a => a.type !== "hotel")
  const totalMinutes = nonHotel.reduce((sum, a) => sum + (a.duration || 60), 0)
  // Rough estimate: each activity = ~1.5km walking between them
  const estimatedKm = Math.round(nonHotel.length * 1.5)
  const activityCount = nonHotel.length

  let intensity: "light" | "moderate" | "intense" = "moderate"
  if (activityCount <= 3 || totalMinutes <= 240) intensity = "light"
  if (activityCount >= 6 || totalMinutes >= 480) intensity = "intense"

  return { totalMinutes, activityCount, estimatedKm, intensity }
}

function needsAdvanceTickets(activity: ActivitySnapshot): boolean {
  const ticketTypes = new Set(["museum", "monument", "tour"])
  if (!ticketTypes.has(activity.type)) return false
  if (activity.cost === 0) return false
  // If it has a URL that looks like a ticket page
  if (activity.url && (activity.url.includes("ticket") || activity.url.includes("entrada") || activity.url.includes("booking"))) {
    return true
  }
  // High-cost = likely needs reservation
  return activity.cost >= 10
}

// ─── Briefing generators ──────────────────────────────────────────────────────

export function generateEveningBriefing(
  tomorrow: DaySnapshot,
  weather: DayWeather | null,
  tripDestination: string,
): ProactiveInsight {
  const { activityCount, estimatedKm, intensity } = estimateDayIntensity(tomorrow.activities)
  const nonHotel = tomorrow.activities.filter(a => a.type !== "hotel")
  const firstActivity = nonHotel[0]
  const activityNames = nonHotel.slice(0, 4).map(a => a.name)
  const weatherLine = weather ? weatherDescription(weather) : ""

  // Check for activities needing tickets
  const ticketActivities = nonHotel.filter(needsAdvanceTickets)
  const ticketWarning = ticketActivities.length > 0
    ? `\n⚠️ Compra entradas para: ${ticketActivities.map(a => a.name).join(", ")}`
    : ""

  const intensityLine = intensity === "intense"
    ? "💪 Día intenso — descansa bien esta noche."
    : intensity === "light"
      ? "🧘 Día tranquilo — perfecto para disfrutar sin prisas."
      : ""

  const body = [
    `📍 ${activityNames.join(" → ")}${activityCount > 4 ? ` (+${activityCount - 4} más)` : ""}`,
    weatherLine,
    firstActivity ? `🕐 Primera actividad: ${firstActivity.name} a las ${firstActivity.time}` : "",
    `🚶 ~${estimatedKm}km caminando, ${activityCount} actividades`,
    intensityLine,
    ticketWarning,
  ].filter(Boolean).join("\n")

  const actions: ProactiveAction[] = [
    { label: "Ver itinerario", type: "open_screen", payload: "/plan" },
  ]
  if (ticketActivities.length > 0 && ticketActivities[0].url) {
    actions.push({
      label: "Comprar entradas",
      type: "open_url",
      payload: ticketActivities[0].url,
    })
  }

  return {
    id: `evening-${tomorrow.date}`,
    trigger: "evening_briefing",
    severity: ticketActivities.length > 0 ? "urgent" : "helpful",
    dayNumber: tomorrow.dayNumber,
    title: `🌙 Mañana en ${tripDestination}: ${tomorrow.theme || "Día " + tomorrow.dayNumber}`,
    body,
    actions,
    expiresAt: new Date(`${tomorrow.date}T10:00:00Z`).toISOString(),
  }
}

export function generateMorningBriefing(
  today: DaySnapshot,
  weather: DayWeather | null,
  tripDestination: string,
): ProactiveInsight {
  const nonHotel = today.activities.filter(a => a.type !== "hotel")
  const firstActivity = nonHotel[0]
  const { activityCount } = estimateDayIntensity(today.activities)
  const weatherLine = weather ? `${weatherEmoji(weather.weatherCode)} ${weather.tempMin}°–${weather.tempMax}°C` : ""
  const activityNames = nonHotel.slice(0, 3).map(a => a.name).join(", ")

  // Check for Monday closings (common in Europe)
  const dayOfWeek = new Date(today.date).getDay()
  const mondayWarning = dayOfWeek === 1
    ? "\n⚠️ Es lunes — algunos museos cierran. Verifica horarios."
    : ""

  // Sunday warning
  const sundayWarning = dayOfWeek === 0
    ? "\n💡 Es domingo — tiendas pueden cerrar antes. Mercadillos suelen ser por la mañana."
    : ""

  const body = [
    `Hoy: ${activityNames}${activityCount > 3 ? ` y ${activityCount - 3} más` : ""}. ${weatherLine}`,
    firstActivity ? `Primera parada: ${firstActivity.name} (${firstActivity.time})` : "",
    mondayWarning || sundayWarning || "",
  ].filter(Boolean).join("\n")

  return {
    id: `morning-${today.date}`,
    trigger: "morning_briefing",
    severity: "helpful",
    dayNumber: today.dayNumber,
    title: `☀️ Buenos días — Día ${today.dayNumber} en ${tripDestination}`,
    body,
    actions: [
      { label: "Ver plan de hoy", type: "open_screen", payload: "/plan" },
    ],
    expiresAt: new Date(`${today.date}T14:00:00Z`).toISOString(),
  }
}

export function generatePostDayCheckin(
  today: DaySnapshot,
  tomorrowExists: boolean,
  tripDestination: string,
): ProactiveInsight {
  const { activityCount, estimatedKm, intensity } = estimateDayIntensity(today.activities)

  const fatigueMessage = intensity === "intense"
    ? `Hoy fue intenso: ${activityCount} actividades, ~${estimatedKm}km. ${tomorrowExists ? "¿Quieres que relaje el plan de mañana?" : ""}`
    : intensity === "light"
      ? `Día tranquilo hoy. ${tomorrowExists ? "Mañana puedes ir con más energía." : ""}`
      : `Buen día: ${activityCount} actividades, ~${estimatedKm}km.`

  const actions: ProactiveAction[] = [
    { label: "Escribir en diario", type: "open_screen", payload: "/plan/diary" },
  ]
  if (tomorrowExists && intensity === "intense") {
    actions.push({
      label: "Relajar mañana",
      type: "adapt",
      payload: `El usuario tuvo un día muy intenso (${activityCount} actividades, ~${estimatedKm}km). Relaja el día siguiente: reduce a 4 actividades máximo, añade un brunch largo, más tiempo libre entre actividades, y prioriza experiencias relajadas (cafés, parques, paseos).`,
    })
  }

  return {
    id: `postday-${today.date}`,
    trigger: "post_day",
    severity: intensity === "intense" ? "helpful" : "nice_to_know",
    dayNumber: today.dayNumber,
    title: `📝 ¿Cómo fue tu día ${today.dayNumber} en ${tripDestination}?`,
    body: fatigueMessage,
    actions,
    expiresAt: new Date(new Date(`${today.date}T23:59:59Z`).getTime() + 12 * 60 * 60 * 1000).toISOString(),
  }
}

// ─── Budget pulse ────────────────────────────────────────────────────

import type { BudgetSummary } from "@/lib/services/budget.service"
import { getLocalTips } from "@/lib/services/local-tips.service"

function generateBudgetPulse(
  summary: BudgetSummary,
  destination: string,
): ProactiveInsight | null {
  // Only show if meaningful data exists
  if (summary.totalSpent === 0 && summary.daysElapsed <= 1) return null

  const pct = Math.round((summary.totalSpent / summary.totalBudget) * 100)

  let title: string
  let body: string
  let severity: InsightSeverity

  if (summary.status === "over") {
    title = `📉 Presupuesto: €${summary.totalSpent} de €${summary.totalBudget} (${pct}%)`
    body = `${summary.tip}\n\n📊 Desglose: ${formatCategoryBreakdown(summary.byCategory)}`
    severity = "urgent"
  } else if (summary.status === "under") {
    title = `💰 ¡Vas genial de presupuesto! (${pct}%)`
    body = `${summary.tip}\n\nLlevas €${summary.dailyAverage}/día de media.`
    severity = "nice_to_know"
  } else {
    title = `📊 Presupuesto en línea (${pct}%)`
    body = `${summary.tip}`
    severity = "nice_to_know"
  }

  return {
    id: `budget-${new Date().toISOString().slice(0, 10)}`,
    trigger: "budget_pulse",
    severity,
    dayNumber: summary.daysElapsed,
    title,
    body,
    actions: [
      { label: "Ver gastos", type: "open_screen", payload: "/plan?tab=budget" },
    ],
  }
}

function formatCategoryBreakdown(byCategory: Record<string, number>): string {
  const emoji: Record<string, string> = {
    food: "🍽️", transport: "🚕", tickets: "🎫️",
    shopping: "🛍️", accommodation: "🏨", other: "📦",
  }
  return Object.entries(byCategory)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `${emoji[k] ?? ""} €${Math.round(v)}`)
    .join(" · ")
}

// ─── Ticket reminders ──────────────────────────────────────────────────

function generateTicketReminders(
  day: DaySnapshot,
  destination: string,
): ProactiveInsight[] {
  const nonHotel = day.activities.filter(a => a.type !== "hotel")
  const ticketActivities = nonHotel.filter(needsAdvanceTickets)

  if (ticketActivities.length === 0) return []

  return ticketActivities.map(activity => ({
    id: `ticket-${day.date}-${activity.name.slice(0, 20).replace(/\s/g, '-')}`,
    trigger: "ticket_reminder" as InsightTrigger,
    severity: "urgent" as InsightSeverity,
    dayNumber: day.dayNumber,
    title: `🎫 Compra entrada: ${activity.name}`,
    body: `Mañana a las ${activity.time} visitas ${activity.name} (€${activity.cost}). Compra la entrada ahora para evitar colas.`,
    actions: activity.url
      ? [
          { label: "Comprar entrada", type: "open_url" as const, payload: activity.url },
          { label: "Ya la tengo", type: "dismiss" as const },
        ]
      : [
          { label: "Buscar entradas", type: "open_url" as const, payload: `https://www.google.com/search?q=${encodeURIComponent(activity.name + " " + destination + " tickets")}` },
          { label: "Ya la tengo", type: "dismiss" as const },
        ],
  }))
}

// ─── Main evaluation ──────────────────────────────────────────────────────────

interface EvaluateProactiveOptions {
  tripId: string
  userId: string
  /** "evening" (21:00), "morning" (08:00), "postday" (21:00), "anytime" */
  context: "evening" | "morning" | "postday" | "anytime"
}

export async function evaluateProactiveInsights(
  opts: EvaluateProactiveOptions
): Promise<ProactiveInsight[]> {
  const supabase = createServiceClient()
  const insights: ProactiveInsight[] = []

  // Load trip
  const { data: trip } = await supabase
    .from("trips")
    .select("id, name, destination, country, start_date, end_date, budget, spent")
    .eq("id", opts.tripId)
    .eq("user_id", opts.userId)
    .single()

  if (!trip) return []

  // Load itinerary days
  const { data: versions } = await supabase
    .from("trip_itinerary_versions")
    .select("day_number, date, theme, activities_snapshot")
    .eq("trip_id", opts.tripId)
    .order("day_number")

  if (!versions || versions.length === 0) return []

  const days: DaySnapshot[] = versions.map(v => ({
    dayNumber: v.day_number,
    date: v.date ?? "",
    theme: (v.theme as string) ?? "",
    activities: (v.activities_snapshot as ActivitySnapshot[]) ?? [],
  }))

  // Get today's date
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().slice(0, 10)

  const todayDay = days.find(d => d.date === todayStr)
  const tomorrowDay = days.find(d => d.date === tomorrowStr)

  // Get weather if we have coordinates
  let forecast: DayWeather[] = []
  const firstActivity = days[0]?.activities?.find(a => a.lat && a.lng)
  if (firstActivity?.lat && firstActivity?.lng) {
    try {
      forecast = await getForecast(firstActivity.lat, firstActivity.lng)
    } catch {
      // Weather is optional
    }
  }

  const getWeather = (date: string) => forecast.find(f => f.date === date) ?? null

  // Generate insights based on context
  if (opts.context === "evening" || opts.context === "anytime") {
    if (tomorrowDay) {
      insights.push(
        generateEveningBriefing(tomorrowDay, getWeather(tomorrowStr), String(trip.destination))
      )
    }
  }

  if (opts.context === "morning" || opts.context === "anytime") {
    if (todayDay) {
      insights.push(
        generateMorningBriefing(todayDay, getWeather(todayStr), String(trip.destination))
      )
    }
  }

  if (opts.context === "postday" || opts.context === "anytime") {
    if (todayDay) {
      const tomorrowExists = !!tomorrowDay
      insights.push(
        generatePostDayCheckin(todayDay, tomorrowExists, String(trip.destination))
      )
    }
  }

  // Budget pulse — check every evaluation if budget is set
  if (Number(trip.budget) > 0) {
    try {
      const budgetSummary = await getBudgetSummary(opts.userId, opts.tripId)
      if (budgetSummary) {
        const budgetInsight = generateBudgetPulse(budgetSummary, String(trip.destination))
        if (budgetInsight) insights.push(budgetInsight)
      }
    } catch {
      // Budget is optional
    }
  }

  // Ticket reminders for tomorrow
  if (tomorrowDay) {
    const ticketInsights = generateTicketReminders(tomorrowDay, String(trip.destination))
    insights.push(...ticketInsights)
  }

  // Local tip of the moment
  const timeOfDay = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"
  const tips = getLocalTips(String(trip.destination), { timeOfDay })
  if (tips.length > 0) {
    const tip = tips[0]
    insights.push({
      id: `tip-${tip.id}`,
      trigger: "local_tip" as InsightTrigger,
      severity: "nice_to_know",
      dayNumber: todayDay?.dayNumber ?? 1,
      title: `${tip.emoji} ${tip.title}`,
      body: tip.body,
      actions: [{ label: "Ver más tips", type: "open_screen", payload: "/plan?tab=tips" }],
    })
  }

  return insights
}
