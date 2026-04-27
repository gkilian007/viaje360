"use client"

import { useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"

interface InvitationState {
  status: "loading" | "ready" | "accepting" | "accepted" | "error"
  message?: string
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const invitationId = String(params.invitationId ?? "")
  const [state, setState] = useState<InvitationState>({ status: "ready" })

  const loginHref = useMemo(() => `/login?next=${encodeURIComponent(`/invite/${invitationId}`)}`, [invitationId])

  const invalidInvitation = !invitationId

  async function handleAccept() {
    if (invalidInvitation) return
    setState({ status: "accepting" })

    try {
      const res = await fetch(`/api/invitations/${invitationId}/accept`, { method: "POST" })
      const payload = await res.json().catch(() => null)

      if (res.status === 401) {
        router.push(loginHref)
        return
      }

      if (!res.ok) {
        setState({ status: "error", message: payload?.error?.message ?? "No se pudo aceptar la invitación" })
        return
      }

      setState({ status: "accepted", message: "Invitación aceptada. Abriendo viaje..." })
      window.setTimeout(() => {
        router.push("/plan")
      }, 900)
    } catch {
      setState({ status: "error", message: "No se pudo aceptar la invitación" })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "linear-gradient(180deg,#0f1117 0%,#1a1a2e 100%)" }}>
      <div
        className="w-full max-w-md rounded-3xl p-6 text-center"
        style={{ background: "rgba(28,28,30,0.95)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}
      >
        <div className="text-5xl mb-4">🤝</div>
        <h1 className="text-white text-2xl font-bold mb-2">Invitación de colaboración</h1>
        <p className="text-[#c0c6d6] text-sm mb-6">
          Acepta esta invitación para abrir el viaje compartido en Viaje360.
        </p>

        {invalidInvitation && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(255,69,58,0.12)", color: "#ffb4ae" }}>
            Invitación no válida
          </div>
        )}

        {state.status === "error" && state.message && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(255,69,58,0.12)", color: "#ffb4ae" }}>
            {state.message}
          </div>
        )}

        {state.status === "accepted" && state.message && (
          <div className="mb-4 rounded-2xl px-4 py-3 text-sm" style={{ background: "rgba(48,209,88,0.12)", color: "#b9f6ca" }}>
            {state.message}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={state.status === "accepting" || state.status === "accepted" || invalidInvitation}
            className="w-full py-3.5 rounded-2xl font-semibold text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
          >
            {state.status === "accepting" ? "Aceptando..." : state.status === "accepted" ? "Aceptada" : "Aceptar invitación"}
          </button>

          <button
            type="button"
            onClick={() => router.push(loginHref)}
            className="w-full py-3 rounded-2xl font-medium text-white"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Entrar con otra cuenta
          </button>
        </div>
      </div>
    </div>
  )
}
