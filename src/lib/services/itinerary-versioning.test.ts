import test from "node:test"
import assert from "node:assert/strict"

import {
  buildAdaptationEventInsert,
  buildItineraryVersionInsert,
  getNextVersionNumber,
} from "./itinerary-versioning"
import type { GeneratedItinerary } from "@/lib/supabase/database.types"

const itinerary: GeneratedItinerary = {
  tripName: "Madrid Escape",
  days: [
    {
      dayNumber: 1,
      date: "2026-05-01",
      theme: "Centro",
      isRestDay: false,
      activities: [
        {
          name: "Museo del Prado",
          type: "museum",
          location: "Madrid",
          time: "10:00",
          endTime: "12:00",
          duration: 120,
          cost: 15,
        },
      ],
    },
  ],
}

test("getNextVersionNumber returns 1 for new trips and increments from latest version", () => {
  assert.equal(getNextVersionNumber([]), 1)
  assert.equal(
    getNextVersionNumber([
      { version_number: 1 },
      { version_number: 3 },
      { version_number: 2 },
    ]),
    4
  )
})

test("buildItineraryVersionInsert creates immutable snapshot payload", () => {
  const insertedAt = "2026-03-22T22:00:00.000Z"
  const payload = buildItineraryVersionInsert({
    tripId: "trip-1",
    versionNumber: 1,
    itinerary,
    source: "generate",
    reason: "Initial generated itinerary",
    createdAt: insertedAt,
    createdBy: "user-1",
  })

  assert.equal(payload.trip_id, "trip-1")
  assert.equal(payload.version_number, 1)
  assert.equal(payload.source, "generate")
  assert.equal(payload.reason, "Initial generated itinerary")
  assert.equal(payload.created_at, insertedAt)
  assert.equal(payload.created_by, "user-1")
  assert.notEqual(payload.snapshot, itinerary)
  assert.deepEqual(payload.snapshot, itinerary)
})

test("buildAdaptationEventInsert links the previous and new itinerary versions", () => {
  const createdAt = "2026-03-22T22:05:00.000Z"
  const payload = buildAdaptationEventInsert({
    tripId: "trip-1",
    fromVersionId: "version-1",
    toVersionId: "version-2",
    reason: "Rain all afternoon",
    source: "weather",
    createdAt,
    metadata: { trigger: "forecast" },
  })

  assert.deepEqual(payload, {
    trip_id: "trip-1",
    from_version_id: "version-1",
    to_version_id: "version-2",
    reason: "Rain all afternoon",
    source: "weather",
    created_at: createdAt,
    metadata: { trigger: "forecast" },
  })
})
