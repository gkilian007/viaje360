import test from "node:test"
import assert from "node:assert/strict"

import {
  buildFallbackItinerary,
  runReliableGenerationPipeline,
  validateAndRepairItinerary,
} from "./itinerary-reliability"
import type { OnboardingData } from "@/lib/onboarding-types"

const onboarding: OnboardingData = {
  destination: "Barcelona",
  startDate: "2026-04-10",
  endDate: "2026-04-11",
  arrivalTime: null,
  departureTime: null,
  companion: "familia",
  groupSize: 3,
  kidsPets: ["ninos"],
  mobility: "reduced",
  hasMobilityNeeds: true,
  accommodationZone: "Eixample",
  accommodationLat: null,
  accommodationLng: null,
  interests: ["historia", "gastronomia"],
  travelerStyle: "cultural",
  famousLocal: 50,
  pace: 45,
  wantsRestDays: false,
  restDayFrequency: null,
  wakeTime: 30,
  wantsSiesta: true,
  budget: "economico",
  splurge: [],
  dietary: ["vegetariano"],
  allergies: "",
  transport: ["pie", "publico"],
  weatherAdaptation: true,
  firstTime: true,
  mustSee: "Sagrada Familia",
  mustAvoid: "nightclubs",
  alreadyBooked: "Sagrada Familia 2026-04-10 10:00",
}

test("validateAndRepairItinerary repairs malformed times, overlaps and invalid constraints", () => {
  const raw = JSON.stringify({
    tripName: "Barcelona Sprint",
    days: [
      {
        dayNumber: 9,
        date: "April 10",
        theme: "Highlights",
        isRestDay: false,
        activities: [
          {
            name: "Sagrada Familia",
            type: "monument",
            location: "Eixample",
            time: "10am",
            duration: 90,
            cost: 80,
            notes: "Booked ticket",
          },
          {
            name: "Hilltop stair climb viewpoint",
            type: "tour",
            location: "Montjuic",
            time: "14:30",
            endTime: "15:30",
            duration: 60,
            cost: 50,
            notes: "lots of stairs and steep climb",
          },
          {
            name: "Cocktail club",
            type: "tour",
            location: "Center",
            time: "15:00",
            duration: 60,
            cost: 120,
          },
        ],
      },
    ],
  })

  const result = validateAndRepairItinerary(raw, onboarding)
  const firstDay = result.itinerary.days[0]

  assert.equal(firstDay.date, "2026-04-10")
  assert.equal(firstDay.dayNumber, 1)
  assert.equal(firstDay.activities[0]?.time, "10:00")
  assert.ok(firstDay.activities.every((activity) => !activity.name.toLowerCase().includes("cocktail club")))
  assert.ok(firstDay.activities.every((activity) => !activity.name.toLowerCase().includes("stair climb")))
  assert.ok(firstDay.activities.every((activity) => activity.time < "14:00" || activity.time >= "16:00"))
  assert.ok(result.warnings.some((warning) => warning.code === "siesta_repaired"))
  assert.ok(result.warnings.some((warning) => warning.code === "constraint_replaced"))
})

test("runReliableGenerationPipeline retries invalid payloads and succeeds without fallback", async () => {
  const invalid = "not-json"
  const valid = JSON.stringify({
    tripName: "Barcelona Recovery",
    days: [
      {
        dayNumber: 1,
        date: "2026-04-10",
        theme: "Centro histórico",
        isRestDay: false,
        activities: [
          {
            name: "Sagrada Familia",
            type: "monument",
            location: "Eixample",
            time: "10:00",
            endTime: "11:30",
            duration: 90,
            cost: 25,
            notes: "Booked ticket",
          },
        ],
      },
      {
        dayNumber: 2,
        date: "2026-04-11",
        theme: "Día de playa",
        isRestDay: false,
        activities: [],
      },
    ],
  })

  let attempts = 0
  const result = await runReliableGenerationPipeline(invalid, onboarding, {
    mode: "generate",
    maxAttempts: 3,
    onAttempt: async () => {
      attempts += 1
      return valid
    },
  })

  assert.equal(result.usedFallback, false)
  assert.equal(result.attempts, 2)
  assert.equal(attempts, 1)
  assert.equal(result.itinerary.days.length, 2)
})

test("buildFallbackItinerary returns a minimal coherent itinerary in Spanish", () => {
  const fallback = buildFallbackItinerary(onboarding)

  assert.equal(fallback.itinerary.tripName, "Lo esencial de Barcelona")
  assert.equal(fallback.itinerary.days.length, 2)
  assert.ok(fallback.itinerary.days.every((day) => day.activities.length >= 3))
  assert.ok(
    fallback.itinerary.days.every((day) =>
      day.activities.every((activity) => !/orientation walk|family-friendly|flexible/i.test(activity.name))
    )
  )
  assert.ok(fallback.warnings.some((warning) => warning.code === "json_extract_failed"))
})

