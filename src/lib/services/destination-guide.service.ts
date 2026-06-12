import { z } from "zod"
import { getEnv, requireEnv } from "@/lib/env"
import { createServiceClient } from "@/lib/supabase/server"

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = "llama-3.1-8b-instant"

const guideSectionSchema = z.object({
  emoji: z.string().min(1),
  title: z.string().min(1),
  items: z.array(z.string().min(1)).min(1).max(8),
})

export const destinationGuideSchema = z.object({
  sections: z.array(guideSectionSchema).min(3).max(8),
})

export type DestinationGuide = z.infer<typeof destinationGuideSchema>

export interface DestinationGuideResult {
  destination: string
  guide: DestinationGuide
  cached: boolean
}

export function normalizeDestinationKey(destination: string): string {
  return destination
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
}

function buildGuidePrompt(destination: string): string {
  return `Eres un experto local de ${destination}. Genera una guía práctica para un viajero hispanohablante que visita ${destination} por primera vez.

Devuelve SOLO JSON válido, sin markdown, con este formato exacto:
{
  "sections": [
    { "emoji": "🚇", "title": "Cómo moverse", "items": ["consejo 1", "consejo 2", "consejo 3"] }
  ]
}

Incluye exactamente estas 6 secciones, en este orden:
1. Cómo moverse (transporte desde el aeropuerto, transporte público, tarjetas o apps útiles)
2. Dinero y propinas (moneda, pago con tarjeta vs efectivo, cuánto se deja de propina)
3. Seguridad (zonas o timos a evitar, números de emergencia)
4. Costumbres locales (etiqueta, horarios de comida, qué se considera de mala educación)
5. Frases útiles (saludos y frases básicas en el idioma local con su pronunciación, si el idioma local no es español)
6. Práctico (enchufes y voltaje, agua del grifo, wifi/SIM, horarios comerciales)

Cada sección: 3-4 items concretos y específicos de ${destination}, máximo 140 caracteres por item. Datos reales (nombres de apps, tarjetas de transporte, precios aproximados). Responde en español.`
}

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
  return JSON.parse(cleaned)
}

async function generateWithGemini(destination: string): Promise<string> {
  const apiKey = requireEnv("GEMINI_API_KEY", "Gemini API")

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildGuidePrompt(destination) }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 4000 },
    }),
  })

  if (!res.ok) throw new Error(`Gemini error ${res.status}`)

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("Gemini returned an empty guide")
  return text
}

async function generateWithGroq(destination: string): Promise<string> {
  const apiKey = getEnv("GROQ_API_KEY")
  if (!apiKey) throw new Error("GROQ_API_KEY not configured")

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: buildGuidePrompt(destination) }],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  })

  if (!res.ok) throw new Error(`Groq error ${res.status}`)

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error("Groq returned an empty guide")
  return text
}

async function generateGuide(
  destination: string
): Promise<{ guide: DestinationGuide; model: string }> {
  let raw: string
  let model: string

  try {
    raw = await generateWithGemini(destination)
    model = "gemini-2.5-flash"
  } catch (geminiError) {
    console.warn("Gemini guide generation failed, trying Groq:", geminiError)
    raw = await generateWithGroq(destination)
    model = GROQ_MODEL
  }

  return { guide: destinationGuideSchema.parse(extractJson(raw)), model }
}

export async function getDestinationGuide(
  destination: string
): Promise<DestinationGuideResult> {
  const key = normalizeDestinationKey(destination)
  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from("destination_guides")
    .select("destination, guide")
    .eq("destination_key", key)
    .maybeSingle()

  if (existing?.guide) {
    const cachedGuide = destinationGuideSchema.safeParse(existing.guide)
    if (cachedGuide.success) {
      return {
        destination: String(existing.destination),
        guide: cachedGuide.data,
        cached: true,
      }
    }
  }

  const { guide, model } = await generateGuide(destination.trim())

  const { error: insertError } = await supabase.from("destination_guides").upsert(
    {
      destination_key: key,
      destination: destination.trim(),
      guide,
      model,
    },
    { onConflict: "destination_key", ignoreDuplicates: true }
  )

  if (insertError) {
    console.error("Failed to cache destination guide:", insertError)
  }

  return { destination: destination.trim(), guide, cached: false }
}
