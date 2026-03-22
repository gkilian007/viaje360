import { NextRequest, NextResponse } from "next/server"
import { generateQuizQuestion } from "@/lib/gemini"
import type { QuizQuestion } from "@/lib/types"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const destination = searchParams.get("destination") ?? "Barcelona"

    const raw = await generateQuizQuestion(destination)

    // Strip markdown code fences if present
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()

    let parsed: Omit<QuizQuestion, "id">
    try {
      parsed = JSON.parse(cleaned) as Omit<QuizQuestion, "id">
    } catch {
      return NextResponse.json({ error: "Invalid JSON from Gemini" }, { status: 500 })
    }

    const question: QuizQuestion = {
      id: `quiz-${Date.now()}`,
      ...parsed,
    }

    return NextResponse.json({ question })
  } catch (err) {
    console.error("Quiz API error:", err)
    return NextResponse.json({ error: "Failed to generate quiz" }, { status: 500 })
  }
}
