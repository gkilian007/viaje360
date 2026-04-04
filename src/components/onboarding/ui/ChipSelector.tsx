"use client"

import { motion } from "framer-motion"

interface Chip {
  id: string
  label: string
  emoji?: string
}

interface ChipSelectorProps {
  chips: Chip[]
  selected: string[]
  onToggle: (id: string) => void
  singleSelect?: boolean
}

export function ChipSelector({ chips, selected, onToggle, singleSelect }: ChipSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const isSelected = selected.includes(chip.id)
        return (
          <motion.button
            key={chip.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(chip.id)}
            className={`
              px-5 py-3 rounded-full border text-base font-medium transition-all duration-200 flex items-center gap-2
              ${isSelected
                ? "border-[#0A84FF] bg-[#0A84FF]/15 text-[#0A84FF] glow-blue"
                : "border-white/8 bg-[rgba(31,31,33,0.9)] text-[#c0c6d6] hover:border-white/20"
              }
            `}
          >
            {chip.emoji && <span>{chip.emoji}</span>}
            {chip.label}
          </motion.button>
        )
      })}
    </div>
  )
}
