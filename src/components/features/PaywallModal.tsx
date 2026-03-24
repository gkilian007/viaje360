"use client"

import { useState, useCallback } from "react"
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

interface PaywallModalProps {
  destination: string
  onClose: () => void
  onPaymentComplete: () => void
}

type PaywallView = "options" | "pay-trip" | "pay-annual" | "success"

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ""
const PAYPAL_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_ANNUAL_PLAN_ID ?? ""

export function PaywallModal({
  destination,
  onClose,
  onPaymentComplete,
}: PaywallModalProps) {
  const [view, setView] = useState<PaywallView>("options")
  const [error, setError] = useState<string | null>(null)

  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose()
    },
    [onClose]
  )

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #1c1c1e 0%, #0f1117 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* ── Success view ── */}
        {view === "success" && (
          <div className="px-6 py-12 text-center">
            <div className="text-[56px] mb-4">🎉</div>
            <h2 className="text-[22px] font-bold text-white mb-2">
              ¡Pago completado!
            </h2>
            <p className="text-[14px] text-[#9ca3af] mb-8">
              Ya tienes acceso completo. Disfruta de tu viaje.
            </p>
            <button
              onClick={() => {
                onPaymentComplete()
                onClose()
              }}
              className="px-8 py-3 rounded-2xl font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
            >
              Continuar
            </button>
          </div>
        )}

        {/* ── Options view (default) ── */}
        {view === "options" && (
          <>
            {/* Header */}
            <div className="px-6 pt-8 pb-4 text-center">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(10,132,255,0.2), rgba(88,86,214,0.2))",
                }}
              >
                <span className="text-[36px]">✈️</span>
              </div>
              <h2 className="text-[22px] font-bold text-white mb-2">
                Tu trial para {destination} ha terminado
              </h2>
              <p className="text-[14px] text-[#9ca3af] leading-relaxed">
                Has disfrutado de 2 días gratis con acceso completo.
                Desbloquea para seguir usando la IA, adaptación y diario.
              </p>
            </div>

            {/* Plans */}
            <div className="px-6 pb-6 space-y-3">
              {/* Per-trip purchase */}
              <button
                onClick={() => setView("pay-trip")}
                className="w-full p-4 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "rgba(42,42,44,0.8)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[20px]">🎫</span>
                    <span className="text-[15px] font-semibold text-white">
                      Solo {destination}
                    </span>
                  </div>
                  <span className="text-[18px] font-bold text-white">€4.99</span>
                </div>
                <p className="text-[12px] text-[#888]">
                  Pago único · Acceso permanente a este destino
                </p>
              </button>

              {/* Annual subscription */}
              <button
                onClick={() => setView("pay-annual")}
                className="w-full p-4 rounded-2xl text-left relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, rgba(10,132,255,0.15), rgba(88,86,214,0.15))",
                  border: "1px solid rgba(10,132,255,0.3)",
                }}
              >
                <div
                  className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
                >
                  AHORRA 60%
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[20px]">🌍</span>
                    <span className="text-[15px] font-semibold text-white">
                      Todos los destinos
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[18px] font-bold text-white">€29.99</span>
                    <span className="text-[11px] text-[#888] block">/año</span>
                  </div>
                </div>
                <p className="text-[12px] text-[#0A84FF]">
                  Viajes ilimitados · Sin trials · IA completa siempre
                </p>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={onClose}
                className="w-full py-3 text-[13px] text-[#666] hover:text-[#999] transition-colors"
              >
                Seguir en modo gratuito
              </button>
            </div>
          </>
        )}

        {/* ── PayPal payment views ── */}
        {(view === "pay-trip" || view === "pay-annual") && (
          <div className="px-6 py-8">
            {/* Back button */}
            <button
              onClick={() => { setView("options"); setError(null) }}
              className="flex items-center gap-1 text-[13px] text-[#0A84FF] mb-6 hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Volver
            </button>

            <div className="text-center mb-6">
              <span className="text-[32px]">{view === "pay-trip" ? "🎫" : "🌍"}</span>
              <h3 className="text-[18px] font-bold text-white mt-2">
                {view === "pay-trip" ? `${destination} — €4.99` : "Todos los destinos — €29.99/año"}
              </h3>
              <p className="text-[12px] text-[#888] mt-1">
                {view === "pay-trip" ? "Pago único, acceso permanente" : "Suscripción anual, sin límites"}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-[12px] text-[#FF453A]"
                style={{ background: "rgba(255,69,58,0.1)", border: "1px solid rgba(255,69,58,0.2)" }}
              >
                {error}
              </div>
            )}

            {/* PayPal buttons */}
            {PAYPAL_CLIENT_ID ? (
              <PayPalScriptProvider
                options={{
                  clientId: PAYPAL_CLIENT_ID,
                  currency: "EUR",
                  intent: view === "pay-trip" ? "capture" : "subscription",
                  vault: view === "pay-annual" ? true : undefined,
                }}
              >
                {view === "pay-trip" ? (
                  <PayPalButtons
                    style={{ layout: "vertical", color: "black", shape: "pill", label: "pay" }}
                    createOrder={async () => {
                      const res = await fetch("/api/paypal/create-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ destination, amount: "4.99", currency: "EUR" }),
                      })
                      const data = await res.json()
                      if (!data.data?.orderId) throw new Error("Failed to create order")
                      return data.data.orderId
                    }}
                    onApprove={async (data) => {
                      const res = await fetch("/api/paypal/capture-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId: data.orderID, destination }),
                      })
                      const result = await res.json()
                      if (result.data?.status === "completed") {
                        setView("success")
                      } else {
                        setError("El pago no se completó. Inténtalo de nuevo.")
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal error:", err)
                      setError("Error en el pago. Inténtalo de nuevo.")
                    }}
                  />
                ) : (
                  <PayPalButtons
                    style={{ layout: "vertical", color: "black", shape: "pill", label: "subscribe" }}
                    createSubscription={async (_data, actions) => {
                      if (!PAYPAL_PLAN_ID) {
                        setError("Plan de suscripción no configurado aún")
                        throw new Error("No plan ID")
                      }
                      return actions.subscription.create({ plan_id: PAYPAL_PLAN_ID })
                    }}
                    onApprove={async (data) => {
                      const res = await fetch("/api/paypal/confirm-subscription", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ subscriptionId: data.subscriptionID }),
                      })
                      const result = await res.json()
                      if (result.data?.status === "active") {
                        setView("success")
                      } else {
                        setError("La suscripción no se activó. Inténtalo de nuevo.")
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal subscription error:", err)
                      setError("Error en la suscripción. Inténtalo de nuevo.")
                    }}
                  />
                )}
              </PayPalScriptProvider>
            ) : (
              <div className="text-center py-8">
                <p className="text-[14px] text-[#888]">
                  PayPal no está configurado todavía.
                </p>
                <p className="text-[12px] text-[#666] mt-1">
                  Configura NEXT_PUBLIC_PAYPAL_CLIENT_ID en .env.local
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
