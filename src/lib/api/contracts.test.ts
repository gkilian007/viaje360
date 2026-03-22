import test from "node:test"
import assert from "node:assert/strict"

import {
  chatRequestSchema,
  onboardingRequestSchema,
  weatherQuerySchema,
} from "./contracts"
import { createErrorBody } from "./responses"

test("onboardingRequestSchema rejects missing destination", () => {
  const result = onboardingRequestSchema.safeParse({
    destination: "",
    startDate: "2026-03-22",
    endDate: "2026-03-24",
    arrivalTime: null,
    departureTime: null,
    companion: null,
    groupSize: 2,
    kidsPets: [],
    mobility: null,
    hasMobilityNeeds: false,
    accommodationZone: "",
    interests: [],
    travelerStyle: null,
    famousLocal: 50,
    pace: 50,
    wantsRestDays: false,
    restDayFrequency: null,
    wakeTime: 30,
    wantsSiesta: false,
    budget: null,
    splurge: [],
    dietary: [],
    allergies: "",
    transport: [],
    weatherAdaptation: true,
    firstTime: null,
    mustSee: "",
    mustAvoid: "",
    alreadyBooked: "",
  })

  assert.equal(result.success, false)
})

test("chatRequestSchema trims and accepts message payloads", () => {
  const result = chatRequestSchema.parse({
    message: "  Hola  ",
    history: [{ role: "user", text: "Context" }],
    tripId: "trip-123",
  })

  assert.equal(result.message, "Hola")
  assert.equal(result.tripId, "trip-123")
  assert.equal(result.history.length, 1)
})

test("weatherQuerySchema coerces numeric query params", () => {
  const result = weatherQuerySchema.parse({
    lat: "41.38",
    lng: "2.17",
    days: "5",
  })

  assert.equal(result.lat, 41.38)
  assert.equal(result.lng, 2.17)
  assert.equal(result.days, 5)
})

test("createErrorBody exposes a typed validation error shape", () => {
  const body = createErrorBody("VALIDATION_ERROR", "Invalid request", {
    fieldErrors: { destination: ["Destination is required"] },
  })

  assert.deepEqual(body, {
    ok: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Invalid request",
      details: {
        fieldErrors: { destination: ["Destination is required"] },
      },
    },
  })
})
