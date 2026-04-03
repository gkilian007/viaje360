/**
 * Smart Packing List Service
 *
 * Generates a context-aware packing list based on:
 * - Destination climate & weather forecast
 * - Trip duration
 * - Planned activities (museums, beaches, hikes, etc.)
 * - User preferences (travel style)
 */

import type { DayWeather } from "@/lib/services/weather.service"

// ─── Types ────────────────────────────────────────────────────────────────────

export type PackingCategory =
  | "essentials"
  | "clothing"
  | "tech"
  | "toiletries"
  | "documents"
  | "activity_specific"
  | "comfort"

export interface PackingItem {
  id: string
  name: string
  emoji: string
  category: PackingCategory
  quantity: number
  reason?: string
  /** Priority: 1 = must-have, 2 = recommended, 3 = nice-to-have */
  priority: 1 | 2 | 3
  packed: boolean
}

export interface PackingList {
  tripId: string
  items: PackingItem[]
  generatedAt: string
  weatherSummary?: string
}

// ─── Category labels ──────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<PackingCategory, { label: string; emoji: string }> = {
  essentials: { label: "Imprescindibles", emoji: "🔑" },
  clothing: { label: "Ropa", emoji: "👕" },
  tech: { label: "Tecnología", emoji: "🔌" },
  toiletries: { label: "Aseo", emoji: "🧴" },
  documents: { label: "Documentos", emoji: "📄" },
  activity_specific: { label: "Para actividades", emoji: "🎒" },
  comfort: { label: "Confort", emoji: "😌" },
}

// ─── Base items everyone needs ────────────────────────────────────────────────

const BASE_ESSENTIALS: Omit<PackingItem, "packed">[] = [
  { id: "passport", name: "Pasaporte", emoji: "🛂", category: "documents", quantity: 1, priority: 1 },
  { id: "id-card", name: "DNI / Tarjeta ID", emoji: "💳", category: "documents", quantity: 1, priority: 1 },
  { id: "boarding-pass", name: "Tarjetas de embarque", emoji: "✈️", category: "documents", quantity: 1, priority: 1 },
  { id: "hotel-booking", name: "Reservas hotel", emoji: "🏨", category: "documents", quantity: 1, priority: 1, reason: "Impreso o en el móvil" },
  { id: "travel-insurance", name: "Seguro de viaje", emoji: "🛡️", category: "documents", quantity: 1, priority: 2 },
  { id: "phone-charger", name: "Cargador móvil", emoji: "🔌", category: "tech", quantity: 1, priority: 1 },
  { id: "power-bank", name: "Batería externa", emoji: "🔋", category: "tech", quantity: 1, priority: 1 },
  { id: "headphones", name: "Auriculares", emoji: "🎧", category: "tech", quantity: 1, priority: 2 },
  { id: "wallet", name: "Cartera", emoji: "👛", category: "essentials", quantity: 1, priority: 1 },
  { id: "meds", name: "Medicamentos personales", emoji: "💊", category: "essentials", quantity: 1, priority: 1 },
  { id: "toothbrush", name: "Cepillo de dientes", emoji: "🪥", category: "toiletries", quantity: 1, priority: 1 },
  { id: "deodorant", name: "Desodorante", emoji: "🧴", category: "toiletries", quantity: 1, priority: 1 },
]

// ─── Weather-based items ──────────────────────────────────────────────────────

function getWeatherItems(forecast: DayWeather[]): Omit<PackingItem, "packed">[] {
  const items: Omit<PackingItem, "packed">[] = []

  const hasRain = forecast.some(d => d.precipitationProbability > 40)
  const hasCold = forecast.some(d => d.tempMin < 10)
  const hasHot = forecast.some(d => d.tempMax > 28)
  const hasVeryHot = forecast.some(d => d.tempMax > 33)
  const maxTemp = Math.max(...forecast.map(d => d.tempMax))
  const minTemp = Math.min(...forecast.map(d => d.tempMin))

  if (hasRain) {
    items.push({ id: "umbrella", name: "Paraguas", emoji: "☂️", category: "essentials", quantity: 1, priority: 1, reason: "Se esperan lluvias" })
    items.push({ id: "rain-jacket", name: "Chaqueta impermeable", emoji: "🧥", category: "clothing", quantity: 1, priority: 1, reason: "Lluvias previstas" })
  }

  if (hasCold) {
    items.push({ id: "warm-jacket", name: "Chaqueta abrigada", emoji: "🧥", category: "clothing", quantity: 1, priority: 1, reason: `Mínimas de ${minTemp}°C` })
    items.push({ id: "scarf", name: "Bufanda", emoji: "🧣", category: "clothing", quantity: 1, priority: 2, reason: "Para las noches frías" })
  }

  if (hasHot) {
    items.push({ id: "sunscreen", name: "Protector solar", emoji: "🧴", category: "toiletries", quantity: 1, priority: 1, reason: `Máximas de ${maxTemp}°C` })
    items.push({ id: "sunglasses", name: "Gafas de sol", emoji: "🕶️", category: "essentials", quantity: 1, priority: 1 })
    items.push({ id: "hat", name: "Gorra / Sombrero", emoji: "🧢", category: "clothing", quantity: 1, priority: 2 })
    items.push({ id: "water-bottle", name: "Botella de agua", emoji: "💧", category: "essentials", quantity: 1, priority: 1, reason: "Imprescindible con calor" })
  }

  if (hasVeryHot) {
    items.push({ id: "mini-fan", name: "Mini ventilador portátil", emoji: "🌀", category: "comfort", quantity: 1, priority: 3, reason: `Se esperan ${maxTemp}°C` })
  }

  return items
}

