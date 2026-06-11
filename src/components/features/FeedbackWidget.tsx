"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { useAnalytics } from "@/lib/analytics/useAnalytics"

type FeedbackCategory = "bug" | "idea" | "otro"

const CATEGORIES: { value: FeedbackCategory; emoji: string; label: string }[] = [
  { value: "bug", emoji: "🐞", label: "Error" },
  { value: "idea", emoji: "💡", label: "Idea" },
  { value: "otro", emoji: "💬", label: "Otro" },
]

// Pages where the widget would get in the way of conversion or public views
const HIDDEN_PREFIXES = ["/login", "/onboarding", "/share", "/invite", "/offline"]

export function FeedbackWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory>("idea")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { track } = useAnalytics()

  if (!pathname || pathname === "/" || HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null
  }

  function close() {
    setOpen(false)
    setError(null)
    setSent(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 3) {
      setError("Cuéntanos un poco más (mínimo 3 caracteres).")
      return
    }

    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim(), pagePath: pathname }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(payload?.error?.message ?? "No se pudo enviar el feedback")
      }
      track("feedback_submitted", { category, page_path: pathname })
      setSent(true)
      setMessage("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el feedback")
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Enviar feedback"
        className="fixed right-4 bottom-24 lg:bottom-6 lg:right-6 z-[2100] w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #0A84FF, #5856D6)",
          boxShadow: "0 8px 24px rgba(10,132,255,0.4)",
        }}
      >
        <span className="material-symbols-outlined text-white text-[22px]">rate_review</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !sending) close()
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="w-full max-w-md rounded-3xl overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #1c1c1e 0%, #0f1117 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
              }}
            >
              {sent ? (
                <div className="px-6 py-10 text-center">
                  <span className="text-[40px]">🙌</span>
                  <h2 className="text-[20px] font-bold text-white mt-3 mb-2">¡Gracias!</h2>
                  <p className="text-[13px] text-[#9ca3af]">
                    Tu feedback nos ayuda a mejorar Viaje360.
                  </p>
                  <button
                    onClick={close}
                    className="mt-6 px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-6 py-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[18px] font-bold text-white">¿Cómo podemos mejorar?</h2>
                    <button
                      type="button"
                      onClick={close}
                      disabled={sending}
                      aria-label="Cerrar"
                      className="text-[#666] hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>

                  <div className="flex gap-2 mb-4">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                          category === c.value ? "text-white" : "text-[#9ca3af] hover:text-white"
                        }`}
                        style={
                          category === c.value
                            ? { background: "linear-gradient(135deg, #0A84FF, #5856D6)" }
                            : {
                                background: "rgba(42,42,44,0.8)",
                                border: "1px solid rgba(255,255,255,0.08)",
                              }
                        }
                      >
                        {c.emoji} {c.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      category === "bug"
                        ? "¿Qué ha fallado? ¿Qué estabas haciendo?"
                        : "Cuéntanos tu idea o sugerencia…"
                    }
                    rows={4}
                    maxLength={2000}
                    className="w-full px-4 py-3 rounded-xl text-[14px] text-white placeholder-[#666] outline-none resize-none focus:ring-2 focus:ring-[#0A84FF]/50"
                    style={{
                      background: "rgba(42,42,44,0.8)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />

                  {error && (
                    <div
                      className="mt-3 p-3 rounded-xl text-[12px] text-[#FF453A]"
                      style={{
                        background: "rgba(255,69,58,0.1)",
                        border: "1px solid rgba(255,69,58,0.2)",
                      }}
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full mt-4 py-3.5 rounded-2xl font-semibold text-white transition-all disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
                  >
                    {sending ? "Enviando…" : "Enviar feedback"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
