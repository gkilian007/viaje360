"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/useAppStore"
import { useOnboardingStore } from "@/store/useOnboardingStore"
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client"
import { BottomNav } from "@/components/layout/BottomNav"
import { motion } from "framer-motion"
import type { User as SupabaseUser } from "@supabase/supabase-js"

const QUICK_PRESETS = [
  { emoji: "👨‍👩‍👧‍👦", label: "Familia", desc: "Con niños" },
  { emoji: "💑", label: "Pareja", desc: "Romántico" },
  { emoji: "🎒", label: "Solo", desc: "Aventura" },
  { emoji: "👯", label: "Amigos", desc: "Grupo" },
  { emoji: "♿", label: "Accesible", desc: "Sin barreras" },
  { emoji: "🐕", label: "Mascota", desc: "Pet-friendly" },
]

export default function HomePage() {
  const router = useRouter()
  const currentTrip = useAppStore((s) => s.currentTrip)
  const resetOnboarding = useOnboardingStore((s) => s.reset)
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    async function loadUser() {
      if (!isSupabaseBrowserConfigured()) {
        setLoadingAuth(false)
        return
      }
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      setAuthUser(data.user ?? null)
      setLoadingAuth(false)
    }
    void loadUser()
  }, [])

  function handleNewTrip() {
    resetOnboarding()
    router.push("/onboarding")
  }

  function handleContinueTrip() {
    router.push("/plan")
  }

  async function handleLogout() {
    if (isSupabaseBrowserConfigured()) {
      const supabase = createClient()
      await supabase.auth.signOut()
    }
    router.replace("/login")
  }

  const displayName =
    authUser?.user_metadata?.full_name ??
    authUser?.email?.split("@")[0] ??
    "Viajero"

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#131315" }}>
        <div className="w-10 h-10 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-28" style={{ background: "#131315" }}>
      {/* Profile header */}
      <div className="px-5 pt-14 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg, #0A84FF, #5856D6)",
              }}
            >
              {initials}
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-white">Hola, {displayName}</h1>
              <p className="text-[12px] text-[#9ca3af]">
                {authUser?.email ?? "Modo demo"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(42,42,44,0.8)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span className="material-symbols-outlined text-[20px] text-[#9ca3af]">logout</span>
          </button>
        </div>
      </div>

      {/* Current trip */}
      {currentTrip && (
        <div className="px-5 mt-6">
          <p className="text-[11px] uppercase tracking-widest text-[#c0c6d6] font-medium mb-3">
            Tu viaje actual
          </p>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleContinueTrip}
            className="w-full rounded-2xl overflow-hidden text-left"
            style={{
              background: "linear-gradient(135deg, rgba(10,132,255,0.12), rgba(88,86,214,0.12))",
              border: "1px solid rgba(10,132,255,0.25)",
            }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(10,132,255,0.2)" }}
                  >
                    <span className="text-[28px]">✈️</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-white">
                      {currentTrip.destination}
                    </h3>
                    <p className="text-[12px] text-[#9ca3af]">
                      {currentTrip.country ? `${currentTrip.country} · ` : ""}
                      {currentTrip.status === "active"
                        ? "En curso"
                        : currentTrip.status === "planning"
                        ? "Planificando"
                        : "Completado"}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[22px] text-[#0A84FF]">
                  arrow_forward_ios
                </span>
              </div>
              <div
                className="inline-block px-3 py-1 rounded-full text-[11px] font-medium text-[#0A84FF]"
                style={{ background: "rgba(10,132,255,0.15)" }}
              >
                Continuar viaje →
              </div>
            </div>
          </motion.button>
        </div>
      )}

      {/* Empty state if no trips */}
      {!currentTrip && (
        <div className="px-5 mt-6">
          <div
            className="p-6 rounded-2xl text-center"
            style={{ background: "rgba(31,31,33,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-[48px] block mb-3">🗺️</span>
            <h3 className="text-[16px] font-bold text-white mb-1">Sin viajes todavía</h3>
            <p className="text-[13px] text-[#9ca3af]">
              Crea tu primer itinerario personalizado con IA
            </p>
          </div>
        </div>
      )}

      {/* New trip CTA */}
      <div className="px-5 mt-6">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNewTrip}
          className="w-full p-5 rounded-2xl text-left"
          style={{
            background: "linear-gradient(135deg, #0A84FF, #5856D6)",
            boxShadow: "0 8px 32px rgba(10,132,255,0.3)",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] text-white">
                add_location_alt
              </span>
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-white">Crear nuevo plan</h3>
              <p className="text-[13px] text-white/70 mt-0.5">
                Destino, compañeros, presupuesto, estilo…
              </p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Quick presets */}
      <div className="px-5 mt-8">
        <p className="text-[11px] uppercase tracking-widest text-[#c0c6d6] font-medium mb-3">
          Tipo de viaje
        </p>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_PRESETS.map((preset) => (
            <motion.button
              key={preset.label}
              whileTap={{ scale: 0.95 }}
              onClick={handleNewTrip}
              className="flex flex-col items-center gap-1.5 p-4 rounded-2xl"
              style={{
                background: "rgba(31,31,33,0.9)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span className="text-[28px]">{preset.emoji}</span>
              <span className="text-[13px] font-semibold text-white">{preset.label}</span>
              <span className="text-[10px] text-[#888]">{preset.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="px-5 mt-8 mb-4">
        <div
          className="p-4 rounded-2xl"
          style={{ background: "rgba(31,31,33,0.9)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-start gap-3">
            <span className="text-[24px]">💡</span>
            <div>
              <h4 className="text-[14px] font-semibold text-white mb-1">La IA adapta tu viaje</h4>
              <p className="text-[12px] text-[#9ca3af] leading-relaxed">
                Cuantos más detalles des en la configuración, mejor será tu itinerario. Puedes modificarlo después.
              </p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
