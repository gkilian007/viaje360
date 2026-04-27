import type { DbActivityKnowledge } from "@/lib/supabase/database.types"
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { getMadridTransportSeedRows, MADRID_TRANSPORT_SOURCE_KIND } from "@/lib/madrid-transport"

export interface MadridTransportKnowledgeItem {
  name: string
  category: string
  address: string | null
  tags: string[]
  officialUrl: string | null
  metadata: Record<string, unknown>
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function mapRow(row: Pick<DbActivityKnowledge, "canonical_name" | "category" | "address" | "tags" | "official_url" | "metadata">): MadridTransportKnowledgeItem {
  return {
    name: row.canonical_name,
    category: row.category,
    address: row.address ?? null,
    tags: Array.isArray(row.tags) ? row.tags.filter((tag): tag is string => typeof tag === "string") : [],
    officialUrl: row.official_url ?? null,
    metadata: row.metadata ?? {},
  }
}

function rankTransportRows(rows: MadridTransportKnowledgeItem[], queryTerms: string[]): MadridTransportKnowledgeItem[] {
  const normalizedTerms = queryTerms.map(normalizeText).filter(Boolean)
  if (normalizedTerms.length === 0) return rows

  return [...rows].sort((a, b) => scoreRow(b, normalizedTerms) - scoreRow(a, normalizedTerms))
}

function scoreRow(row: MadridTransportKnowledgeItem, terms: string[]): number {
  const haystack = [
    row.name,
    row.category,
    row.address ?? "",
    ...row.tags,
    ...Object.values(row.metadata ?? {}).flatMap((value) => Array.isArray(value) ? value.map(String) : [String(value)]),
  ]
    .map((value) => normalizeText(value))
    .join(" | ")

  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0)
}

export async function getMadridTransportKnowledge(options?: {
  queryTerms?: string[]
  limit?: number
  profileContext?: MadridTransportProfileContext
}): Promise<MadridTransportKnowledgeItem[]> {
  const limit = options?.limit ?? 24
  const queryTerms = options?.queryTerms ?? []

  if (isSupabaseConfigured()) {
    try {
      const supabase = createServiceClient()
      const { data, error } = await supabase
        .from("activity_knowledge")
        .select("canonical_name,category,address,tags,official_url,metadata")
        .eq("destination", "Madrid")
        .eq("source_kind", MADRID_TRANSPORT_SOURCE_KIND)
        .order("updated_at", { ascending: false })
        .limit(200)

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((row) => mapRow(row as Pick<DbActivityKnowledge, "canonical_name" | "category" | "address" | "tags" | "official_url" | "metadata">))
        return rankTransportRows(mapped, queryTerms).slice(0, limit)
      }
    } catch (error) {
      console.warn("[madrid-transport-knowledge] Supabase lookup failed, using local fallback", error)
    }
  }

  const fallback = getMadridTransportSeedRows().map((row) => ({
    name: row.canonical_name,
    category: row.category,
    address: row.address,
    tags: row.tags,
    officialUrl: row.official_url,
    metadata: row.metadata,
  }))

  return rankTransportRows(fallback, queryTerms).slice(0, limit)
}

export async function formatMadridTransportContextForPrompt(options?: {
  queryTerms?: string[]
  limit?: number
  profileContext?: MadridTransportProfileContext
}): Promise<string> {
  const items = await getMadridTransportKnowledge(options)
  if (items.length === 0) return ""

  const transportSummary = deriveTransportSummary(options?.profileContext)
  const lines = [
    "Madrid transport knowledge (DB-first, deterministic):",
    `- traveler transport profile: recommended=${transportSummary.recommendedModes.join(", ")} | avoid=${transportSummary.avoidModes.join(", ") || "none"} | station_friction=${transportSummary.stationFriction} | walking_pace=${transportSummary.walkingPaceAdjustment}`,
    ...transportSummary.warnings.map((warning) => `- warning: ${warning}`),
  ]

  for (const item of items) {
    const meta = item.metadata ?? {}
    const fit = assessMadridTransportFit(item, options?.profileContext)
    const mode = getMadridRecommendedMode(item, options?.profileContext)
    const segment = decideMadridSegmentMode(item, { profileContext: options?.profileContext, distanceMeters: 900, timeOfDay: "afternoon" })
    const linesMeta = Array.isArray(meta.lines) ? ` líneas ${meta.lines.join(", ")}` : ""
    const zoneMeta = typeof meta.zone === "string" ? ` · zona ${meta.zone}` : ""
    const accessMeta = typeof meta.accessibility_status === "string" ? ` · accesibilidad ${meta.accessibility_status}` : ""
    const fitMeta = ` · fit ${fit.fitLabel} · +${fit.extraMinutes} min`
    const modeMeta = ` · modo ${mode.recommendedMode}`
    const segmentMeta = ` · tramo ${segment.preferredMode} (${segment.transportMinutes} min transp. vs ${segment.walkMinutes} min andando)`
    const noteMeta = typeof meta.note === "string" ? ` · ${meta.note}` : ""
    const reasonMeta = fit.reasons.length > 0 ? ` · ${fit.reasons.join(", ")}` : ""
    lines.push(`- ${item.name} (${item.category})${linesMeta}${zoneMeta}${accessMeta}${fitMeta}${modeMeta}${segmentMeta}${noteMeta}${reasonMeta}`)
  }

  lines.push(
    "Úsalo como capa fiable para elegir estaciones/hubs y evitar inventar transporte Madrid demasiado genérico."
  )

  return `\n\n${lines.join("\n")}`
}