// ─── Activity-based items ─────────────────────────────────────────────────────

interface ActivityContext {
  name: string
  type?: string
}

function getActivityItems(activities: ActivityContext[]): Omit<PackingItem, "packed">[] {
  const items: Omit<PackingItem, "packed">[] = []
  const seen = new Set<string>()

  const add = (item: Omit<PackingItem, "packed">) => {
    if (seen.has(item.id)) return
    seen.add(item.id)
    items.push(item)
  }

  const lowerNames = activities.map(a => (a.name + " " + (a.type ?? "")).toLowerCase())

  // Beach / pool
  if (lowerNames.some(n => /playa|beach|piscina|pool|snorkel|mar/.test(n))) {
    add({ id: "swimsuit", name: "Bañador", emoji: "🩱", category: "clothing", quantity: 2, priority: 1, reason: "Actividades acuáticas" })
    add({ id: "flip-flops", name: "Chanclas", emoji: "🩴", category: "clothing", quantity: 1, priority: 1 })
    add({ id: "towel", name: "Toalla de playa", emoji: "🏖️", category: "activity_specific", quantity: 1, priority: 2 })
  }

  // Hiking / nature
  if (lowerNames.some(n => /senderismo|hiking|trekking|montaña|mountain|parque natural|nature/.test(n))) {
    add({ id: "hiking-shoes", name: "Zapatillas de trekking", emoji: "🥾", category: "activity_specific", quantity: 1, priority: 1, reason: "Senderismo previsto" })
    add({ id: "daypack", name: "Mochila pequeña", emoji: "🎒", category: "activity_specific", quantity: 1, priority: 1 })
    add({ id: "first-aid", name: "Mini botiquín", emoji: "🩹", category: "essentials", quantity: 1, priority: 2 })
  }

  // Museums / formal
  if (lowerNames.some(n => /museo|museum|ópera|opera|teatro|theatre|concierto|concert|restaurante.*estrella/.test(n))) {
    add({ id: "smart-outfit", name: "Ropa semiformal", emoji: "👔", category: "clothing", quantity: 1, priority: 2, reason: "Visitas culturales/cenas" })
  }

  // Religious sites
  if (lowerNames.some(n => /vaticano|vatican|iglesia|church|mezquita|mosque|templo|temple|catedral|cathedral/.test(n))) {
    add({ id: "cover-shoulders", name: "Ropa que cubra hombros", emoji: "👗", category: "clothing", quantity: 1, priority: 1, reason: "Código de vestimenta en lugares religiosos" })
  }

  // Nightlife
  if (lowerNames.some(n => /bar|club|discoteca|noche|nightlife|fiesta/.test(n))) {
    add({ id: "going-out-outfit", name: "Outfit para salir", emoji: "✨", category: "clothing", quantity: 1, priority: 2 })
  }

  // Snow / ski
  if (lowerNames.some(n => /esquí|ski|snow|nieve/.test(n))) {
    add({ id: "ski-jacket", name: "Chaqueta de esquí", emoji: "🧥", category: "activity_specific", quantity: 1, priority: 1 })
    add({ id: "thermals", name: "Ropa térmica", emoji: "🧦", category: "clothing", quantity: 2, priority: 1, reason: "Esquí/nieve" })
    add({ id: "ski-gloves", name: "Guantes", emoji: "🧤", category: "activity_specific", quantity: 1, priority: 1 })
  }

  return items
}

// ─── Duration-based clothing calculation ──────────────────────────────────────

function getClothingForDuration(totalDays: number): Omit<PackingItem, "packed">[] {
  // Smart packing: pack for ~5 days max, plan to wash
  const packDays = Math.min(totalDays, 5)
  const needsLaundry = totalDays > 5

  const items: Omit<PackingItem, "packed">[] = [
    { id: "underwear", name: "Ropa interior", emoji: "🩲", category: "clothing", quantity: packDays + 1, priority: 1 },
    { id: "socks", name: "Calcetines", emoji: "🧦", category: "clothing", quantity: packDays, priority: 1 },
    { id: "t-shirts", name: "Camisetas", emoji: "👕", category: "clothing", quantity: Math.ceil(packDays * 0.8), priority: 1 },
    { id: "pants", name: "Pantalones / Faldas", emoji: "👖", category: "clothing", quantity: Math.ceil(packDays / 2), priority: 1 },
    { id: "walking-shoes", name: "Zapatillas cómodas", emoji: "👟", category: "clothing", quantity: 1, priority: 1, reason: "Vas a caminar mucho" },
    { id: "sleepwear", name: "Pijama", emoji: "😴", category: "clothing", quantity: 1, priority: 2 },
  ]

  if (needsLaundry) {
    items.push({
      id: "laundry-bag",
      name: "Bolsa para ropa sucia",
      emoji: "🧺",
      category: "comfort",
      quantity: 1,
      priority: 2,
      reason: `${totalDays} días — planifica lavar ropa`,
    })
  }

  return items
}

