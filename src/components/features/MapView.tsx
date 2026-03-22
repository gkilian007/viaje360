"use client"

export function MapView() {
  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 40% 50%, rgba(10, 132, 255, 0.12) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 30%, rgba(88, 86, 214, 0.08) 0%, transparent 50%),
          linear-gradient(160deg, #0d1117 0%, #0f1520 30%, #131315 60%, #0a0f1a 100%)
        `,
      }}
    >
      {/* Subtle grid lines imitating a map */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#6b7280" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Faux streets */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <line x1="15%" y1="0" x2="15%" y2="100%" stroke="#9ca3af" strokeWidth="2" />
        <line x1="35%" y1="0" x2="35%" y2="100%" stroke="#9ca3af" strokeWidth="1" />
        <line x1="55%" y1="0" x2="55%" y2="100%" stroke="#9ca3af" strokeWidth="2" />
        <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#9ca3af" strokeWidth="1" />
        <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#9ca3af" strokeWidth="1.5" />
        <line x1="0" y1="45%" x2="100%" y2="45%" stroke="#9ca3af" strokeWidth="2" />
        <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#9ca3af" strokeWidth="1" />
        <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#9ca3af" strokeWidth="1.5" />
        {/* Diagonal streets */}
        <line x1="0" y1="30%" x2="40%" y2="70%" stroke="#9ca3af" strokeWidth="1" />
        <line x1="60%" y1="0" x2="100%" y2="55%" stroke="#9ca3af" strokeWidth="1" />
      </svg>

      {/* Current location pulse */}
      <div className="absolute" style={{ left: "48%", top: "52%", transform: "translate(-50%,-50%)" }}>
        <div className="relative">
          <div className="w-5 h-5 rounded-full bg-[#0A84FF] shadow-[0_0_20px_rgba(10,132,255,0.8)]" />
          <div className="absolute inset-0 rounded-full bg-[#0A84FF]/40 animate-ping" />
        </div>
      </div>

      {/* Sagrada Família marker */}
      <div className="absolute" style={{ left: "58%", top: "35%", transform: "translate(-50%,-50%)" }}>
        <div className="flex flex-col items-center gap-1">
          <div
            className="px-2 py-1 rounded-full text-[11px] font-semibold text-white whitespace-nowrap"
            style={{ background: "rgba(19,19,21,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Sagrada Família
          </div>
          <div className="w-3 h-3 rounded-full bg-[#ffdb3c] shadow-[0_0_10px_rgba(255,219,60,0.6)]" />
        </div>
      </div>

      {/* Park Güell marker */}
      <div className="absolute" style={{ left: "30%", top: "25%", transform: "translate(-50%,-50%)" }}>
        <div className="w-3 h-3 rounded-full bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.5)]" />
      </div>

      {/* Barceloneta marker */}
      <div className="absolute" style={{ left: "72%", top: "68%", transform: "translate(-50%,-50%)" }}>
        <div className="w-3 h-3 rounded-full bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.5)]" />
      </div>

      {/* Zoom controls */}
      <div
        className="absolute right-4 bottom-4 flex flex-col gap-1 rounded-xl overflow-hidden"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <button
          className="w-9 h-9 flex items-center justify-center text-[#c0c6d6] hover:text-white hover:bg-white/10 transition-all"
          style={{ background: "rgba(19,19,21,0.9)" }}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
        </button>
        <div className="h-px bg-white/05" />
        <button
          className="w-9 h-9 flex items-center justify-center text-[#c0c6d6] hover:text-white hover:bg-white/10 transition-all"
          style={{ background: "rgba(19,19,21,0.9)" }}
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
        </button>
      </div>

      {/* Legend */}
      <div
        className="absolute left-4 bottom-4 px-3 py-2 rounded-xl flex items-center gap-3"
        style={{
          background: "rgba(19,19,21,0.85)",
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0A84FF]" />
          <span className="text-[11px] text-[#c0c6d6]">Tú</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffdb3c]" />
          <span className="text-[11px] text-[#c0c6d6]">Siguiente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
          <span className="text-[11px] text-[#c0c6d6]">Visitado</span>
        </div>
      </div>
    </div>
  )
}
