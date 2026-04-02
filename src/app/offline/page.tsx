export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#131315] flex flex-col items-center justify-center px-6 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span className="material-symbols-outlined text-[40px] text-[#c0c6d6]/50">wifi_off</span>
      </div>
      <h1 className="text-[22px] font-bold text-white mb-3">Sin conexión</h1>
      <p className="text-[#c0c6d6] max-w-xs text-[15px] leading-relaxed">
        Tus datos se sincronizarán cuando vuelvas a conectarte.
      </p>
      <p className="mt-2 text-[13px] text-[#666]">
        El itinerario guardado sigue disponible en la app.
      </p>
    </div>
  )
}
