export default function PlanLoading() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#888] text-[13px]">Cargando itinerario...</p>
      </div>
    </div>
  )
}
