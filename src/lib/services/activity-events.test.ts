import test from "node:test"
import assert from "node:assert/strict"

import {
  buildActivityEventPreferenceUpdates,
  resolveActivityEventValue,
} from "./activity-events"

test("resolveActivityEventValue normalizes UI actions into stable event values", () => {
  assert.equal(resolveActivityEventValue("detail_opened", { source: "timeline-card" }), "timeline-card")
  assert.equal(resolveActivityEventValue("external_link_clicked", { linkKind: "menu" }), "menu")
  assert.equal(resolveActivityEventValue("external_link_clicked", { linkKind: "tickets" }), "tickets")
  assert.equal(resolveActivityEventValue("bookmark_toggled", {}), null)
})

test("buildActivityEventPreferenceUpdates converts soft interaction events into low-weight signal deltas", () => {
  const museumUpdates = buildActivityEventPreferenceUpdates({
    eventType: "detail_opened",
    category: "museum",
    tags: ["museum", "indoor"],
  })

  assert.deepEqual(museumUpdates, [
    { signalType: "category", signalKey: "museum", delta: 0.25 },
    { signalType: "tag", signalKey: "museum", delta: 0.1 },
    { signalType: "tag", signalKey: "indoor", delta: 0.1 },
  ])

  const menuUpdates = buildActivityEventPreferenceUpdates({
    eventType: "external_link_clicked",
    eventValue: "menu",
    category: "restaurant",
    tags: ["restaurant", "food-market"],
  })

  assert.deepEqual(menuUpdates, [
    { signalType: "category", signalKey: "restaurant", delta: 0.6 },
    { signalType: "tag", signalKey: "restaurant", delta: 0.24 },
    { signalType: "tag", signalKey: "food-market", delta: 0.24 },
  ])
})