export interface MadridTransportProfileContext {
  mobility?: string | null
  kidsPets?: string[] | null
  transport?: string[] | null
  luggageLevel?: "light" | "medium" | "heavy"
}

export interface MadridTransportRecommendationSummary {
  recommendedModes: string[]
  avoidModes: string[]
  stationFriction: "low" | "medium" | "high"
  walkingPaceAdjustment: "normal" | "slow" | "very-slow"
  warnings: string[]
}

export interface MadridTransportFitAssessment {
  fitLabel: "recommended" | "caution" | "avoid"
  extraMinutes: number
  reasons: string[]
}

export interface MadridDoorToDoorEstimate {
  walkToStopMinutes: number
  waitMinutes: number
  rideMinutes: number
  stationExtraMinutes: number
  totalMinutes: number
  paceLabel: "normal" | "slow" | "very-slow"
  recommended: boolean
  rationale: string
}

export interface MadridModeGuidance {
  recommendedMode: "walk" | "bus" | "metro" | "taxi" | "mixed"
  reason: string
}

export interface MadridSegmentDecision {
  preferredMode: "walk" | "bus" | "metro" | "taxi" | "mixed"
  walkMinutes: number
  transportMinutes: number
  timeSavedMinutes: number
  rationale: string
}

function deriveTransportSummary(context?: MadridTransportProfileContext): MadridTransportRecommendationSummary {
  const mobility = context?.mobility ?? null
  const kidsPets = context?.kidsPets ?? []
  const transport = context?.transport ?? []
  const luggageLevel = context?.luggageLevel ?? "light"

  const warnings: string[] = []
  const recommendedModes = new Set<string>()
  const avoidModes = new Set<string>()
  let stationFriction: MadridTransportRecommendationSummary["stationFriction"] = "low"
  let walkingPaceAdjustment: MadridTransportRecommendationSummary["walkingPaceAdjustment"] = "normal"

  if (mobility === "wheelchair") {
    recommendedModes.add("accessible-bus")
    recommendedModes.add("taxi")
    avoidModes.add("metro-with-unknown-access")
    stationFriction = "high"
    walkingPaceAdjustment = "very-slow"
    warnings.push("Avoid metro stations with unknown or partial accessibility unless there is explicit confirmation of step-free access.")
  } else if (mobility === "frequent-rest" || mobility === "reduced" || mobility === "moderate") {
    recommendedModes.add("bus")
    recommendedModes.add("taxi")
    stationFriction = "medium"
    walkingPaceAdjustment = "slow"
    warnings.push("Keep transfers short and reduce interchange complexity when possible.")
  }

  if (kidsPets.includes("bebe") || kidsPets.includes("ninos")) {
    recommendedModes.add("bus")
    stationFriction = stationFriction === "high" ? "high" : "medium"
    walkingPaceAdjustment = mobility === "wheelchair" ? "very-slow" : "slow"
    warnings.push("Stroller/family context: allow extra time for station access, lifts, and boarding.")
  }

  if (luggageLevel === "medium" || luggageLevel === "heavy") {
    recommendedModes.add("taxi")
    stationFriction = luggageLevel === "heavy" ? "high" : stationFriction === "low" ? "medium" : stationFriction
    walkingPaceAdjustment = luggageLevel === "heavy" ? "very-slow" : walkingPaceAdjustment === "normal" ? "slow" : walkingPaceAdjustment
    warnings.push("Walking and station access should be slower than default because of luggage/carry load.")
  }

  if (transport.includes("publico")) {
    recommendedModes.add("public-transport")
  }
  if (transport.includes("taxi")) {
    recommendedModes.add("taxi")
  }

  if (recommendedModes.size === 0) {
    recommendedModes.add("walk")
    recommendedModes.add("public-transport")
  }

  return {
    recommendedModes: [...recommendedModes],
    avoidModes: [...avoidModes],
    stationFriction,
    walkingPaceAdjustment,
    warnings,
  }
}

