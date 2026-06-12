import test from "node:test"
import assert from "node:assert/strict"

import { buildKiwiFlightsUrl, buildGoogleFlightsUrl, buildBookingUrl } from "./affiliate"

// ─── buildKiwiFlightsUrl ──────────────────────────────────────────────────────

test("buildKiwiFlightsUrl builds city-country slug with dates", () => {
  const url = buildKiwiFlightsUrl("Madrid", "España", "2026-06-15", "2026-06-16")
  assert.equal(url, "https://www.kiwi.com/es/search/results/-/madrid-espana/2026-06-15/2026-06-16/")
})

test("buildKiwiFlightsUrl strips accents and collapses spaces", () => {
  const url = buildKiwiFlightsUrl("San Sebastián", "España", "2026-07-01", "2026-07-05")
  assert.equal(
    url,
    "https://www.kiwi.com/es/search/results/-/san-sebastian-espana/2026-07-01/2026-07-05/"
  )
})

// ─── buildGoogleFlightsUrl ────────────────────────────────────────────────────

test("buildGoogleFlightsUrl uses the on/through phrasing that prefills both dates", () => {
  const url = buildGoogleFlightsUrl("Madrid", "2026-06-15", "2026-06-16")
  assert.equal(
    url,
    "https://www.google.com/travel/flights?hl=es&q=flights%20to%20Madrid%20on%202026-06-15%20through%202026-06-16"
  )
})

test("buildGoogleFlightsUrl encodes multi-word destinations", () => {
  const url = buildGoogleFlightsUrl("Buenos Aires", "2026-09-01", "2026-09-10")
  assert.ok(url.includes("flights%20to%20Buenos%20Aires%20on%202026-09-01"))
})

// ─── buildBookingUrl ──────────────────────────────────────────────────────────

test("buildBookingUrl includes dates when both are provided", () => {
  const url = buildBookingUrl("Madrid", "2026-06-15", "2026-06-16")
  assert.ok(url.includes("ss=Madrid"))
  assert.ok(url.includes("&checkin=2026-06-15&checkout=2026-06-16"))
})

test("buildBookingUrl omits dates when missing", () => {
  const url = buildBookingUrl("Madrid")
  assert.ok(!url.includes("checkin"))
})
