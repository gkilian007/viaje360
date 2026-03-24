"use client"

interface TrialBannerProps {
  destination: string
  daysRemaining: number | null
  reason: string
}

export function TrialBanner({ destination, daysRemaining, reason }: TrialBannerProps) {
  // Don't show for subscribers or purchasers
  if (reason === "subscriber" || reason === "purchased") return null
  // Don't show if no trial info
  if (reason !== "trial" && reason !== "new_trial") return null
  if (daysRemaining === null) return null

  const hours = Math.round(daysRemaining * 24)
  const timeText =
    daysRemaining >= 1
      ? `${Math.ceil(daysRemaining)} día${Math.ceil(daysRemaining) > 1 ? "s" : ""}`
      : hours > 0
      ? `${hours}h`
      : "menos de 1h"

  const isUrgent = daysRemaining < 0.5 // less than 12h

  return (
    <div
      className="mx-5 mb-3 px-4 py-2.5 rounded-xl flex items-center gap-3"
      style={{
        background: isUrgent
          ? "rgba(255,69,58,0.1)"
          : "rgba(10,132,255,0.08)",
        border: `1px solid ${isUrgent ? "rgba(255,69,58,0.2)" : "rgba(10,132,255,0.15)"}`,
      }}
    >
      <span className="text-[16px]">{isUrgent ? "⏰" : "🎁"}</span>
      <div className="flex-1">
        <p className="text-[12px] font-medium text-white">
          Trial gratuito{" "}
          <span style={{ color: isUrgent ? "#FF453A" : "#0A84FF" }}>
            {timeText} restante{daysRemaining >= 1 && Math.ceil(daysRemaining) > 1 ? "s" : ""}
          </span>
        </p>
        <p className="text-[11px] text-[#888]">
          Acceso completo a {destination}
        </p>
      </div>
    </div>
  )
}
