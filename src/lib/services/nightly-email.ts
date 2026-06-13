/**
 * Nightly "tu día de mañana" email: each evening, owners of trips with a
 * planned day tomorrow get a summary of that day's activities.
 *
 * Sent by `/api/cron/nightly` via processNightlyEmails(). Idempotency is
 * guaranteed by the unique (trip_id, email_type) constraint on trip_email_log
 * (migration 20260613000001_trip_email_log.sql) using a per-day email type
 * (`nightly-day-N`), so each trip day is announced at most once.
 */

import { sendEmail } from "./email.service"
import type { GeneratedDay, GeneratedItinerary } from "@/lib/supabase/database.types"

interface TripRow {
  id: string
  user_id: string
  destination: string | null
  start_date: string
  end_date: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

const MAX_ACTIVITIES = 12

function renderNightlyEmail(trip: TripRow, day: GeneratedDay, dayNumber: number): string {
  const destination = escapeHtml(trip.destination ?? "tu destino")
  const theme = day.theme ? escapeHtml(day.theme) : null

  const activities = (day.activities ?? []).slice(0, MAX_ACTIVITIES)
  const rows = activities
    .map((activity) => {
      const time = activity.time ? escapeHtml(activity.time) : "—"
      const name = escapeHtml(activity.name)
      const location = activity.location ? escapeHtml(activity.location) : null
      return `
        <tr>
          <td style="color:#0A84FF;font-size:13px;font-weight:600;padding:8px 12px 8px 0;vertical-align:top;white-space:nowrap">${time}</td>
          <td style="padding:8px 0">
            <p style="color:#ffffff;font-size:14px;margin:0">${activity.icon ? `${activity.icon} ` : ""}${name}</p>
            ${location ? `<p style="color:#8a8f9d;font-size:12px;margin:2px 0 0">${location}</p>` : ""}
          </td>
        </tr>`
    })
    .join("")

  const body = day.isRestDay
    ? `<p style="color:#c0c6d6;font-size:14px;line-height:1.6">Mañana toca descansar. Sin madrugones: recarga pilas y disfruta de ${destination} a tu ritmo.</p>`
    : `<table style="border-collapse:collapse;width:100%">${rows}</table>`

  return `
    <div style="font-family:system-ui;max-width:600px;margin:0 auto;background:#131315;color:#e4e2e4;padding:40px 24px;border-radius:16px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:48px">🌙</span>
        <h1 style="color:#ffffff;font-size:22px;margin:16px 0 8px">Tu día de mañana en ${destination}</h1>
        <p style="color:#c0c6d6;font-size:14px">Día ${dayNumber}${theme ? ` · ${theme}` : ""}</p>
      </div>
      <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:16px 20px;margin-bottom:24px">
        ${body}
      </div>
      <div style="text-align:center;margin-top:32px">
        <a href="https://viaje360.app/plan" style="background:linear-gradient(135deg,#0A84FF,#5E5CE6);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
          Ver el plan completo →
        </a>
      </div>
      <p style="color:#8a8f9d;font-size:12px;text-align:center;margin-top:24px">
        Que descanses — mañana te espera un buen día.
      </p>
    </div>
  `
}

function diffDays(laterIso: string, earlierIso: string): number {
  const later = new Date(`${laterIso}T00:00:00Z`).getTime()
  const earlier = new Date(`${earlierIso}T00:00:00Z`).getTime()
  if (Number.isNaN(later) || Number.isNaN(earlier)) return -1
  return Math.round((later - earlier) / 86400000)
}

/**
 * Sends the "tu día de mañana" summary to owners of trips where tomorrow
 * (UTC) falls within [start_date, end_date].
 *
 * The log row is inserted BEFORE sending: if the insert hits the unique
 * constraint the email was already handled, so we skip. Days without any
 * activities (and not marked rest days) are skipped without logging.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processNightlyEmails(supabase: any) {
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  const { data: trips, error } = await supabase
    .from("trips")
    .select("id, user_id, destination, start_date, end_date")
    .lte("start_date", tomorrowStr)
    .gte("end_date", tomorrowStr)
    .in("status", ["planning", "active"])
    .limit(100)

  if (error || !trips || trips.length === 0) {
    return { trips: 0, sent: 0, skipped: 0, failed: 0 }
  }

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const trip of trips as TripRow[]) {
    try {
      const dayIndex = diffDays(tomorrowStr, trip.start_date)
      if (dayIndex < 0) {
        skipped++
        continue
      }
      const dayNumber = dayIndex + 1

      const { data: versions } = await supabase
        .from("itinerary_versions")
        .select("snapshot")
        .eq("trip_id", trip.id)
        .order("version_number", { ascending: false })
        .limit(1)

      const snapshot = versions?.[0]?.snapshot as GeneratedItinerary | undefined
      const day =
        snapshot?.days?.find((d) => d.date === tomorrowStr) ?? snapshot?.days?.[dayIndex]

      if (!day || (!day.isRestDay && (day.activities ?? []).length === 0)) {
        skipped++
        continue
      }

      const { error: insertError } = await supabase
        .from("trip_email_log")
        .insert({ trip_id: trip.id, email_type: `nightly-day-${dayNumber}` })

      if (insertError) {
        // 23505 = unique_violation → already sent on a previous run
        skipped++
        continue
      }

      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        trip.user_id
      )
      const email = userData?.user?.email
      if (userError || !email) {
        failed++
        continue
      }

      const destination = trip.destination ?? "tu destino"
      const ok = await sendEmail(
        email,
        `🌙 Tu día ${dayNumber} en ${destination} — plan de mañana`,
        renderNightlyEmail(trip, day, dayNumber)
      )
      if (ok) sent++
      else failed++
    } catch {
      failed++
    }
  }

  return { trips: trips.length, sent, skipped, failed }
}
