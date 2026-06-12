/**
 * Check-in reminder: the day before a trip starts, email the owner a reminder
 * to check in for their flight, with flight-search links and their itinerary.
 *
 * Sent by `/api/cron/unified` via processCheckinReminders(). Idempotency is
 * guaranteed by the unique (trip_id, email_type) constraint on trip_email_log
 * (migration 20260613000001_trip_email_log.sql).
 */

import { sendEmail } from "./email.service"
import { buildGoogleFlightsUrl, buildKiwiFlightsUrl } from "@/lib/affiliate"

const EMAIL_TYPE = "checkin_reminder"

interface TripRow {
  id: string
  user_id: string
  name: string | null
  destination: string | null
  country: string | null
  start_date: string
  end_date: string | null
}

function renderCheckinEmail(trip: TripRow): string {
  const destination = trip.destination ?? "tu destino"
  const start = trip.start_date
  const end = trip.end_date ?? trip.start_date

  const googleUrl = buildGoogleFlightsUrl(destination, start, end)
  const kiwiUrl = trip.country?.trim()
    ? buildKiwiFlightsUrl(destination, trip.country.trim(), start, end)
    : null

  return `
    <div style="font-family:system-ui;max-width:600px;margin:0 auto;background:#131315;color:#e4e2e4;padding:40px 24px;border-radius:16px">
      <div style="text-align:center;margin-bottom:24px">
        <span style="font-size:48px">🧳</span>
        <h1 style="color:#ffffff;font-size:22px;margin:16px 0 8px">¡Mañana empieza tu viaje a ${destination}!</h1>
        <p style="color:#c0c6d6;font-size:14px">Un par de cosas antes de salir</p>
      </div>
      <div style="margin-bottom:20px">
        <p style="color:#0A84FF;font-size:14px;font-weight:600;margin-bottom:4px">✈️ Haz el check-in de tu vuelo</p>
        <p style="color:#c0c6d6;font-size:13px;line-height:1.5">
          La mayoría de aerolíneas abren el check-in online 24–48 horas antes de la salida.
          Hazlo ahora y evita colas en el aeropuerto.
        </p>
      </div>
      <div style="margin-bottom:20px">
        <p style="color:#0A84FF;font-size:14px;font-weight:600;margin-bottom:4px">📋 Repasa tu itinerario</p>
        <p style="color:#c0c6d6;font-size:13px;line-height:1.5">
          Tu plan día a día está listo en Viaje360, con horarios, mapas y reservas.
        </p>
      </div>
      <div style="margin-bottom:20px">
        <p style="color:#0A84FF;font-size:14px;font-weight:600;margin-bottom:4px">🧳 Última hora</p>
        <p style="color:#c0c6d6;font-size:13px;line-height:1.5">
          Documentación, cargadores, adaptadores… y revisa el tiempo en ${destination} antes de cerrar la maleta.
        </p>
      </div>
      <div style="text-align:center;margin-top:32px">
        <a href="https://viaje360.app/plan" style="background:linear-gradient(135deg,#0A84FF,#5E5CE6);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
          Ver mi itinerario →
        </a>
      </div>
      <p style="color:#8a8f9d;font-size:12px;text-align:center;margin-top:24px">
        ¿Aún sin vuelo? <a href="${googleUrl}" style="color:#0A84FF">Google Flights</a>${kiwiUrl ? ` · <a href="${kiwiUrl}" style="color:#0A84FF">Kiwi.com</a>` : ""}
      </p>
    </div>
  `
}

/**
 * Sends the check-in reminder to owners of trips starting tomorrow (UTC).
 *
 * The log row is inserted BEFORE sending: if the insert hits the unique
 * constraint the email was already handled (or is being handled by a
 * concurrent run), so we skip. A failed send after a successful insert is
 * not retried — better to occasionally miss one than to double-send.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processCheckinReminders(supabase: any) {
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  const { data: trips, error } = await supabase
    .from("trips")
    .select("id, user_id, name, destination, country, start_date, end_date")
    .eq("start_date", tomorrowStr)
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
      const { error: insertError } = await supabase
        .from("trip_email_log")
        .insert({ trip_id: trip.id, email_type: EMAIL_TYPE })

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
        `🧳 Mañana viajas a ${destination} — recuerda el check-in`,
        renderCheckinEmail(trip)
      )
      if (ok) sent++
      else failed++
    } catch {
      failed++
    }
  }

  return { trips: trips.length, sent, skipped, failed }
}
