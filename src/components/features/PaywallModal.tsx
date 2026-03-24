"use client"

import { useCallback } from "react"

interface PaywallModalProps {
  destination: string
  onClose: () => void
  onPurchaseTrip: () => void
  onSubscribeAnnual: () => void
}

export function PaywallModal({
  destination,
  onClose,
  onPurchaseTrip,
  onSubscribeAnnual,
}: PaywallModalProps) {
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
            onClick={onPurchaseTrip}
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
            onClick={onSubscribeAnnual}
            className="w-full p-4 rounded-2xl text-left relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg, rgba(10,132,255,0.15), rgba(88,86,214,0.15))",
              border: "1px solid rgba(10,132,255,0.3)",
            }}
          >
            {/* Popular badge */}
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
      </div>
    </div>
  )
}
