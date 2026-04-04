"use client"

interface GlassSliderProps {
  value: number // 0-100
  onChange: (value: number) => void
  leftLabel: string
  rightLabel: string
  leftEmoji?: string
  rightEmoji?: string
  gradient?: string
  /** If provided, shows a live value badge above the thumb */
  liveValueFn?: (value: number) => string
}

export function GlassSlider({
  value,
  onChange,
  leftLabel,
  rightLabel,
  leftEmoji,
  rightEmoji,
  gradient = "from-[#0A84FF] to-[#ffdb3c]",
  liveValueFn,
}: GlassSliderProps) {
  const liveLabel = liveValueFn ? liveValueFn(value) : null

  return (
    <div className="w-full">
      {/* Live value badge */}
      {liveLabel && (
        <div className="relative h-7 mb-1">
          <div
            className="absolute -translate-x-1/2 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-lg transition-all duration-150"
            style={{
              left: `clamp(20px, ${value}%, calc(100% - 20px))`,
              background: "linear-gradient(135deg, #0A84FF, #5856D6)",
              boxShadow: "0 2px 8px rgba(10,132,255,0.4)",
            }}
          >
            {liveLabel}
          </div>
        </div>
      )}
      <div className="relative h-3 rounded-full bg-white/10 mb-4 overflow-visible">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${gradient}`}
          style={{ width: `${value}%` }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 10 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white shadow-lg border-2 border-[#0A84FF]"
          style={{ left: `calc(${value}% - 10px)` }}
        />
      </div>
      <div className="flex justify-between text-sm text-[#c0c6d6]">
        <span>{leftEmoji} {leftLabel}</span>
        <span>{rightLabel} {rightEmoji}</span>
      </div>
    </div>
  )
}