export function assessMadridTransportFit(
  item: MadridTransportKnowledgeItem,
  context?: MadridTransportProfileContext
): MadridTransportFitAssessment {
  const meta = item.metadata ?? {}
  const accessibility = typeof meta.accessibility_status === "string" ? meta.accessibility_status : "unknown"
  const isInterchange = Boolean(meta.isInterchange)
  const mode = typeof meta.mode === "string" ? meta.mode : item.category
  const mobility = context?.mobility ?? null
  const kidsPets = context?.kidsPets ?? []
  const luggageLevel = context?.luggageLevel ?? "light"

  let extraMinutes = 0
  const reasons: string[] = []

  if (accessibility === "accessible") {
    reasons.push("confirmed accessibility")
  }
  if (accessibility === "unknown") {
    extraMinutes += 4
    reasons.push("accessibility unknown")
  }
  if (accessibility === "partial" || accessibility === "works_announced" || accessibility === "planned_upgrade") {
    extraMinutes += 7
    reasons.push(`accessibility state: ${accessibility}`)
  }
  if (isInterchange) {
    extraMinutes += 4
    reasons.push("interchange complexity")
  }
  if (mode.includes("interchange")) {
    extraMinutes += 3
  }

  if (mobility === "wheelchair") {
    extraMinutes += accessibility === "accessible" ? 4 : 12
    reasons.push("wheelchair profile")
  } else if (mobility === "reduced" || mobility === "frequent-rest" || mobility === "moderate") {
    extraMinutes += 5
    reasons.push("reduced walking/transfer tolerance")
  }

  if (kidsPets.includes("bebe") || kidsPets.includes("ninos")) {
    extraMinutes += 4
    reasons.push("stroller/family boarding friction")
  }

  if (luggageLevel === "medium") {
    extraMinutes += 4
    reasons.push("luggage slows walking and station access")
  } else if (luggageLevel === "heavy") {
    extraMinutes += 8
    reasons.push("heavy luggage strongly penalizes walking/transfers")
  }

  let fitLabel: MadridTransportFitAssessment["fitLabel"] = "recommended"
  if (mobility === "wheelchair" && accessibility !== "accessible") {
    fitLabel = "avoid"
  } else if (extraMinutes >= 12) {
    fitLabel = "avoid"
  } else if (extraMinutes >= 6) {
    fitLabel = "caution"
  }

  return {
    fitLabel,
    extraMinutes,
    reasons,
  }
}

export function getMadridRecommendedMode(
  item: MadridTransportKnowledgeItem,
  context?: MadridTransportProfileContext
): MadridModeGuidance {
  const fit = assessMadridTransportFit(item, context)
  const meta = item.metadata ?? {}
  const accessibility = typeof meta.accessibility_status === "string" ? meta.accessibility_status : "unknown"
  const mode = typeof meta.mode === "string" ? meta.mode : item.category
  const mobility = context?.mobility ?? null
  const kidsPets = context?.kidsPets ?? []
  const luggageLevel = context?.luggageLevel ?? "light"

  if (mobility === "wheelchair") {
    return accessibility === "accessible"
      ? { recommendedMode: "bus", reason: "Wheelchair profile: prefer simpler confirmed-access access, bus/taxi before complex station navigation." }
      : { recommendedMode: "taxi", reason: "Wheelchair profile with non-confirmed accessibility: taxi is the safer default around this node." }
  }

  if (kidsPets.includes("bebe") || kidsPets.includes("ninos")) {
    if (fit.fitLabel === "avoid") {
      return { recommendedMode: "taxi", reason: "Family/stroller context plus high station friction: prefer taxi over a complex transfer." }
    }
    return { recommendedMode: "bus", reason: "Family/stroller context: bus is usually easier than a complex metro interchange." }
  }

  if (luggageLevel === "heavy") {
    return { recommendedMode: "taxi", reason: "Heavy luggage: taxi reduces long access corridors, stairs and transfer friction." }
  }

  if (fit.fitLabel === "avoid") {
    return { recommendedMode: "taxi", reason: "This node is a poor fit for the traveler profile; prefer a simpler taxi alternative nearby." }
  }

  if (fit.fitLabel === "caution") {
    return mode.includes("metro") || mode.includes("station")
      ? { recommendedMode: "bus", reason: "Caution-level node: bus is the safer default unless metro is clearly worth the extra friction." }
      : { recommendedMode: "mixed", reason: "Use a simpler mixed transfer and avoid overloading this node with tight timing." }
  }

  return mode.includes("metro") || mode.includes("station")
    ? { recommendedMode: "metro", reason: "Good fit node with manageable friction for this traveler profile." }
    : { recommendedMode: "mixed", reason: "Use this node as part of a simple transfer chain with manageable effort." }
}

