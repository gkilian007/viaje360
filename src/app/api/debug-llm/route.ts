import { NextRequest, NextResponse } from "next/server"

// TEMPORARY diagnostic route — remove after debugging the itinerary LLM fallback.
// Prod runtime logs live on a Vercel team we cannot access, so this is the only
// way to read the actual provider error responses.

export const maxDuration = 60

const DEBUG_TOKEN = "c88246d7c8f3d4b3a8e7341421721524"

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

async function probeGroq(): Promise<Record<string, unknown>> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { hasKey: false }
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [{ role: "user", content: 'Reply with the JSON object {"ok":true} and nothing else.' }],
        temperature: 0.2,
        max_completion_tokens: 8192,
        response_format: { type: "json_object" },
      }),
    })
    const body = await res.text()
    return { hasKey: true, status: res.status, body: body.slice(0, 2000) }
  } catch (err) {
    return { hasKey: true, fetchError: err instanceof Error ? err.message : String(err) }
  }
}

async function probeGemini(): Promise<Record<string, unknown>> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return { hasKey: false }
  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Reply with the word ok." }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    })
    const body = await res.text()
    return { hasKey: true, status: res.status, body: body.slice(0, 1000) }
  } catch (err) {
    return { hasKey: true, fetchError: err instanceof Error ? err.message : String(err) }
  }
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("t") !== DEBUG_TOKEN) {
    return new NextResponse(null, { status: 404 })
  }
  const [groq, gemini] = await Promise.all([probeGroq(), probeGemini()])
  return NextResponse.json({ groq, gemini })
}
