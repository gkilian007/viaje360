/**
 * Email drip sequence for onboarding: welcome → tips (+24h) → nudge (+72h).
 *
 * Rows in `scheduled_drip_emails` are enqueued by a DB trigger on auth.users
 * (migration 20260612000003_email_drip.sql) and sent by `/api/cron/unified`
 * via processDripEmails().
 */

import { sendEmail } from "./email.service"

const DRIP_SUBJECTS: Record<string, string> = {
  welcome: "¡Bienvenido/a a Viaje360! 🌍",
  tips: "3 tips para sacar el máximo de tu itinerario ✨",
  nudge: "Tu viaje te espera — ¿listo/a para la aventura?",
}

function renderTemplate(template: string, name: string): string {
  const templates: Record<string, string> = {
    welcome: `
      <div style="font-family:system-ui;max-width:600px;margin:0 auto;background:#131315;color:#e4e2e4;padding:40px 24px;border-radius:16px">
        <div style="text-align:center;margin-bottom:32px">
          <span style="font-size:48px">🌍</span>
          <h1 style="color:#ffffff;font-size:24px;margin:16px 0 8px">¡Hola ${name}!</h1>
          <p style="color:#c0c6d6;font-size:14px">Bienvenido/a a Viaje360</p>
        </div>
        <p style="color:#c0c6d6;font-size:14px;line-height:1.6">
          Tu compañero de viaje con IA está listo para ayudarte a planificar experiencias únicas.
        </p>
        <p style="color:#c0c6d6;font-size:14px;line-height:1.6">
          Empieza ahora: cuéntanos tu destino y en menos de 2 minutos tendrás un itinerario personalizado.
        </p>
        <div style="text-align:center;margin-top:32px">
          <a href="https://viaje360.app/onboarding" style="background:#0A84FF;color:#fff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
            Planifica tu viaje →
          </a>
        </div>
      </div>
    `,
    tips: `
      <div style="font-family:system-ui;max-width:600px;margin:0 auto;background:#131315;color:#e4e2e4;padding:40px 24px;border-radius:16px">
        <h1 style="color:#ffffff;font-size:22px;margin-bottom:24px">3 tips para un viaje perfecto ✨</h1>
        <div style="margin-bottom:20px">
          <p style="color:#0A84FF;font-size:14px;font-weight:600;margin-bottom:4px">1. Comparte tu plan</p>
          <p style="color:#c0c6d6;font-size:13px;line-height:1.5">Envía el enlace a tus compañeros de viaje para que vean el itinerario.</p>
        </div>
        <div style="margin-bottom:20px">
          <p style="color:#0A84FF;font-size:14px;font-weight:600;margin-bottom:4px">2. Reordena actividades</p>
          <p style="color:#c0c6d6;font-size:13px;line-height:1.5">Arrastra las actividades para ajustar el orden según tus preferencias.</p>
        </div>
        <div style="margin-bottom:20px">
          <p style="color:#0A84FF;font-size:14px;font-weight:600;margin-bottom:4px">3. Escribe tu diario</p>
          <p style="color:#c0c6d6;font-size:13px;line-height:1.5">Al final de cada día, registra tus experiencias para un recap automático.</p>
        </div>
        <div style="text-align:center;margin-top:32px">
          <a href="https://viaje360.app/plan" style="background:#0A84FF;color:#fff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
            Ir a mi itinerario →
          </a>
        </div>
      </div>
    `,
    nudge: `
      <div style="font-family:system-ui;max-width:600px;margin:0 auto;background:#131315;color:#e4e2e4;padding:40px 24px;border-radius:16px">
        <div style="text-align:center;margin-bottom:24px">
          <span style="font-size:48px">✈️</span>
          <h1 style="color:#ffffff;font-size:22px;margin:16px 0">Tu aventura te espera</h1>
        </div>
        <p style="color:#c0c6d6;font-size:14px;line-height:1.6;text-align:center">
          ¿Ya tienes tu próximo destino en mente? La IA de Viaje360 puede crear un itinerario completo en menos de 2 minutos.
        </p>
        <div style="text-align:center;margin-top:32px">
          <a href="https://viaje360.app/onboarding" style="background:linear-gradient(135deg,#0A84FF,#5E5CE6);color:#fff;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">
            Planifica gratis →
          </a>
        </div>
      </div>
    `,
  }

  return templates[template] ?? templates.welcome
}

interface DripEmailRow {
  id: string
  email: string
  name: string
  template: string
}

/**
 * Sends due drip emails and marks them as sent.
 *
 * Rows are only marked sent after a successful send, so a missing
 * RESEND_API_KEY (e.g. local dev) leaves the queue untouched for the
 * next production run.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processDripEmails(supabase: any) {
  const now = new Date().toISOString()

  const { data: pending, error } = await supabase
    .from("scheduled_drip_emails")
    .select("id, email, name, template")
    .eq("sent", false)
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(50)

  if (error || !pending || pending.length === 0) {
    return { processed: 0, sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0
  const sentIds: string[] = []

  for (const row of pending as DripEmailRow[]) {
    const subject = DRIP_SUBJECTS[row.template] ?? DRIP_SUBJECTS.welcome
    const ok = await sendEmail(row.email, subject, renderTemplate(row.template, row.name))
    if (ok) {
      sent++
      sentIds.push(row.id)
    } else {
      failed++
    }
  }

  if (sentIds.length > 0) {
    await supabase
      .from("scheduled_drip_emails")
      .update({ sent: true, sent_at: new Date().toISOString() })
      .in("id", sentIds)
  }

  return { processed: pending.length, sent, failed }
}