export function decideMadridSegmentMode(
  item: MadridTransportKnowledgeItem,
  options?: {
    distanceMeters?: number
    timeOfDay?: "morning" | "afternoon" | "evening" | "night"
    profileContext?: MadridTransportProfileContext
  }
): MadridSegmentDecision {
  const distanceMeters = Math.max(150, options?.distanceMeters ?? 900)
  const pace = deriveTransportSummary(options?.profileContext).walkingPaceAdjustment
  const walkingKmh = pace === "very-slow" ? 2.2 : pace === "slow" ? 3.2 : 4.6
  const walkMinutes = Math.max(4, Math.round((distanceMeters / 1000) / walkingKmh * 60))
  const transportEstimate = estimateMadridDoorToDoor(item, options)
  const modeGuidance = getMadridRecommendedMode(item, options?.profileContext)
  const timeSavedMinutes = Math.max(0, walkMinutes - transportEstimate.totalMinutes)

  if (modeGuidance.recommendedMode === "taxi") {
    return {
      preferredMode: "taxi",
      walkMinutes,
      transportMinutes: transportEstimate.totalMinutes,
      timeSavedMinutes,
      rationale: `${modeGuidance.reason} Walking the whole segment would be comparatively harder for this traveler profile.`,
    }
  }

  if (walkMinutes <= 12 && transportEstimate.stationExtraMinutes >= 6) {
    return {
      preferredMode: "walk",
      walkMinutes,
      transportMinutes: transportEstimate.totalMinutes,
      timeSavedMinutes,
      rationale: "Short segment with relatively high station friction: walking is the simpler choice.",
    }
  }

  if (transportEstimate.recommended && transportEstimate.totalMinutes + 3 < walkMinutes) {
    return {
      preferredMode: modeGuidance.recommendedMode,
      walkMinutes,
      transportMinutes: transportEstimate.totalMinutes,
      timeSavedMinutes,
      rationale: `${modeGuidance.reason} Estimated door-to-door time beats walking with manageable friction.`,
    }
  }

  if (walkMinutes <= 18 && pace !== "very-slow") {
    return {
      preferredMode: "walk",
      walkMinutes,
      transportMinutes: transportEstimate.totalMinutes,
      timeSavedMinutes,
      rationale: "Segment is still comfortably walkable for the current traveler pace, without forcing a transfer.",
    }
  }

  return {
    preferredMode: modeGuidance.recommendedMode,
    walkMinutes,
    transportMinutes: transportEstimate.totalMinutes,
    timeSavedMinutes,
    rationale: `${modeGuidance.reason} Use transport to keep the route realistic for this traveler profile.`,
  }
}

export function estimateMadridDoorToDoor(
  item: MadridTransportKnowledgeItem,
  options?: {
    distanceMeters?: number
    timeOfDay?: "morning" | "afternoon" | "evening" | "night"
    profileContext?: MadridTransportProfileContext
  }
): MadridDoorToDoorEstimate {
  const fit = assessMadridTransportFit(item, options?.profileContext)
  const distanceMeters = Math.max(150, options?.distanceMeters ?? 900)
  const pace: MadridDoorToDoorEstimate["paceLabel"] = deriveTransportSummary(options?.profileContext).walkingPaceAdjustment
  const baseWalkingKmh = pace === "very-slow" ? 2.2 : pace === "slow" ? 3.2 : 4.6
  const walkToStopMeters = Math.min(Math.max(Math.round(distanceMeters * 0.22), 180), 900)
  const walkToStopMinutes = Math.max(3, Math.round((walkToStopMeters / 1000) / baseWalkingKmh * 60))

  const timeOfDay = options?.timeOfDay ?? "afternoon"
  const waitMinutes = timeOfDay === "night" ? 9 : timeOfDay === "evening" ? 6 : 5
  const rideMinutes = Math.max(4, Math.round(distanceMeters < 1200 ? distanceMeters / 220 : distanceMeters / 320))
  const stationExtraMinutes = fit.extraMinutes
  const totalMinutes = walkToStopMinutes + waitMinutes + rideMinutes + stationExtraMinutes
  const recommended = fit.fitLabel === "recommended"

  return {
    walkToStopMinutes,
    waitMinutes,
    rideMinutes,
    stationExtraMinutes,
    totalMinutes,
    paceLabel: pace,
    recommended,
    rationale: recommended
      ? `Estimated door-to-door transfer with manageable station friction for this traveler profile.`
      : `Door-to-door estimate penalized by accessibility/interchange/profile friction; use with caution or prefer a simpler mode.`,
  }
}
