import { notFound } from "next/navigation"
import { createRouteSupabaseClient } from "@/lib/auth/server"
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { fetchSavingsReport, type SavingsQueryClient } from "@/lib/services/savings-metrics"

export const dynamic = "force-dynamic"

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)" }}>
      <p className="text-[11px] uppercase tracking-widest text-[#c0c6d6] font-medium mb-2">
        {label}
      </p>
      <p className="text-3xl font-semibold text-white">{value}</p>
      {detail && <p className="text-sm text-[#c0c6d6] mt-1">{detail}</p>}
    </div>
  )
}

export default async function AdminMetricsPage() {
  const adminEmails = getAdminEmails()
  if (adminEmails.length === 0) notFound()

  const supabase = await createRouteSupabaseClient()
  if (!supabase) notFound()

  const { data } = await supabase.auth.getUser()
  const email = data.user?.email?.toLowerCase()
  if (!email || !adminEmails.includes(email)) notFound()

  if (!isSupabaseConfigured()) notFound()

  const report = await fetchSavingsReport(
    createServiceClient() as unknown as SavingsQueryClient
  )
  const { liveGenerations: live, historicVersions: historic, placesCache, estimatedSavings: savings } = report

  return (
    <div className="min-h-screen px-6 py-12" style={{ background: "#131315" }}>
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-[#0A84FF] font-medium mb-2">
          Panel interno
        </p>
        <h1 className="text-2xl font-semibold text-white mb-8">Ahorro de APIs</h1>

        <h2 className="text-sm font-medium text-[#c0c6d6] mb-3">
          Generaciones en vivo (desde el despliegue de la instrumentación)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <StatCard label="Total" value={String(live.total)} />
          <StatCard
            label="Reutilizadas"
            value={`${live.reuseRatePct}%`}
            detail={`${live.reused} de ${live.total}`}
          />
          <StatCard
            label="Invitados"
            value={String(live.anonymous)}
            detail={`${live.authenticated} con cuenta`}
          />
        </div>

        <h2 className="text-sm font-medium text-[#c0c6d6] mb-3">
          Histórico (versiones iniciales, solo usuarios con cuenta)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <StatCard label="Viajes" value={String(historic.total)} />
          <StatCard
            label="Reutilización"
            value={`${historic.reuseRatePct}%`}
            detail={`${historic.reused} reusados / ${historic.generated} con IA`}
          />
        </div>

        <h2 className="text-sm font-medium text-[#c0c6d6] mb-3">Caché de lugares</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <StatCard
            label="Entradas"
            value={String(placesCache.entries)}
            detail={`${placesCache.activeEntries} vigentes`}
          />
          <StatCard label="Hits servidos" value={String(placesCache.totalHits)} />
        </div>

        <h2 className="text-sm font-medium text-[#c0c6d6] mb-3">Ahorro estimado</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <StatCard
            label="Total"
            value={`${savings.totalEur.toFixed(2)} €`}
            detail="sin doble conteo"
          />
          <StatCard label="Por reutilización" value={`${savings.fromHistoricReuseEur.toFixed(2)} €`} />
          <StatCard label="Por caché" value={`${savings.fromPlacesCacheEur.toFixed(2)} €`} />
        </div>
        <p className="text-xs text-[#7d8494]">
          Supuestos: {savings.generationCostEur.toFixed(3)} €/generación evitada,{" "}
          {savings.placesQueryCostEur.toFixed(3)} €/consulta de lugares evitada. {savings.note}.
        </p>
      </div>
    </div>
  )
}
