import { NextRequest, NextResponse } from "next/server"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { saveActivityEvent, saveBatchActivityEvents } from "@/lib/services/activity-events"

interface ActivityEventBody {
  tripId: string
  activityId: string
  activityKnowledgeId?: string | null
  eventType: string
  metadata?: Record<string, unknown> | null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const identity = await resolveRequestIdentity()
    const userId = identity.userId ?? null

    // Support single event or batch
    if (Array.isArray(body.events)) {
      const events = (body.events as ActivityEventBody[]).map((event) => ({
        tripId: event.tripId,
        activityId: event.activityId,
        activityKnowledgeId: event.activityKnowledgeId ?? null,
        userId,
        eventType: event.eventType,
        metadata: event.metadata ?? null,
      }))

      await saveBatchActivityEvents(events)

      return NextResponse.json({
        ok: true,
        data: { saved: events.length },
      })
    }

    // Single event
    const event = body as ActivityEventBody
    if (!event.tripId || !event.activityId || !event.eventType) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields: tripId, activityId, eventType" },
        { status: 400 }
      )
    }

    const result = await saveActivityEvent({
      tripId: event.tripId,
      activityId: event.activityId,
      activityKnowledgeId: event.activityKnowledgeId ?? null,
      userId,
      eventType: event.eventType,
      metadata: event.metadata ?? null,
    })

    return NextResponse.json({
      ok: true,
      data: { eventValue: result.eventValue },
    })
  } catch (error) {
    console.error("[Activity Events API] Error:", error)
    return NextResponse.json(
      { ok: false, message: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
