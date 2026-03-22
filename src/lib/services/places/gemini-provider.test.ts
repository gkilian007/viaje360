import test from "node:test"
import assert from "node:assert/strict"
import { parseGeminiPlacesPayload } from "@/lib/services/places/gemini-provider"

test("parseGeminiPlacesPayload parses fenced JSON arrays", () => {
  const fencedJson = ["```json", '[{"name":"Museo del Prado"}]', "```"].join("\n")
  const parsed = parseGeminiPlacesPayload(fencedJson)

  assert.equal(parsed.length, 1)
  assert.equal(parsed[0]?.name, "Museo del Prado")
})

test("parseGeminiPlacesPayload accepts wrapped places objects", () => {
  const parsed = parseGeminiPlacesPayload(JSON.stringify({
    places: [{ name: "Reina Sofía" }],
  }))

  assert.equal(parsed.length, 1)
  assert.equal(parsed[0]?.name, "Reina Sofía")
})
