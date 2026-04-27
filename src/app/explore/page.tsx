"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/useAppStore"
import { useOnboardingStore } from "@/store/useOnboardingStore"
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { BottomNav } from "@/components/layout/BottomNav"
import { SideNav } from "@/components/layout/SideNav"
import { motion } from "framer-motion"
import Image from "next/image"
import { getDestinationHeroThumb } from "@/lib/services/destination-photos"
import type { Interest } from "@/lib/onboarding-types"

// ─── Curated content — no dependency on user state ───────────────────────────

const FEATURED_DESTINATIONS = [
  { name: "Tokio", country: "Japón", emoji: "🗼", color: "#FF453A", tag: "Cultura y tecnología" },
  { name: "Barcelona", country: "España", emoji: "🏛️", color: "#0A84FF", tag: "Arquitectura y playa" },
  { name: "Bali", country: "Indonesia", emoji: "🏝️", color: "#30D158", tag: "Naturaleza y bienestar" },
  { name: "Nueva York", country: "EE.UU.", emoji: "🗽", color: "#5856D6", tag: "Ciudad sin parar" },
  { name: "Roma", country: "Italia", emoji: "🏟️", color: "#FF9F0A", tag: "Historia viva" },
  { name: "París", country: "Francia", emoji: "🗼", color: "#BF5AF2", tag: "Arte y gastronomía" },
  { name: "Lisboa", country: "Portugal", emoji: "🐟", color: "#32D74B", tag: "Fado y pastelería" },
  { name: "Kioto", country: "Japón", emoji: "⛩️", color: "#FF6B6B", tag: "Tradición japonesa" },
  { name: "Marrakech", country: "Marruecos", emoji: "🕌", color: "#FFB84D", tag: "Souks y especias" },
  { name: "Ámsterdam", country: "Países Bajos", emoji: "🌷", color: "#4ECDC4", tag: "Canales y arte" },
  { name: "Dubái", country: "EAU", emoji: "🌆", color: "#C4A35A", tag: "Lujo y modernidad" },
  { name: "Ciudad de México", country: "México", emoji: "🌮", color: "#E84393", tag: "Cultura y sabor" },
].map(d => ({ ...d, photoUrl: getDestinationHeroThumb(d.name, 600) }))

const TRAVEL_STYLES = [
  { emoji: "🎒", label: "Mochilero", desc: "Máximo con mínimo presupuesto", companion: "solo" },
  { emoji: "💑", label: "Pareja", desc: "Escapadas románticas", companion: "pareja" },
  { emoji: "👨‍👩‍👧‍👦", label: "Familia", desc: "Para todas las edades", companion: "familia" },
  { emoji: "👯", label: "Amigos", desc: "Planes en grupo", companion: "amigos" },
]

const HIDDEN_GEMS = [
  { name: "Kotor", country: "Montenegro", emoji: "🏰", desc: "Ciudad medieval amurallada en un fiordo adriático" },
  { name: "Matera", country: "Italia", emoji: "🪨", desc: "Ciudad rupestre de 9.000 años de antigüedad, Capital Europea de la Cultura" },
  { name: "Faroe Islands", country: "Dinamarca", emoji: "🌊", desc: "Acantilados dramáticos y pueblos de turba en el Atlántico Norte" },
  { name: "Luang Prabang", country: "Laos", emoji: "🛕", desc: "Ciudad de templos y cascadas en el Mekong" },
  { name: "Chefchaouen", country: "Marruecos", emoji: "💙", desc: "La ciudad azul escondida en las montañas del Rif" },
  { name: "Tbilisi", country: "Georgia", emoji: "🏔️", desc: "Vinos naturales, baños de azufre y arquitectura soviética" },
]

const TRAVEL_TIPS = [
  { icon: "🌦️", tip: "Viaje360 adapta tu itinerario en tiempo real si llueve o hace calor extremo" },
  { icon: "✨", tip: "El Momento Mágico detecta gemas ocultas cerca de ti mientras viajas" },
  { icon: "📖", tip: "El diario de viaje con IA genera tu historia personalizada al final del viaje" },
  { icon: "🚇", tip: "El sistema de transporte sugiere metro o caminar según tu energía del día" },
  { icon: "🎟️", tip: "Reserva entradas directamente desde la actividad de tu itinerario" },
]

