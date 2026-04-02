"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, useInView } from "framer-motion"
import posthog from "posthog-js"

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
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start)
  const e = new Date(end)
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }
  return `${s.toLocaleDateString("es-ES", opts)} – ${e.toLocaleDateString("es-ES", opts)}, ${e.getFullYear()}`
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const end = value
    const duration = 1000
    const step = Math.ceil(end / (duration / 16))
    const timer = setInterval(() => {
      start = Math.min(start + step, end)
      setCount(start)
      if (start >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, value])

  return <span ref={ref}>{count}{suffix}</span>
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function RecapPage() {
  const { tripId } = useParams<{ tripId: string }>()
  const router = useRouter()
  const [data, setData] = useState<RecapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
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

  const handleDownload = useCallback(async () => {
    if (!recapRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import("html2canvas")).default
      const canvas = await html2canvas(recapRef.current, {
        backgroundColor: "#0a0a0f",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      })
      const link = document.createElement("a")
      link.download = `recap-${data?.trip.destination ?? "viaje"}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch {
      // silently ignore screenshot errors
    } finally {
      setDownloading(false)
    }
  }, [data?.trip.destination])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.span
            animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            className="material-symbols-outlined text-[48px] text-[#0A84FF]"
          >
            auto_stories
          </motion.span>
          <p className="text-[#888] text-[14px]">Preparando tu recap...</p>
        </div>
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

  const { trip, days, aiNarrative, hasDiaryData } = data
  const totalActivities = days.reduce((s, d) => s + d.activities.length, 0)
  const diaryEntries = days.filter(d => d.journal).length
  const kmEstimate = Math.round(totalActivities * 1.8)
  const heroImage = trip.imageUrl
    ?? `https://source.unsplash.com/featured/1400x900/?${encodeURIComponent(trip.destination)},travel`

  const stats = [
    { icon: "📅", value: days.length, label: "días", suffix: "" },
    { icon: "📍", value: totalActivities, label: "actividades", suffix: "" },
    { icon: "🚶", value: kmEstimate, label: "km aprox.", suffix: "" },
    { icon: "✍️", value: diaryEntries, label: hasDiaryData ? "entradas" : "sin diario", suffix: "" },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]" style={{ fontFamily: "system-ui, sans-serif" }} ref={recapRef}>

      {/* ─── Hero with image ─── */}
      <div className="relative overflow-hidden" style={{ minHeight: "380px" }}>
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(10,10,15,0.75) 60%, #0a0a0f 100%)" }}
        />
        {/* Subtle blue tint overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(10,132,255,0.15) 0%, rgba(88,86,214,0.1) 100%)" }}
        />

        <div className="relative z-10 max-w-xl mx-auto px-6 pt-16 pb-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.p variants={fadeUp} className="text-[12px] text-[#0A84FF] font-semibold uppercase tracking-widest mb-3">
              Mi viaje ✈️
            </motion.p>
            <motion.h1 variants={fadeUp} className="text-[48px] font-black text-white leading-none mb-2 capitalize">
              {trip.destination}
            </motion.h1>
            <motion.p variants={fadeUp} className="text-[16px] text-[#c0c6d6] mb-8">
              {trip.country} · {formatDateRange(trip.startDate, trip.endDate)}
            </motion.p>

            {/* Stats bar */}
            <motion.div variants={fadeUp} className="grid grid-cols-4 gap-2">
              {stats.map(s => (
                <div
                  key={s.label}
                  className="flex flex-col items-center py-3 px-1 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <span className="text-[22px] mb-1">{s.icon}</span>
                  <span className="text-[20px] font-bold text-white leading-none">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </span>
                  <span className="text-[10px] text-[#999] mt-0.5 text-center leading-tight">{s.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-5 py-6 space-y-5">

        {/* ─── AI Narrative ─── */}
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
              <p className="text-[12px] font-semibold text-[#BF5AF2] uppercase tracking-wider">Tu historia</p>
            </div>
            <p className="text-[15px] text-[#e0e6f0] leading-relaxed italic">&ldquo;{aiNarrative}&rdquo;</p>
          </motion.div>
        )}

        {/* ─── Day by day ─── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-20px" }}
          className="space-y-4"
        >
          {days.map((day) => (
            <motion.div
              key={day.dayNumber}
              variants={fadeUp}
              className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(22,22,30,0.95)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Day header */}
              <div
                className="px-4 pt-4 pb-3 flex items-start justify-between gap-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div>
                  <p className="text-[11px] text-[#666] uppercase tracking-widest font-medium">Día {day.dayNumber}</p>
                  <p className="text-[14px] font-bold text-white mt-0.5">{day.activities.length} actividades</p>
                </div>
                {day.journal && (
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-[40px] leading-none">{day.journal.moodEmoji}</span>
                    {day.journal.energyScore && (
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: i <= (day.journal!.energyScore ?? 0) ? "#30D158" : "rgba(255,255,255,0.1)" }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Activities horizontal scroll chips */}
              <div className="px-4 pt-3 pb-2">
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                  {day.activities.map((act, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <span className="text-[15px]">{act.emoji}</span>
                      <span className="text-[12px] text-[#d0d0d0] font-medium whitespace-nowrap max-w-[120px] truncate">{act.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Journal summary */}
              {day.journal?.summary && (
                <div className="px-4 pb-4">
                  <div
                    className="mt-1 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                  >
                    <p className="text-[12px] text-[#999] leading-relaxed">&ldquo;{day.journal.summary}&rdquo;</p>
                    {day.journal.wouldRepeat !== null && (
                      <p className="text-[11px] mt-2 text-[#666]">
                        {day.journal.wouldRepeat ? "✅ Lo repetiría" : "🤔 No lo repetiría"}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!day.journal && (
                <div className="px-4 pb-4 pt-1">
                  <p className="text-[11px] text-[#444] italic">Sin entrada de diario para este día</p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Action buttons ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="pb-10 space-y-3"
        >
          {/* Share recap → /share/[tripId] */}
          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-[15px] text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
          >
            <span className="material-symbols-outlined text-[20px]">
              {copied ? "check_circle" : "share"}
            </span>
            {copied ? "¡Enlace copiado!" : "Compartir recap"}
          </button>

          {/* Download as image */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-[14px] text-white transition-all active:scale-[0.98] disabled:opacity-60"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <span className="material-symbols-outlined text-[20px]">
              {downloading ? "hourglass_empty" : "download"}
            </span>
            {downloading ? "Generando imagen..." : "Descargar como imagen"}
          </button>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => router.push("/trips")}
              className="flex-1 py-3 text-[13px] text-[#666] hover:text-[#aaa] transition-colors"
            >
              ← Mis viajes
            </button>
            <button
              onClick={() => router.push("/plan")}
              className="flex-1 py-3 text-[13px] text-[#666] hover:text-[#aaa] transition-colors"
            >
              Ir al plan →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
