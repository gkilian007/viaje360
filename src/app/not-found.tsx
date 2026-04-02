import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-6 text-center">
      <div>
        <span className="text-[56px]">🗺️</span>
        <h1 className="text-[22px] font-bold text-white mt-4 mb-2">Página no encontrada</h1>
        <p className="text-[14px] text-[#888] mb-6 max-w-sm">
          Esta ruta no existe. ¿Quizá te has desviado del camino?
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-2xl font-semibold text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: "#0A84FF" }}
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
