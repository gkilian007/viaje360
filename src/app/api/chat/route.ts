import { NextRequest, NextResponse } from "next/server"
import { generateChatResponse } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message: string
      history?: Array<{ role: "user" | "model"; text: string }>
    }

    const { message, history = [] } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 })
    }

    const response = await generateChatResponse(history, message)
    return NextResponse.json({ response })
  } catch (err) {
    console.error("Chat API error:", err)
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}