interface DynamicExploreIdea {
  name: string
  type: string
  distanceMeters: number
  emoji: string
}

interface DestinationTransportIdea {
  name: string
  category: string
  mode: string
  zone: string | null
  accessibility: string | null
  lines: string | null
  officialUrl: string | null
  note: string | null
  tags: string[]
  fitLabel?: "recommended" | "caution" | "avoid"
  extraMinutes?: number
  fitReasons?: string[]
  doorToDoor?: {
    walkToStopMinutes: number
    waitMinutes: number
    rideMinutes: number
    stationExtraMinutes: number
    totalMinutes: number
    paceLabel: "normal" | "slow" | "very-slow"
    recommended: boolean
    rationale: string
  }
  recommendedMode?: {
    recommendedMode: "walk" | "bus" | "metro" | "taxi" | "mixed"
    reason: string
  }
  segmentDecision?: {
    preferredMode: "walk" | "bus" | "metro" | "taxi" | "mixed"
    walkMinutes: number
    transportMinutes: number
    timeSavedMinutes: number
    rationale: string
  }
}

const DISCOVERY_COORDS: Record<string, { lat: number; lng: number }> = {
  Madrid: { lat: 40.4168, lng: -3.7038 },
  Barcelona: { lat: 41.3874, lng: 2.1686 },
  Roma: { lat: 41.9028, lng: 12.4964 },
  París: { lat: 48.8566, lng: 2.3522 },
  Lisboa: { lat: 38.7223, lng: -9.1393 },
  Tokio: { lat: 35.6762, lng: 139.6503 },
  "Ciudad de México": { lat: 19.4326, lng: -99.1332 },
}

const IDEA_TYPE_INTERESTS: Partial<Record<DynamicExploreIdea["type"], Interest[]>> = {
  arte: ["arte", "fotografia"],
  historia: ["historia", "arte"],
  fotografia: ["fotografia", "historia"],
  naturaleza: ["naturaleza", "fotografia"],
  gastronomia: ["gastronomia"],
  cultural: ["historia", "arte"],
}

const INTEREST_LABELS: Record<Interest, string> = {
  historia: "historia",
  gastronomia: "gastronomía",
  playa: "playa",
  nocturna: "vida nocturna",
  aventura: "aventura",
  shopping: "shopping",
  fotografia: "fotografía",
  arte: "arte",
  naturaleza: "naturaleza",
  familiar: "planes familiares",
  deportes: "deportes",
  bienestar: "bienestar",
}

const IDEA_TYPE_REASON: Partial<Record<DynamicExploreIdea["type"], string>> = {
  arte: "Ideal si te apetece un viaje más visual, creativo y con rincones fotogénicos.",
  historia: "Buen punto de partida para una escapada cultural con contexto e historia.",
  fotografia: "Encaja muy bien si buscas sitios con personalidad y momentos fáciles de recordar.",
  naturaleza: "Perfecto si quieres algo más fresco, abierto y con aire de descubrimiento.",
  gastronomia: "Muy buena señal si quieres que el viaje tenga también una capa potente de sabor local.",
  cultural: "Te da una base muy sólida para montar un viaje con mezcla de cultura y descubrimiento.",
}

const IDEA_TYPE_TRIP_PREVIEW: Partial<Record<DynamicExploreIdea["type"], { title: string; pace: string; focus: string; cta: string }>> = {
  arte: {
    title: "Escapada cultural y visual",
    pace: "tranquilo a medio",
    focus: "arte, fotografía y paseo urbano",
    cta: "Crear escapada cultural",
  },
  historia: {
    title: "Viaje cultural con contexto",
    pace: "medio",
    focus: "historia, monumentos y rincones con relato",
    cta: "Crear viaje cultural",
  },
  fotografia: {
    title: "Ruta visual para descubrir",
    pace: "tranquilo a medio",
    focus: "fotografía, rincones con carácter y paseo",
    cta: "Montar viaje fotográfico",
  },
  naturaleza: {
    title: "Plan abierto con aire de descubrimiento",
    pace: "tranquilo",
    focus: "naturaleza, vistas y tiempo al aire libre",
    cta: "Crear escapada natural",
  },
  gastronomia: {
    title: "Escapada foodie con sabor local",
    pace: "medio",
    focus: "gastronomía, barrios con ambiente y paradas con intención",
    cta: "Planear viaje foodie",
  },
  cultural: {
    title: "Escapada equilibrada para descubrir ciudad",
    pace: "medio",
    focus: "cultura, historia y puntos con personalidad",
    cta: "Crear viaje para descubrir ciudad",
  },
}