test("runReliableGenerationPipeline rejects generic content and retries", async () => {
  const generic = JSON.stringify({
    tripName: "Barcelona Adventure",
    days: [
      {
        dayNumber: 1,
        date: "2026-04-10",
        theme: "Day 1",
        isRestDay: false,
        activities: [
          { name: "Free time", type: "tour", location: "Centro", time: "10:00", endTime: "11:00", duration: 60, cost: 0 },
        ],
      },
      { dayNumber: 2, date: "2026-04-11", theme: "Playa", isRestDay: false, activities: [] },
    ],
  })
  const corrected = JSON.stringify({
    tripName: "Barcelona en familia",
    days: [
      {
        dayNumber: 1,
        date: "2026-04-10",
        theme: "Centro histórico",
        isRestDay: false,
        activities: [
          { name: "Catedral de Barcelona", type: "monument", location: "Barrio Gótico", time: "10:00", endTime: "11:30", duration: 90, cost: 9 },
        ],
      },
      { dayNumber: 2, date: "2026-04-11", theme: "Día de playa", isRestDay: false, activities: [] },
    ],
  })

  const result = await runReliableGenerationPipeline(generic, onboarding, {
    mode: "generate",
    maxAttempts: 3,
    onAttempt: async () => corrected,
  })

  assert.equal(result.usedFallback, false)
  assert.equal(result.attempts, 2)
  assert.ok(result.failureReasons[0]?.includes("Generic content rejected"))
  assert.ok(result.failureReasons[0]?.includes("Free time"))
  assert.equal(result.itinerary.tripName, "Barcelona en familia")
})

test("validateAndRepairItinerary allows the alojamiento generic names", () => {
  const raw = JSON.stringify({
    tripName: "Madrid con niños",
    days: [
      {
        dayNumber: 1,
        date: "2026-04-10",
        theme: "Centro histórico",
        isRestDay: false,
        activities: [
          { name: "Salida del alojamiento", type: "tour", location: "Eixample", time: "09:00", endTime: "09:30", duration: 30, cost: 0 },
          { name: "Museo del Prado", type: "museum", location: "Paseo del Prado", time: "10:00", endTime: "12:00", duration: 120, cost: 15 },
          { name: "Vuelta al alojamiento", type: "tour", location: "Eixample", time: "18:00", endTime: "18:30", duration: 30, cost: 0 },
        ],
      },
    ],
  })

  const result = validateAndRepairItinerary(raw, { ...onboarding, destination: "Madrid", alreadyBooked: "" })
  const names = result.itinerary.days[0].activities.map((activity) => activity.name)

  assert.ok(names.includes("Salida del alojamiento"))
  assert.ok(names.includes("Vuelta al alojamiento"))
  assert.equal(result.itinerary.days[1]?.theme, "Día 2 en Madrid")
})

test("validateAndRepairItinerary rejects generic English trip names", () => {
  const raw = JSON.stringify({
    tripName: "Madrid Adventure",
    days: [
      {
        dayNumber: 1,
        date: "2026-04-10",
        theme: "Centro histórico",
        isRestDay: false,
        activities: [
          { name: "Museo del Prado", type: "museum", location: "Paseo del Prado", time: "10:00", endTime: "12:00", duration: 120, cost: 15 },
        ],
      },
    ],
  })

  assert.throws(
    () => validateAndRepairItinerary(raw, { ...onboarding, destination: "Madrid", alreadyBooked: "" }),
    /Generic content rejected/
  )
})

test("validateAndRepairItinerary preserves activity lat/lng from the model", () => {
  const raw = JSON.stringify({
    tripName: "Madrid Coordenadas",
    days: [
      {
        dayNumber: 1,
        date: "2026-04-10",
        theme: "Centro histórico",
        isRestDay: false,
        activities: [
          {
            name: "Museo del Prado",
            type: "museum",
            location: "Paseo del Prado",
            time: "10:00",
            endTime: "12:00",
            duration: 120,
            cost: 15,
            lat: 40.4138,
            lng: -3.6921,
          },
          {
            name: "Plaza Mayor",
            type: "monument",
            location: "Centro",
            time: "12:30",
            endTime: "13:30",
            duration: 60,
            cost: 0,
            lat: "40.4155",
            lng: "-3.7074",
          },
          {
            name: "Comida en La Latina",
            type: "restaurant",
            location: "La Latina",
            time: "14:00",
            endTime: "15:30",
            duration: 90,
            cost: 20,
          },
        ],
      },
    ],
  })

  const result = validateAndRepairItinerary(raw, { ...onboarding, destination: "Madrid", mobility: "full", hasMobilityNeeds: false })
  const activities = result.itinerary.days[0].activities
  const prado = activities.find((a) => a.name === "Museo del Prado")
  const plaza = activities.find((a) => a.name === "Plaza Mayor")
  const comida = activities.find((a) => a.name === "Comida en La Latina")

  assert.equal(prado?.lat, 40.4138)
  assert.equal(prado?.lng, -3.6921)
  assert.equal(plaza?.lat, 40.4155)
  assert.equal(plaza?.lng, -3.7074)
  assert.equal(comida?.lat, undefined)
  assert.equal(comida?.lng, undefined)
})