// ─── Destination-specific items ───────────────────────────────────────────────

function getDestinationItems(destination: string, country: string): Omit<PackingItem, "packed">[] {
  const items: Omit<PackingItem, "packed">[] = []
  const dest = (destination + " " + country).toLowerCase()

  // Power adapter
  const needsUKAdapter = /reino unido|uk|united kingdom|london|england|irlanda|ireland/.test(dest)
  const needsUSAdapter = /estados unidos|usa|us|new york|miami|los angeles|japan|japón|tokyo|canada|canadá|méxico|mexico/.test(dest)
  const needsEUAdapter = /marruecos|morocco|israel|brasil|brazil|argentina|chile|australia|china|india|tailandia|thailand/.test(dest)

  if (needsUKAdapter) {
    items.push({ id: "adapter-uk", name: "Adaptador UK (tipo G)", emoji: "🔌", category: "tech", quantity: 1, priority: 1, reason: "Enchufes diferentes" })
  }
  if (needsUSAdapter) {
    items.push({ id: "adapter-us", name: "Adaptador US/JP (tipo A/B)", emoji: "🔌", category: "tech", quantity: 1, priority: 1, reason: "Enchufes diferentes" })
  }
  if (needsEUAdapter) {
    items.push({ id: "adapter-universal", name: "Adaptador universal", emoji: "🔌", category: "tech", quantity: 1, priority: 1, reason: "Enchufes diferentes" })
  }

  // Visa / health docs
  if (/eeuu|usa|us|estados unidos|australia|china|india|russia|rusia|vietnam|cambodia|camboya/.test(dest)) {
    items.push({ id: "visa", name: "Visado / ESTA / eTA", emoji: "📋", category: "documents", quantity: 1, priority: 1, reason: "Requiere visado o autorización" })
  }

  // Mosquito repellent
  if (/tailandia|thailand|vietnam|cambodia|bali|indonesia|kenya|tanzania|colombia|perú|peru|costa rica|sri lanka/.test(dest)) {
    items.push({ id: "mosquito-repellent", name: "Repelente de mosquitos", emoji: "🦟", category: "essentials", quantity: 1, priority: 1, reason: "Zona de mosquitos" })
    items.push({ id: "antimalarial", name: "Profilaxis malaria (consultar médico)", emoji: "💊", category: "essentials", quantity: 1, priority: 2, reason: "Consulta centro de vacunación" })
  }

  return items
}

// ─── Main generator ───────────────────────────────────────────────────────────

export interface GeneratePackingListOptions {
  tripId: string
  destination: string
  country: string
  totalDays: number
  activities: ActivityContext[]
  forecast?: DayWeather[]
  travelStyle?: string
}

export function generatePackingList(opts: GeneratePackingListOptions): PackingList {
  const allItems: Omit<PackingItem, "packed">[] = []
  const seen = new Set<string>()

  const addUnique = (items: Omit<PackingItem, "packed">[]) => {
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        allItems.push(item)
      }
    }
  }

  addUnique(BASE_ESSENTIALS)
  addUnique(getClothingForDuration(opts.totalDays))
  addUnique(getDestinationItems(opts.destination, opts.country))
  addUnique(getActivityItems(opts.activities))

  if (opts.forecast && opts.forecast.length > 0) {
    addUnique(getWeatherItems(opts.forecast))
  }

  // Build weather summary
  let weatherSummary: string | undefined
  if (opts.forecast && opts.forecast.length > 0) {
    const minT = Math.min(...opts.forecast.map(d => d.tempMin))
    const maxT = Math.max(...opts.forecast.map(d => d.tempMax))
    const rainDays = opts.forecast.filter(d => d.precipitationProbability > 40).length
    weatherSummary = `${minT}°–${maxT}°C${rainDays > 0 ? ` · ${rainDays} días con lluvia` : ""}`
  }

  // Sort by priority then category
  const sortOrder: PackingCategory[] = [
    "documents", "essentials", "clothing", "activity_specific", "tech", "toiletries", "comfort",
  ]

  const sorted = allItems
    .map(item => ({ ...item, packed: false }))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return sortOrder.indexOf(a.category) - sortOrder.indexOf(b.category)
    })

  return {
    tripId: opts.tripId,
    items: sorted,
    generatedAt: new Date().toISOString(),
    weatherSummary,
  }
}
