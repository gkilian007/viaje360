"use client"

import { motion } from "framer-motion"

interface ProgressBarProps {
  progress: number // 0 to 1
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-[#0A84FF]"
        initial={false}
        animate={{ width: `${Math.round(progress * 100)}%` }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      />
    </div>
  )
}
