// Force the graceful no-op path in email.service so tests never hit Resend.
process.env.RESEND_API_KEY = "placeholder"

import test from "node:test"
import assert from "node:assert/strict"

import { processNightlyEmails } from "@/lib/services/nightly-email"

const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

function makeFakeSupabase(opts: {
  trips?: unknown[]
  snapshots?: Record<string, unknown>
  insertError?: { code: string; message: string } | null
}) {
  const calls = {
    inserts: [] as Record<string, unknown>[],
    userLookups: [] as string[],
  }

  const supabase = {
    from(table: string) {
      if (table === "trips") {
        return {
          select: () => ({
            lte: () => ({
              gte: () => ({
                in: () => ({
                  limit: async () => ({ data: opts.trips ?? [], error: null }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === "itinerary_versions") {
        return {
          select: () => ({
            eq: (_column: string, tripId: string) => ({
              order: () => ({
                limit: async () => ({
                  data: opts.snapshots?.[tripId]
                    ? [{ snapshot: opts.snapshots[tripId] }]
                    : [],
                  error: null,
                }),
              }),
            }),
          }),
        }
      }
      if (table === "trip_email_log") {
        return {
          insert: async (row: Record<string, unknown>) => {
            calls.inserts.push(row)
            return { error: opts.insertError ?? null }
          },
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
    auth: {
      admin: {
        getUserById: async (userId: string) => {
          calls.userLookups.push(userId)
          return { data: { user: { email: "viajero@example.com" } }, error: null }
        },
      },
    },
  }

  return { supabase, calls }
}

function makeTrip(overrides: Record<string, unknown> = {}) {
  return {
    id: "trip-1",
    user_id: "user-1",
    destination: "Madrid",
    start_date: tomorrow,
    end_date: tomorrow,
    ...overrides,
  }
}

function makeSnapshot(dayDate: string | null = tomorrow) {
  return {
    tripName: "Madrid",
    days: [
      {
        dayNumber: 1,
        date: dayDate,
        theme: "Centro histórico",
        isRestDay: false,
        activities: [
          { name: "Museo del Prado", type: "museo", location: "Paseo del Prado", time: "10:00", duration: 120, cost: 15 },
        ],
      },
    ],
  }
}

test("returns zeros when no trips have a day tomorrow", async () => {
  const { supabase, calls } = makeFakeSupabase({ trips: [] })

  const result = await processNightlyEmails(supabase)

  assert.deepEqual(result, { trips: 0, sent: 0, skipped: 0, failed: 0 })
  assert.equal(calls.inserts.length, 0)
})

test("logs with a per-day email type before attempting the send", async () => {
  const { supabase, calls } = makeFakeSupabase({
    trips: [makeTrip()],
    snapshots: { "trip-1": makeSnapshot() },
  })

  const result = await processNightlyEmails(supabase)

  assert.deepEqual(calls.inserts, [{ trip_id: "trip-1", email_type: "nightly-day-1" }])
  assert.deepEqual(calls.userLookups, ["user-1"])
  // Placeholder API key → sendEmail reports failure, never reaching Resend.
  assert.deepEqual(result, { trips: 1, sent: 0, skipped: 0, failed: 1 })
})

test("skips already-sent days without looking up the user", async () => {
  const { supabase, calls } = makeFakeSupabase({
    trips: [makeTrip()],
    snapshots: { "trip-1": makeSnapshot() },
    insertError: { code: "23505", message: "duplicate key value" },
  })

  const result = await processNightlyEmails(supabase)

  assert.deepEqual(result, { trips: 1, sent: 0, skipped: 1, failed: 0 })
  assert.equal(calls.userLookups.length, 0)
})

test("falls back to the day index when snapshot dates are null", async () => {
  const { supabase, calls } = makeFakeSupabase({
    trips: [makeTrip()],
    snapshots: { "trip-1": makeSnapshot(null) },
  })

  const result = await processNightlyEmails(supabase)

  assert.deepEqual(calls.inserts, [{ trip_id: "trip-1", email_type: "nightly-day-1" }])
  assert.deepEqual(result, { trips: 1, sent: 0, skipped: 0, failed: 1 })
})

test("skips trips without a snapshot and days without activities", async () => {
  const emptyDaySnapshot = {
    tripName: "Roma",
    days: [{ dayNumber: 1, date: tomorrow, theme: "", isRestDay: false, activities: [] }],
  }
  const { supabase, calls } = makeFakeSupabase({
    trips: [
      makeTrip(),
      makeTrip({ id: "trip-2", user_id: "user-2", destination: "Roma" }),
    ],
    snapshots: { "trip-2": emptyDaySnapshot },
  })

  const result = await processNightlyEmails(supabase)

  assert.deepEqual(result, { trips: 2, sent: 0, skipped: 2, failed: 0 })
  assert.equal(calls.inserts.length, 0, "nothing to announce → no log row consumed")
})
