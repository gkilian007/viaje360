"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error("[GlobalError]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-6 text-center">
      <div>
        <span className="text-[56px]">😵</span>
        <h1 className="text-[22px] font-bold text-white mt-4 mb-2">Algo salió mal</h1>
        <p className="text-[14px] text-[#888] mb-6 max-w-sm">
          Ha ocurrido un error inesperado. Puedes intentar de nuevo.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-2xl font-semibold text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: "#0A84FF" }}
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  )
}
