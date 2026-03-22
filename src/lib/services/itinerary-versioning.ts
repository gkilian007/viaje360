import type { GeneratedItinerary } from "@/lib/supabase/database.types"

export type ItineraryVersionSource = "generate" | "manual" | "weather" | "fatigue" | "system"

export interface DbItineraryVersionInsert {
  trip_id: string
  version_number: number
  snapshot: GeneratedItinerary
  source: ItineraryVersionSource
  reason: string | null
  created_at: string
  created_by: string | null
}

export interface DbAdaptationEventInsert {
  trip_id: string
  from_version_id: string | null
  to_version_id: string
  reason: string
  source: ItineraryVersionSource
  created_at: string
  metadata: Record<string, unknown> | null
}

export function getNextVersionNumber(
  versions: Array<{ version_number: number }>
): number {
  if (versions.length === 0) return 1
  return Math.max(...versions.map((version) => version.version_number)) + 1
}

export function buildItineraryVersionInsert(input: {
  tripId: string
  versionNumber: number
  itinerary: GeneratedItinerary
  source: ItineraryVersionSource
  reason?: string | null
  createdAt: string
  createdBy?: string | null
}): DbItineraryVersionInsert {
  return {
    trip_id: input.tripId,
    version_number: input.versionNumber,
    snapshot: structuredClone(input.itinerary),
    source: input.source,
    reason: input.reason ?? null,
    created_at: input.createdAt,
    created_by: input.createdBy ?? null,
  }
}

export function buildAdaptationEventInsert(input: {
  tripId: string
  fromVersionId?: string | null
  toVersionId: string
  reason: string
  source: ItineraryVersionSource
  createdAt: string
  metadata?: Record<string, unknown> | null
}): DbAdaptationEventInsert {
  return {
    trip_id: input.tripId,
    from_version_id: input.fromVersionId ?? null,
    to_version_id: input.toVersionId,
    reason: input.reason,
    source: input.source,
    created_at: input.createdAt,
    metadata: input.metadata ?? null,
  }
}
