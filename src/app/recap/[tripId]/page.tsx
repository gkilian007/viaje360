"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, useInView, AnimatePresence } from "framer-motion"
import posthog from "posthog-js"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivitySnap {
  name: string
  type: string
  emoji: string
  time: string
}

interface DayRecap {
  dayNumber: number
  activities: ActivitySnap[]
  journal: {
    mood: string | null
    moodEmoji: string
    energyScore: number | null
    paceScore: number | null
    summary: string | null
    wouldRepeat: boolean | null
  } | null
}

interface BudgetStats {
  totalBudget: number
  totalSpent: number
  dailyAvg: number
  topCategory: string
  topCategoryAmount: number
  savedPct: number
}

interface TravelerProfile {
  label: string
  emoji: string
  description: string
}

interface RecapStats {
  totalDays: number
  totalActivities: number
  kmEstimate: number
  diaryEntries: number
  mostIntenseDay: { dayNumber: number; count: number } | null
  topActivityTypes: Array<{ type: string; count: number; emoji: string }>
}

interface RecapData {
  trip: {
    id: string
    name: string
    destination: string
    country: string
    startDate: string
    endDate: string
    status: string
    imageUrl: string | null
  }
  days: DayRecap[]
  aiNarrative: string | null
  hasDiaryData: boolean
  budgetStats: BudgetStats | null
  magicMoments: Array<{ name: string; emoji: string; reason: string }>
  travelerProfile: TravelerProfile
  stats: RecapStats
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }
  return `${s.toLocaleDateString("es-ES", opts)} – ${e.toLocaleDateString("es-ES", opts)}, ${e.getFullYear()}`
}

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍽️", transport: "🚕", tickets: "🎟️",
  shopping: "🛍️", accommodation: "🏨", other: "📦",
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = value
    const duration = 1200
    const step = Math.max(1, Math.ceil(end / (duration / 16)))
    const timer = setInterval(() => {
      start = Math.min(start + step, end)
      setCount(start)
      if (start >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, value])

  return <span ref={ref}>{prefix}{count}{suffix}</span>
}

