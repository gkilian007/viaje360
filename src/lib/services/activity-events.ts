import { createServiceClient } from "@/lib/supabase/server"
import { buildTripActivityEventInsert } from "@/lib/services/trip-learning"

// ── Event weight map ────────────────────────────────────────────────────────
// Each UI interaction has a different implicit-preference weight.
// Higher = stronger signal that the user is interested.

const EVENT_CATEGORY_WEIGHT: Record<string, number> = {
  detail_opened: 0.25,
  external_link_clicked: 0.6,
  bookmark_toggled: 0.4,
  share_clicked: 0.3,
  map_pin_clicked: 0.15,
  regeneration_requested: -0.5,
}

const EVENT_TAG_WEIGHT_RATIO = 0.4 // tags get 40% of the category weight

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

export function resolveActivityEventValue(
  eventType: string,
  metadata: Record<string, unknown>
): string | null {
  if (eventType === "detail_opened") {
    return typeof metadata.source === "string" ? metadata.source : null
  }

  if (eventType === "external_link_clicked") {
    return typeof metadata.linkKind === "string" ? metadata.linkKind : null
  }

  return null
}

export function buildActivityEventPreferenceUpdates(input: {
  eventType: string
  eventValue?: string | null
  category: string
  tags?: string[]
}): Array<{ signalType: string; signalKey: string; delta: number }> {
  const baseWeight = EVENT_CATEGORY_WEIGHT[input.eventType] ?? 0.1

  // External link clicks on menu/tickets are stronger signals
  let multiplier = 1
  if (input.eventType === "external_link_clicked" && input.eventValue) {
    if (["menu", "tickets", "booking"].includes(input.eventValue)) {
      multiplier = 1
    }
  }

  const categoryDelta = Number((baseWeight * multiplier).toFixed(2))
  const tagDelta = Number((baseWeight * EVENT_TAG_WEIGHT_RATIO * multiplier).toFixed(2))

  const updates: Array<{ signalType: string; signalKey: string; delta: number }> = []

  if (categoryDelta !== 0) {
    updates.push({
      signalType: "category",
      signalKey: normalizeName(input.category),
      delta: categoryDelta,
    })
  }

  for (const tag of input.tags ?? []) {
    if (tagDelta !== 0) {
      updates.push({
        signalType: "tag",
        signalKey: normalizeName(tag),
        delta: tagDelta,
      })
    }
  }

  return updates
}

// ── Persistence ─────────────────────────────────────────────────────────────

export async function saveActivityEvent(input: {
  tripId: string
  activityId: string
  activityKnowledgeId?: string | null
  userId?: string | null
  eventType: string
  metadata?: Record<string, unknown> | null
}) {
  const supabase = createServiceClient()
  const now = new Date().toISOString()
  const eventValue = resolveActivityEventValue(
    input.eventType,
    (input.metadata as Record<string, unknown>) ?? {}
  )

  const payload = buildTripActivityEventInsert({
    tripId: input.tripId,
    activityId: input.activityId,
    activityKnowledgeId: input.activityKnowledgeId ?? null,
    userId: input.userId ?? null,
    eventType: input.eventType,
    eventValue,
    metadata: input.metadata ?? null,
    createdAt: now,
  })

  const { error } = await supabase.from("trip_activity_events").insert(payload)

  if (error) {
    console.error("[activity-events] insert error:", error)
    throw error
  }

  return { eventValue }
}

export async function saveBatchActivityEvents(
  events: Array<{
    tripId: string
    activityId: string
    activityKnowledgeId?: string | null
    userId?: string | null
    eventType: string
    metadata?: Record<string, unknown> | null
  }>
) {
  if (events.length === 0) return

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const rows = events.map((input) => {
    const eventValue = resolveActivityEventValue(
      input.eventType,
      (input.metadata as Record<string, unknown>) ?? {}
    )

    return buildTripActivityEventInsert({
      tripId: input.tripId,
      activityId: input.activityId,
      activityKnowledgeId: input.activityKnowledgeId ?? null,
      userId: input.userId ?? null,
      eventType: input.eventType,
      eventValue,
      metadata: input.metadata ?? null,
      createdAt: now,
    })
  })

  const { error } = await supabase.from("trip_activity_events").insert(rows)

  if (error) {
    console.error("[activity-events] batch insert error:", error)
    throw error
  }
}
