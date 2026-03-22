"use client"

interface GlassSliderProps {
  value: number // 0-100
  onChange: (value: number) => void
  leftLabel: string
  rightLabel: string
  leftEmoji?: string
  rightEmoji?: string
  gradient?: string
}

export function GlassSlider({
  value,
  onChange,
  leftLabel,
  rightLabel,
  leftEmoji,
  rightEmoji,
  gradient = "from-[#0A84FF] to-[#ffdb3c]",
}: GlassSliderProps) {
  return (
    <div className="w-full">
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