// ─── Animation variants ───────────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}
const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RecapPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const [data, setData] = useState<RecapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const recapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tripId) return
    fetch(`/api/diary/recap?tripId=${tripId}`)
      .then(r => r.json())
      .then(res => {
        if (res.data) setData(res.data)
        else setError("No se pudo cargar el recap")
      })
      .catch(() => setError("Error de red"))
      .finally(() => setLoading(false))
  }, [tripId])

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/share/${tripId}`
    try { posthog.capture("trip_shared", { tripId, destination: data?.trip.destination }) } catch {}
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mi viaje a ${data?.trip.destination}`,
          text: `¡Mira el recap de mi viaje a ${data?.trip.destination}! 🌍✈️`,
          url,
        })
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [tripId, data?.trip.destination])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.span
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="text-[56px]"
          >
            ✈️
          </motion.span>
          <p className="text-[#888] text-[14px]">Preparando tu recap...</p>
        </motion.div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6 text-center">
        <div>
          <span className="text-[56px]">😕</span>
          <p className="text-white text-[18px] font-bold mt-4 mb-2">No encontrado</p>
          <p className="text-[#888] text-[13px] mb-6">{error ?? "Este recap no existe"}</p>
          <button onClick={() => router.push("/trips")} className="text-[#0A84FF] text-[13px]">← Mis viajes</button>
        </div>
      </div>
    )
  }

  const { trip, days, aiNarrative, budgetStats, magicMoments, travelerProfile, stats } = data
  const heroImage = trip.imageUrl
    ?? `https://source.unsplash.com/featured/1400x900/?${encodeURIComponent(trip.destination)},travel`

  return (
    <div className="min-h-screen bg-[#0a0a0f]" style={{ fontFamily: "system-ui, sans-serif" }} ref={recapRef}>

      {/* ═══════════ HERO ═══════════ */}
      <div className="relative overflow-hidden" style={{ minHeight: "420px" }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(10,10,15,0.8) 65%, #0a0a0f 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,132,255,0.12) 0%, rgba(88,86,214,0.08) 100%)" }} />

        <div className="relative z-10 max-w-md mx-auto px-6 pt-20 pb-8">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p variants={fadeUp} className="text-[11px] text-[#0A84FF] font-bold uppercase tracking-[0.2em] mb-4">
              Tu viaje ✈️
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-[52px] font-black text-white leading-[0.95] mb-3 capitalize">
              {trip.destination}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-[15px] text-[#c0c6d6] mb-1">
              {trip.country} · {formatDateRange(trip.startDate, trip.endDate)}
            </motion.p>
            <motion.p variants={fadeUp} className="text-[28px] font-black text-white mt-4">
              {stats.totalDays} días. Esto es lo que viviste.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 space-y-8 pb-10">

        {/* ═══════════ THE NUMBERS ═══════════ */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
        >
          <motion.p variants={fadeUp} className="text-[11px] text-[#666] uppercase tracking-[0.2em] font-bold mb-4">
            📊 Los números
          </motion.p>
          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
            <StatCard emoji="🚶" value={stats.kmEstimate} suffix="km" label="caminados" />
            <StatCard emoji="📍" value={stats.totalActivities} label="actividades" />
            <StatCard emoji="📅" value={stats.totalDays} label="días" />
            <StatCard emoji="✍️" value={stats.diaryEntries} label="entradas de diario" />
          </motion.div>
        </motion.div>

        {/* ═══════════ BUDGET RECAP ═══════════ */}
        {budgetStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] text-[#666] uppercase tracking-[0.2em] font-bold mb-4">
              💰 Tu presupuesto
            </p>
            <div
              className="p-5 rounded-2xl"
              style={{
                background: budgetStats.savedPct > 0
                  ? "linear-gradient(135deg, rgba(48,209,88,0.1) 0%, rgba(48,209,88,0.03) 100%)"
                  : "linear-gradient(135deg, rgba(255,69,58,0.1) 0%, rgba(255,69,58,0.03) 100%)",
                border: `1px solid ${budgetStats.savedPct > 0 ? "rgba(48,209,88,0.15)" : "rgba(255,69,58,0.15)"}`,
              }}
            >
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-[36px] font-black text-white">
                  <AnimatedCounter value={budgetStats.totalSpent} prefix="€" />
                </span>
                <span className="text-[14px] text-[#888]">de €{budgetStats.totalBudget}</span>
              </div>

              <div className="flex gap-4 mb-4">
                <div>
                  <p className="text-[22px] font-bold text-white">€{budgetStats.dailyAvg}</p>
                  <p className="text-[10px] text-[#888]">por día</p>
                </div>
                <div>
                  <p className="text-[22px] font-bold" style={{ color: budgetStats.savedPct > 0 ? "#30D158" : "#FF453A" }}>
                    {budgetStats.savedPct > 0 ? `${budgetStats.savedPct}%` : `${Math.abs(budgetStats.savedPct)}%`}
                  </p>
                  <p className="text-[10px] text-[#888]">
                    {budgetStats.savedPct > 0 ? "bajo presupuesto 🎉" : "sobre presupuesto"}
                  </p>
                </div>
              </div>

              <p className="text-[12px] text-[#aaa]">
                Lo que más gastaste: {CATEGORY_EMOJI[budgetStats.topCategory] ?? "📦"} €{budgetStats.topCategoryAmount} en {budgetStats.topCategory}
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══════════ TRAVELER PROFILE ═══════════ */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="relative overflow-hidden rounded-2xl p-6 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(88,86,214,0.15) 0%, rgba(191,90,242,0.1) 50%, rgba(10,132,255,0.1) 100%)",
            border: "1px solid rgba(191,90,242,0.2)",
          }}
        >
          <span className="text-[56px] block mb-3">{travelerProfile.emoji}</span>
          <p className="text-[11px] text-[#BF5AF2] uppercase tracking-[0.2em] font-bold mb-2">Tu estilo de viajero</p>
          <p className="text-[28px] font-black text-white leading-tight mb-2">{travelerProfile.label}</p>
          <p className="text-[13px] text-[#aaa] leading-relaxed">{travelerProfile.description}</p>

          {/* Top activity types */}
          <div className="flex justify-center gap-3 mt-4">
            {stats.topActivityTypes.map(t => (
              <div
                key={t.type}
                className="px-3 py-1.5 rounded-full text-[11px]"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {t.emoji} {t.type} ×{t.count}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ═══════════ AI NARRATIVE ═══════════ */}
        {aiNarrative && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5 }}
            className="p-5 rounded-2xl"
            style={{ background: "rgba(191,90,242,0.07)", border: "1px solid rgba(191,90,242,0.18)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[20px]">✨</span>
              <p className="text-[11px] font-bold text-[#BF5AF2] uppercase tracking-[0.15em]">Tu historia</p>
            </div>
            <p className="text-[15px] text-[#e0e6f0] leading-relaxed italic">&ldquo;{aiNarrative}&rdquo;</p>
          </motion.div>
        )}

        {/* ═══════════ HIGHLIGHTS ═══════════ */}
        {(magicMoments.length > 0 || stats.mostIntenseDay) && (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-40px" }}
          >
            <motion.p variants={fadeUp} className="text-[11px] text-[#666] uppercase tracking-[0.2em] font-bold mb-4">
              🏆 Highlights
            </motion.p>

            <div className="space-y-3">
              {/* Most intense day */}
              {stats.mostIntenseDay && (
                <motion.div
                  variants={fadeUp}
                  className="p-4 rounded-2xl"
                  style={{ background: "rgba(255,159,10,0.06)", border: "1px solid rgba(255,159,10,0.12)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[16px]">🔥</span>
                    <p className="text-[12px] font-semibold text-[#FF9F0A]">Día más intenso</p>
                  </div>
                  <p className="text-[14px] text-white font-bold">
                    Día {stats.mostIntenseDay.dayNumber} — {stats.mostIntenseDay.count} actividades
                  </p>
                </motion.div>
              )}

              {/* Magic Moments */}
              {magicMoments.map((mm, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="p-4 rounded-2xl"
                  style={{ background: "rgba(191,90,242,0.06)", border: "1px solid rgba(191,90,242,0.12)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[16px]">✨</span>
                    <p className="text-[12px] font-semibold text-[#BF5AF2]">Descubrimiento</p>
                  </div>
                  <p className="text-[13px] text-white font-bold">{mm.name}</p>
                  <p className="text-[11px] text-[#aaa] mt-1 line-clamp-2">{mm.reason}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══════════ DAY BY DAY ═══════════ */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-20px" }}
        >
          <motion.p variants={fadeUp} className="text-[11px] text-[#666] uppercase tracking-[0.2em] font-bold mb-4">
            📋 Día a día
          </motion.p>

          <div className="space-y-3">
            {days.map((day) => (
              <DayCard key={day.dayNumber} day={day} />
            ))}
          </div>
        </motion.div>

        {/* ═══════════ ACTIONS ═══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="space-y-3 pt-4 pb-10"
        >
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-[15px] text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
          >
            <span className="material-symbols-outlined text-[20px]">
              {copied ? "check_circle" : "share"}
            </span>
            {copied ? "¡Enlace copiado!" : "Compartir mi viaje"}
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/trips")}
              className="flex-1 py-3 rounded-2xl text-[13px] text-[#888] transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              ← Mis viajes
            </button>
            <button
              onClick={() => router.push("/plan")}
              className="flex-1 py-3 rounded-2xl text-[13px] text-[#888] transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              Ver plan →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ emoji, value, suffix = "", label }: { emoji: string; value: number; suffix?: string; label: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="p-4 rounded-2xl"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <span className="text-[24px] block mb-2">{emoji}</span>
      <p className="text-[24px] font-black text-white leading-none">
        <AnimatedCounter value={value} suffix={suffix} />
      </p>
      <p className="text-[11px] text-[#888] mt-1">{label}</p>
    </motion.div>
  )
}

function DayCard({ day }: { day: DayRecap }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(22,22,30,0.95)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[14px] font-black text-white"
            style={{ background: "rgba(10,132,255,0.12)", border: "1px solid rgba(10,132,255,0.2)" }}
          >
            {day.dayNumber}
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white">
              Día {day.dayNumber} · {day.activities.length} actividades
            </p>
            <p className="text-[11px] text-[#666]">
              {day.activities.slice(0, 3).map(a => a.emoji).join(" ")}
              {day.activities.length > 3 && ` +${day.activities.length - 3}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {day.journal && <span className="text-[28px]">{day.journal.moodEmoji}</span>}
          <span
            className="material-symbols-outlined text-[18px] text-[#666] transition-transform"
            style={{ transform: expanded ? "rotate(180deg)" : "none" }}
          >
            expand_more
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="pt-3" />
              {/* Activity chips */}
              <div className="flex flex-wrap gap-1.5">
                {day.activities.map((act, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span className="text-[14px]">{act.emoji}</span>
                    <span className="text-[11px] text-[#d0d0d0] font-medium">{act.name}</span>
                  </div>
                ))}
              </div>

              {/* Journal */}
              {day.journal?.summary && (
                <div
                  className="p-3 rounded-xl mt-2"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <p className="text-[12px] text-[#999] leading-relaxed italic">&ldquo;{day.journal.summary}&rdquo;</p>
                  <div className="flex items-center gap-3 mt-2">
                    {day.journal.energyScore && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#666]">Energía:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: i <= (day.journal!.energyScore ?? 0) ? "#30D158" : "rgba(255,255,255,0.1)" }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {day.journal.wouldRepeat !== null && (
                      <span className="text-[10px] text-[#666]">
                        {day.journal.wouldRepeat ? "✅ Repetiría" : "🤔 No repetiría"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
