"use client"

import { motion } from "framer-motion"

interface SelectionCardProps {
  emoji: string
  label: string
  sublabel?: string
  selected: boolean
  onSelect: () => void
}

export function SelectionCard({ emoji, label, sublabel, selected, onSelect }: SelectionCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`
        w-full p-5 rounded-3xl border text-left transition-all duration-200
        ${selected
          ? "border-[#0A84FF] bg-[#0A84FF]/10 glow-blue ring-1 ring-[#0A84FF]/30"
          : "border-white/6 bg-[rgba(31,31,33,0.85)] hover:border-white/15"
        }
      `}
    >
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="font-semibold text-[#e4e2e4]">{label}</div>
      {sublabel && (
        <div className="mt-1 text-sm text-[#c0c6d6]">{sublabel}</div>
      )}
    </motion.button>
  )
}
