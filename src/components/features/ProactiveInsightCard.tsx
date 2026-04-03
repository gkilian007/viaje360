"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { ProactiveInsight, ProactiveAction } from "@/lib/services/proactive-engine"

interface ProactiveInsightCardProps {
  insight: ProactiveInsight
  isAdapting?: boolean
  onAction: (action: ProactiveAction) => void
  onDismiss: () => void
}

const TRIGGER_STYLES: Record<string, {
  bg: string; border: string; buttonBg: string; icon: string
}> = {
  evening_briefing: {
    bg: "rgba(175,130,255,0.08)",
    border: "rgba(175,130,255,0.20)",
    buttonBg: "rgba(175,130,255,0.85)",
    icon: "🌙",
  },
  morning_briefing: {
    bg: "rgba(255,214,10,0.08)",
    border: "rgba(255,214,10,0.18)",
    buttonBg: "rgba(255,159,10,0.85)",
    icon: "☀️",
  },
  post_day: {
    bg: "rgba(10,132,255,0.08)",
    border: "rgba(10,132,255,0.18)",
    buttonBg: "rgba(10,132,255,0.85)",
    icon: "📝",
  },
  budget_pulse: {
    bg: "rgba(48,209,88,0.08)",
    border: "rgba(48,209,88,0.18)",
    buttonBg: "rgba(48,209,88,0.85)",
    icon: "💰",
  },
  weather_change: {
    bg: "rgba(255,69,58,0.08)",
    border: "rgba(255,69,58,0.18)",
    buttonBg: "rgba(255,69,58,0.85)",
    icon: "🌧️",
  },
  ticket_reminder: {
    bg: "rgba(255,159,10,0.08)",
    border: "rgba(255,159,10,0.18)",
    buttonBg: "rgba(255,159,10,0.85)",
    icon: "🎟️",
  },
}

const SEVERITY_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  urgent: { bg: "rgba(255,69,58,0.15)", color: "#FF453A", label: "Urgente" },
  helpful: { bg: "rgba(10,132,255,0.15)", color: "#0A84FF", label: "Recomendado" },
  nice_to_know: { bg: "rgba(100,100,100,0.15)", color: "#999", label: "Info" },
}

export function ProactiveInsightCard({
  insight,
  isAdapting,
  onAction,
  onDismiss,
}: ProactiveInsightCardProps) {
  const style = TRIGGER_STYLES[insight.trigger] ?? TRIGGER_STYLES.morning_briefing
  const badge = SEVERITY_BADGES[insight.severity] ?? SEVERITY_BADGES.helpful

  return (
    <AnimatePresence>
      <motion.div
        key={insight.id}
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="mx-5 mb-3 rounded-2xl overflow-hidden"
        style={{ background: style.bg, border: `1px solid ${style.border}` }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <span className="text-[28px] shrink-0 leading-none mt-0.5">{style.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-[14px] font-bold text-white">{insight.title}</p>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
              </div>
              {/* Body — preserve newlines */}
              <p className="text-[12px] text-[#aaa] leading-relaxed whitespace-pre-line">
                {insight.body}
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="text-[#444] hover:text-[#888] transition-colors shrink-0 -mt-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Actions */}
          {insight.actions && insight.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-3 ml-10 flex-wrap">
              {insight.actions.map((action, idx) => (
                <motion.button
                  key={idx}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onAction(action)}
                  disabled={isAdapting && action.type === "adapt"}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
                  style={{
                    background: idx === 0 ? style.buttonBg : "rgba(255,255,255,0.04)",
                    color: idx === 0 ? "white" : "#777",
                    border: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                    opacity: isAdapting && action.type === "adapt" ? 0.6 : 1,
                  }}
                >
                  {isAdapting && action.type === "adapt" ? (
                    <>
                      <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                      Adaptando...
                    </>
                  ) : (
                    action.label
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
