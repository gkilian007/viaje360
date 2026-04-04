import { NextRequest, NextResponse } from "next/server"
import { resolveRequestIdentity } from "@/lib/auth/server"
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { tripId } = await params

  if (!tripId) {
    return NextResponse.json({ ok: false, message: "Missing tripId" }, { status: 400 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, archived: false, reason: "no-db" })
  }

  const identity = await resolveRequestIdentity()
  if (!identity.userId) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from("trips")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", tripId)
    .eq("user_id", identity.userId)

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, archived: true })
}
