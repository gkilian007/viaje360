import test from "node:test"
import assert from "node:assert/strict"

// Force the graceful no-op path in email.service so tests never hit Resend.
process.env.RESEND_API_KEY = "placeholder"

import { processCheckinReminders } from "./checkin-reminder"

const TRIP = {
  id: "trip-1",
  user_id: "user-1",
  name: "Madrid",
  destination: "Madrid",
  country: "España",
  start_date: "2026-06-15",
  end_date: "2026-06-16",
}

interface FakeOptions {
  trips?: object[]
  insertError?: object | null
}

function makeFakeSupabase(opts: FakeOptions) {
  const calls: { inserts: object[]; userLookups: string[] } = { inserts: [], userLookups: [] }

  const supabase = {
    from(table: string) {
      if (table === "trips") {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({
                limit: async () => ({ data: opts.trips ?? [], error: null }),
              }),
            }),
          }),
        }
      }
      if (table === "trip_email_log") {
        return {
          insert: async (row: object) => {
            calls.inserts.push(row)
            return { error: opts.insertError ?? null }
          },
        }
      }
      throw new Error(`unexpected table ${table}`)
    },
    auth: {
      admin: {
        getUserById: async (id: string) => {
          calls.userLookups.push(id)
          return { data: { user: { email: "owner@example.com" } }, error: null }
        },
      },
    },
  }

  return { supabase, calls }
}

test("processCheckinReminders returns zeros when no trips start tomorrow", async () => {
  const { supabase, calls } = makeFakeSupabase({ trips: [] })
  const result = await processCheckinReminders(supabase)
  assert.deepEqual(result, { trips: 0, sent: 0, skipped: 0, failed: 0 })
  assert.equal(calls.inserts.length, 0)
})

test("processCheckinReminders logs before sending and looks up the owner email", async () => {
  const { supabase, calls } = makeFakeSupabase({ trips: [TRIP] })
  const result = await processCheckinReminders(supabase)

  assert.deepEqual(calls.inserts, [{ trip_id: "trip-1", email_type: "checkin_reminder" }])
  assert.deepEqual(calls.userLookups, ["user-1"])
  // RESEND_API_KEY is a placeholder in tests, so the send itself reports failure
  assert.equal(result.trips, 1)
  assert.equal(result.failed, 1)
  assert.equal(result.skipped, 0)
})

test("processCheckinReminders skips trips already logged (unique violation)", async () => {
  const { supabase, calls } = makeFakeSupabase({
    trips: [TRIP],
    insertError: { code: "23505", message: "duplicate key value" },
  })
  const result = await processCheckinReminders(supabase)

  assert.deepEqual(result, { trips: 1, sent: 0, skipped: 1, failed: 0 })
  // No email lookup happens for an already-handled trip
  assert.equal(calls.userLookups.length, 0)
})