export default function ExplorePage() {
  const router = useRouter()
  const { monuments } = useAppStore()
  const { setField: setOnboardingField, reset: resetOnboarding } = useOnboardingStore()
  const [search, setSearch] = useState("")
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [dynamicDestination, setDynamicDestination] = useState<keyof typeof DISCOVERY_COORDS>("Barcelona")
  const [dynamicIdeas, setDynamicIdeas] = useState<DynamicExploreIdea[]>([])
  const [dynamicProvider, setDynamicProvider] = useState<string | null>(null)
  const [dynamicIdeasLoading, setDynamicIdeasLoading] = useState(true)
  const [selectedIdea, setSelectedIdea] = useState<DynamicExploreIdea | null>(null)
  const [transportIdeas, setTransportIdeas] = useState<DestinationTransportIdea[]>([])
  const [transportIdeasLoading, setTransportIdeasLoading] = useState(false)

  const dynamicCoords = useMemo(() => DISCOVERY_COORDS[dynamicDestination], [dynamicDestination])

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setAuthUser(data.user ?? null))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadDynamicIdeas() {
      if (!cancelled) {
        setDynamicIdeasLoading(true)
        setDynamicIdeas([])
        setDynamicProvider(null)
      }

      try {
        const res = await fetch(`/api/nearby?lat=${dynamicCoords.lat}&lng=${dynamicCoords.lng}&radius=900`)
        if (!res.ok) {
          if (!cancelled) {
            setDynamicIdeas([])
            setDynamicProvider(null)
            setDynamicIdeasLoading(false)
          }
          return
        }

        const payload = await res.json()
        const pois = Array.isArray(payload?.data?.pois) ? payload.data.pois : []
        if (cancelled) return
        setDynamicIdeas(
          pois.slice(0, 4).map((poi: DynamicExploreIdea) => ({
            name: poi.name,
            type: poi.type,
            distanceMeters: poi.distanceMeters,
            emoji: poi.emoji || "📍",
          }))
        )
        setDynamicProvider(payload?.data?.provider ?? null)
        setDynamicIdeasLoading(false)
      } catch {
        if (!cancelled) {
          setDynamicIdeas([])
          setDynamicProvider(null)
          setDynamicIdeasLoading(false)
        }
      }
    }

    void loadDynamicIdeas()

    return () => {
      cancelled = true
    }
  }, [dynamicCoords.lat, dynamicCoords.lng])

  useEffect(() => {
    let cancelled = false

    async function loadTransportIdeas() {
      if (dynamicDestination !== "Madrid") {
        setTransportIdeas([])
        setTransportIdeasLoading(false)
        return
      }

      setTransportIdeasLoading(true)
      try {
        const params = new URLSearchParams({
          destination: "Madrid",
          limit: "6",
          q: "centro museos shopping aeropuerto",
          mobility: "moderate",
          kidsPets: "",
          transport: "publico,mix",
          luggageLevel: "light",
          distanceMeters: "900",
          timeOfDay: "afternoon",
        })
        const res = await fetch(`/api/destination-transport?${params.toString()}`)
        if (!res.ok) {
          if (!cancelled) {
            setTransportIdeas([])
            setTransportIdeasLoading(false)
          }
          return
        }

        const payload = await res.json()
        const items = Array.isArray(payload?.data?.items) ? payload.data.items : []
        if (!cancelled) {
          setTransportIdeas(items)
          setTransportIdeasLoading(false)
        }
      } catch {
        if (!cancelled) {
          setTransportIdeas([])
          setTransportIdeasLoading(false)
        }
      }
    }

    void loadTransportIdeas()
    return () => {
      cancelled = true
    }
  }, [dynamicDestination])

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

  const email = authUser?.email ?? ""

  const filteredDestinations = FEATURED_DESTINATIONS.filter(
    d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.country.toLowerCase().includes(search.toLowerCase()) ||
      d.tag.toLowerCase().includes(search.toLowerCase())
  )

  const filteredGems = HIDDEN_GEMS.filter(
    g =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.country.toLowerCase().includes(search.toLowerCase()) ||
      g.desc.toLowerCase().includes(search.toLowerCase())
  )

  function handleDestinationSelect(destName: string) {
    resetOnboarding()
    setOnboardingField("destination", destName)
    router.push("/onboarding")
  }

  function openIdeaFlow(idea: DynamicExploreIdea) {
    setSelectedIdea(idea)
  }

  function startTripFromIdea(idea: DynamicExploreIdea) {
    resetOnboarding()
    setOnboardingField("destination", dynamicDestination)
    setOnboardingField("mustSee", idea.name)

    const suggestedInterests = IDEA_TYPE_INTERESTS[idea.type] ?? []
    if (suggestedInterests.length > 0) {
      setOnboardingField("interests", suggestedInterests)
    }

    setSelectedIdea(null)
    router.push("/onboarding")
  }

  function exploreDestinationFromIdea() {
    resetOnboarding()
    setOnboardingField("destination", dynamicDestination)
    setSelectedIdea(null)
    router.push("/onboarding")
  }

  function handleStyleSelect(companion: string) {
    resetOnboarding()
    setOnboardingField("companion", companion as "solo" | "pareja" | "familia" | "amigos")
    router.push("/onboarding")
  }

  const isSearching = search.length > 0
  const hasResults = filteredDestinations.length > 0 || filteredGems.length > 0
  const selectedIdeaInterests = selectedIdea ? IDEA_TYPE_INTERESTS[selectedIdea.type] ?? [] : []
  const selectedIdeaInterestLabels = selectedIdeaInterests.map((interest) => INTEREST_LABELS[interest])
  const selectedIdeaReason = selectedIdea
    ? IDEA_TYPE_REASON[selectedIdea.type] ?? "Puede ser un muy buen punto de partida para aterrizar el viaje con algo concreto."
    : null
  const selectedIdeaTripPreview = selectedIdea
    ? IDEA_TYPE_TRIP_PREVIEW[selectedIdea.type] ?? {
        title: "Escapada con punto de partida claro",
        pace: "medio",
        focus: "descubrimiento urbano y plan ajustado a tus intereses",
        cta: "Crear viaje con esta idea",
      }
    : null

  return (
    <div className="flex min-h-screen" style={{ background: "var(--surface)" }}>
    <div className="hidden lg:block"><SideNav /></div>
    <div className="flex flex-col flex-1 min-h-screen overflow-y-auto pb-28 lg:pb-8">

      {/* Desktop top bar with avatar */}
      <header
        className="hidden lg:flex items-center justify-between px-6 py-3 sticky top-0 z-50"
        style={{
          background: "var(--surface-container)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="Viaje360" width={32} height={32} className="w-8 h-8 rounded-xl" />
          <span className="text-[18px] font-bold text-[var(--on-surface)]">Explorar</span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAvatarMenu((v) => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white cursor-pointer"
            style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
          >
            {initials || "?"}
          </button>
          {showAvatarMenu && (
            <div
              className="absolute right-0 top-12 w-56 rounded-2xl p-2 z-[60] shadow-2xl"
              style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)", backdropFilter: "blur(20px)" }}
            >
              {email && (
                <div className="px-3 py-2 mb-1">
                  <p className="text-[13px] font-semibold text-[var(--on-surface)] truncate">{displayName}</p>
                  <p className="text-[11px] text-[var(--on-surface-variant)] truncate">{email}</p>
                </div>
              )}
              <div style={{ borderTop: "1px solid var(--border-color)" }} />
              <button
                type="button"
                onClick={() => { setShowAvatarMenu(false); router.push("/home") }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-[color:var(--on-surface-variant)] hover:bg-white/5 transition-colors text-left mt-1"
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                Inicio
              </button>
              <button
                type="button"
                onClick={() => { setShowAvatarMenu(false); handleLogout() }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-red-400 hover:bg-red-500/10 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Header */}
      <div className="px-5 pb-5 page-header-safe-lg lg:hidden">
        <p className="text-[11px] uppercase tracking-widest text-[#0A84FF] font-medium mb-1">Descubrir</p>
        <h1 className="text-[28px] font-black text-[var(--on-surface)]">Explorar</h1>
        <p className="text-[13px] text-[var(--on-surface-variant)] mt-1">Inspírate y planea tu próximo viaje</p>
      </div>

      {/* Search */}
      <div className="px-5 mb-5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-color)" }}>
          <span className="material-symbols-outlined text-[20px] text-[var(--on-surface-variant)]">search</span>
          <input
            type="text"
            placeholder="Buscar destinos, estilos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[14px] text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] transition-colors">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Search results */}
      {isSearching && (
        <div className="px-5 space-y-4">
          {filteredDestinations.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[var(--on-surface-variant)] font-medium mb-3">
                Destinos ({filteredDestinations.length})
              </p>
              <div className="space-y-2">
                {filteredDestinations.map(dest => (
                  <motion.button
                    key={dest.name}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDestinationSelect(dest.name)}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)" }}
                  >
                    <span className="text-[28px]">{dest.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-[var(--on-surface)]">{dest.name}</p>
                      <p className="text-[11px] text-[var(--on-surface-variant)]">{dest.country} · {dest.tag}</p>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-[var(--on-surface-variant)]">arrow_forward</span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          {filteredGems.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-widest text-[var(--on-surface-variant)] font-medium mb-3">
                Gemas ocultas ({filteredGems.length})
              </p>
              <div className="space-y-2">
                {filteredGems.map(gem => (
                  <motion.button
                    key={gem.name}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDestinationSelect(gem.name)}
                    className="w-full flex items-start gap-3 p-3 rounded-2xl text-left"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)" }}
                  >
                    <span className="text-[24px] shrink-0 mt-0.5">{gem.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[var(--on-surface)]">{gem.name}</p>
                      <p className="text-[11px] text-[var(--on-surface-variant)]">{gem.country}</p>
                      <p className="text-[11px] text-[var(--on-surface-variant)] mt-1 leading-relaxed">{gem.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          {!hasResults && (
            <div className="text-center py-12">
              <span className="text-[48px]">🌍</span>
              <p className="text-[var(--on-surface)] font-semibold mt-3">No encontrado</p>
              <p className="text-[var(--on-surface-variant)] text-[13px] mt-1">Prueba con otro nombre de ciudad o país</p>
            </div>
          )}
        </div>
      )}

      {/* Main content (no search) */}
      {!isSearching && (
        <>
          {/* Featured destinations + Travel styles — side by side on desktop */}
          <div className="px-5 mb-6 lg:flex lg:gap-6">
            {/* Featured destinations */}
            <div className="lg:flex-1 mb-6 lg:mb-0">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[13px] font-bold text-[var(--on-surface)]">✈️ Destinos populares</p>
                <p className="text-[11px] text-[var(--on-surface-variant)]">Toca para planear</p>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none lg:grid lg:grid-cols-3 lg:overflow-visible">
                {FEATURED_DESTINATIONS.map((dest, idx) => (
                  <motion.button
                    key={dest.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDestinationSelect(dest.name)}
                    className="shrink-0 w-36 lg:w-auto rounded-2xl overflow-hidden text-left"
                    style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}
                  >
                    <div
                      className="h-20 relative flex items-center justify-center overflow-hidden"
                      style={{ background: `${dest.color}18` }}
                    >
                      {dest.photoUrl ? (
                        <Image
                          src={dest.photoUrl}
                          alt={dest.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 1024px) 144px, 200px"
                          unoptimized
                        />
                      ) : (
                        <span className="text-[44px]">{dest.emoji}</span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[13px] font-bold text-[var(--on-surface)]">{dest.name}</p>
                      <p className="text-[10px] text-[var(--on-surface-variant)] mt-0.5">{dest.tag}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Travel styles */}
            <div className="lg:flex-1">
              <p className="text-[13px] font-bold text-[var(--on-surface)] mb-3">🧭 Estilo de viaje</p>
              <div className="grid grid-cols-2 gap-2">
                {TRAVEL_STYLES.map(style => (
                  <motion.button
                    key={style.label}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleStyleSelect(style.companion)}
                    className="flex flex-col items-center gap-1.5 p-4 rounded-2xl"
                    style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}
                  >
                    <span className="text-[32px]">{style.emoji}</span>
                    <p className="text-[13px] font-bold text-[var(--on-surface)]">{style.label}</p>
                    <p className="text-[10px] text-[var(--on-surface-variant)]">{style.desc}</p>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic ideas + Hidden gems — side by side on desktop */}
          <div className="px-5 mb-6 lg:flex lg:gap-6">
            <div className="lg:flex-1 mb-6 lg:mb-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[13px] font-bold text-[var(--on-surface)]">✨ Ideas reales para explorar</p>
                  <p className="text-[11px] text-[var(--on-surface-variant)]">
                    {dynamicProvider === "opentripmap" ? "Sugerencias dinámicas con OpenTripMap" : "Sugerencias dinámicas cercanas"}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-3">
                {Object.keys(DISCOVERY_COORDS).map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setDynamicDestination(city as keyof typeof DISCOVERY_COORDS)}
                    className="shrink-0 px-3 py-2 rounded-xl text-[12px] font-semibold"
                    style={{
                      background: dynamicDestination === city ? "rgba(10,132,255,0.18)" : "var(--surface-container)",
                      border: dynamicDestination === city ? "1px solid rgba(10,132,255,0.35)" : "1px solid var(--border-color)",
                      color: dynamicDestination === city ? "#0A84FF" : "var(--on-surface-variant)",
                    }}
                  >
                    {city}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {dynamicIdeas.length > 0 ? dynamicIdeas.map((idea) => (
                  <motion.button
                    key={`${dynamicDestination}-${idea.name}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openIdeaFlow(idea)}
                    className="w-full flex items-start gap-3 p-4 rounded-2xl text-left"
                    style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}
                  >
                    <span className="text-[24px] shrink-0">{idea.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold text-[var(--on-surface)]">{idea.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(10,132,255,0.12)", color: "#0A84FF" }}>
                          {Math.max(100, Math.round(idea.distanceMeters / 100) * 100)} m
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--on-surface-variant)] mt-1 capitalize">
                        {idea.type} cerca del centro de {dynamicDestination}
                      </p>
                      <p className="text-[10px] text-[#0A84FF] mt-1">
                        Lo añadiremos como imprescindible al empezar el viaje
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-[var(--on-surface-variant)] shrink-0 mt-1">arrow_forward</span>
                  </motion.button>
                )) : (
                  <div
                    className="p-4 rounded-2xl"
                    style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}
                  >
                    <p className="text-[12px] text-[var(--on-surface-variant)]">
                      {dynamicIdeasLoading
                        ? `Cargando ideas dinámicas para ${dynamicDestination}...`
                        : `Ahora mismo no hay ideas reales disponibles para ${dynamicDestination}. Prueba otra ciudad.`}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Madrid transport highlights */}
            <div className="lg:flex-1 mb-6 lg:mb-0">
              <p className="text-[13px] font-bold text-[var(--on-surface)] mb-3">🚇 Highlights de transporte</p>
              {dynamicDestination === "Madrid" ? (
                <div className="space-y-2">
                  {transportIdeas.length > 0 ? transportIdeas.map((item) => (
                    <a
                      key={item.name}
                      href={item.officialUrl ?? undefined}
                      target={item.officialUrl ? "_blank" : undefined}
                      rel={item.officialUrl ? "noreferrer" : undefined}
                      className="block w-full p-4 rounded-2xl"
                      style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-bold text-[var(--on-surface)]">{item.name}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(10,132,255,0.12)", color: "#0A84FF" }}>
                          {item.mode}
                        </span>
                        {item.zone && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "var(--on-surface-variant)" }}>
                            {item.zone}
                          </span>
                        )}
                        {item.fitLabel && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{
                              background: item.fitLabel === "recommended"
                                ? "rgba(48,209,88,0.14)"
                                : item.fitLabel === "caution"
                                  ? "rgba(255,159,10,0.14)"
                                  : "rgba(255,69,58,0.14)",
                              color: item.fitLabel === "recommended"
                                ? "#30D158"
                                : item.fitLabel === "caution"
                                  ? "#FF9F0A"
                                  : "#FF453A",
                            }}
                          >
                            {item.fitLabel === "recommended" ? "buena opción" : item.fitLabel === "caution" ? "con cautela" : "mejor evitar"}
                          </span>
                        )}
                      </div>
                      {item.lines && (
                        <p className="text-[11px] text-[var(--on-surface-variant)] mt-1">{item.lines}</p>
                      )}
                      <p className="text-[11px] text-[var(--on-surface-variant)] mt-1">
                        {item.accessibility ? `Accesibilidad: ${item.accessibility}` : "Accesibilidad pendiente de confirmación"}
                      </p>
                      {typeof item.extraMinutes === "number" && (
                        <p className="text-[11px] text-[var(--on-surface-variant)] mt-1">
                          Penalización estimada: +{item.extraMinutes} min
                        </p>
                      )}
                      {item.doorToDoor && (
                        <p className="text-[11px] text-[var(--on-surface-variant)] mt-1">
                          Puerta a puerta aprox.: {item.doorToDoor.totalMinutes} min · caminar {item.doorToDoor.walkToStopMinutes} · espera {item.doorToDoor.waitMinutes} · trayecto {item.doorToDoor.rideMinutes}
                        </p>
                      )}
                      {item.recommendedMode && (
                        <p className="text-[11px] text-[var(--on-surface-variant)] mt-1">
                          Modo sugerido: <span className="font-semibold text-[var(--on-surface)]">{item.recommendedMode.recommendedMode}</span> · {item.recommendedMode.reason}
                        </p>
                      )}
                      {item.segmentDecision && (
                        <p className="text-[11px] text-[var(--on-surface-variant)] mt-1">
                          Tramo tipo: mejor <span className="font-semibold text-[var(--on-surface)]">{item.segmentDecision.preferredMode}</span> · {item.segmentDecision.transportMinutes} min transporte vs {item.segmentDecision.walkMinutes} min andando
                        </p>
                      )}
                      {item.fitReasons && item.fitReasons.length > 0 && (
                        <p className="text-[10px] text-[var(--on-surface-variant)] mt-1 leading-relaxed">
                          {item.fitReasons.join(" · ")}
                        </p>
                      )}
                      {item.note && (
                        <p className="text-[10px] text-[#0A84FF] mt-1 leading-relaxed">{item.note}</p>
                      )}
                    </a>
                  )) : (
                    <div className="p-4 rounded-2xl" style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}>
                      <p className="text-[12px] text-[var(--on-surface-variant)]">
                        {transportIdeasLoading
                          ? "Cargando capa real de transporte Madrid..."
                          : "Todavía no hay highlights de transporte disponibles para Madrid."}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl" style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}>
                  <p className="text-[12px] text-[var(--on-surface-variant)]">
                    Esta capa DB-first de transporte está activa primero en Madrid. Luego la extenderemos a más destinos.
                  </p>
                </div>
              )}
            </div>

            {/* Hidden gems */}
            <div className="lg:flex-1 mb-6 lg:mb-0">
              <p className="text-[13px] font-bold text-[var(--on-surface)] mb-3">💎 Gemas ocultas</p>
              <div className="space-y-2">
                {HIDDEN_GEMS.map(gem => (
                  <motion.button
                    key={gem.name}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleDestinationSelect(gem.name)}
                    className="w-full flex items-start gap-3 p-4 rounded-2xl text-left"
                    style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)" }}
                  >
                    <span className="text-[28px] shrink-0">{gem.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-[14px] font-bold text-[var(--on-surface)]">{gem.name}</p>
                        <p className="text-[11px] text-[var(--on-surface-variant)]">{gem.country}</p>
                      </div>
                      <p className="text-[12px] text-[var(--on-surface-variant)] mt-1 leading-relaxed">{gem.desc}</p>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-[var(--on-surface-variant)] shrink-0 mt-1">arrow_forward</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="lg:flex-1">
              <p className="text-[13px] font-bold text-[var(--on-surface)] mb-3">💡 ¿Sabías que...?</p>
              <div className="space-y-2">
                {TRAVEL_TIPS.map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)" }}
                  >
                    <span className="text-[18px] shrink-0">{tip.icon}</span>
                    <p className="text-[12px] text-[var(--on-surface-variant)] leading-relaxed">{tip.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Collected monuments (if any) */}
          {monuments.length > 0 && (
            <div className="px-5 mb-6">
              <p className="text-[13px] font-bold text-[var(--on-surface)] mb-3">📍 Lugares visitados</p>
              <div className="space-y-2">
                {monuments.filter(m => m.collected).map(m => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "rgba(48,209,88,0.06)", border: "1px solid rgba(48,209,88,0.15)" }}
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#30D158]"
                      style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--on-surface)]">{m.name}</p>
                      <p className="text-[11px] text-[var(--on-surface-variant)]">{m.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {selectedIdea && (
        <div className="fixed inset-0 z-[80] flex items-end lg:items-center justify-center">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setSelectedIdea(null)}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="relative w-full max-w-md rounded-t-[28px] lg:rounded-[28px] p-5 mx-0 lg:mx-4"
            style={{ background: "var(--surface-container)", border: "1px solid var(--border-color)", boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}
          >
            <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4 lg:hidden" />
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px]"
                style={{ background: "rgba(10,132,255,0.12)" }}>
                {selectedIdea.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-bold text-[var(--on-surface)] leading-tight">{selectedIdea.name}</p>
                <p className="text-[12px] text-[var(--on-surface-variant)] mt-1 capitalize">
                  {selectedIdea.type} en {dynamicDestination}
                </p>
                <p className="text-[11px] text-[#0A84FF] mt-2">
                  Podemos usar esta idea como punto de partida del viaje.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl p-3"
              style={{ background: "rgba(10,132,255,0.10)", border: "1px solid rgba(10,132,255,0.18)" }}>
              <p className="text-[12px] font-semibold text-[var(--on-surface)]">Por qué puede encajar contigo</p>
              <p className="mt-2 text-[12px] text-[var(--on-surface-variant)] leading-relaxed">
                {selectedIdeaReason}
              </p>
              {selectedIdeaInterestLabels.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedIdeaInterestLabels.map((label) => (
                    <span
                      key={label}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{ background: "rgba(255,255,255,0.18)", color: "var(--on-surface)" }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 rounded-2xl p-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)" }}>
              <p className="text-[12px] font-semibold text-[var(--on-surface)]">Preview del viaje que saldría</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)]">Tipo</p>
                  <p className="mt-1 text-[12px] font-medium text-[var(--on-surface)] leading-snug">{selectedIdeaTripPreview?.title}</p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)]">Ritmo</p>
                  <p className="mt-1 text-[12px] font-medium text-[var(--on-surface)] leading-snug">{selectedIdeaTripPreview?.pace}</p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--on-surface-variant)]">Foco</p>
                  <p className="mt-1 text-[12px] font-medium text-[var(--on-surface)] leading-snug">{selectedIdeaTripPreview?.focus}</p>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl p-3"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)" }}>
              <p className="text-[12px] font-semibold text-[var(--on-surface)]">Qué haremos si sigues</p>
              <ul className="mt-2 space-y-1 text-[12px] text-[var(--on-surface-variant)]">
                <li>• Pondremos <span className="text-[var(--on-surface)] font-medium">{dynamicDestination}</span> como destino</li>
                <li>• Añadiremos <span className="text-[var(--on-surface)] font-medium">{selectedIdea.name}</span> como imprescindible</li>
                {selectedIdeaInterestLabels.length > 0 && (
                  <li>• Tendrás una base más afinada en intereses como <span className="text-[var(--on-surface)] font-medium">{selectedIdeaInterestLabels.join(" y ")}</span></li>
                )}
              </ul>
            </div>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => startTripFromIdea(selectedIdea)}
                className="w-full px-4 py-3 rounded-2xl text-[14px] font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
              >
                {selectedIdeaTripPreview?.cta ?? "Crear viaje con esta idea"}
              </button>
              <button
                type="button"
                onClick={exploreDestinationFromIdea}
                className="w-full px-4 py-3 rounded-2xl text-[14px] font-semibold"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)", color: "var(--on-surface)" }}
              >
                Solo explorar {dynamicDestination}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIdea(null)}
                className="w-full px-4 py-3 rounded-2xl text-[13px] text-[var(--on-surface-variant)]"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="lg:hidden"><BottomNav /></div>
    </div>
    </div>
  )
}
