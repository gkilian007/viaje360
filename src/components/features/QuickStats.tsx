"use client"

import { motion } from "framer-motion"
import { Mountain, Zap, Globe } from "lucide-react"
import { Card } from "@/components/ui/card"

interface StatItem {
  icon: React.ReactNode
  value: number | string
  label: string
  color: string
  bgColor: string
}

interface QuickStatsProps {
  monumentsCollected: number
  level: number
  totalTrips: number
}

export default function QuickStats({ monumentsCollected, level, totalTrips }: QuickStatsProps) {
  const stats: StatItem[] = [
    {
      icon: <Mountain className="w-5 h-5" />,
      value: monumentsCollected,
      label: "Monumentos",
      color: "text-purple-400",
      bgColor: "bg-purple-900/30 border-purple-500/20",
    },
    {
      icon: <Zap className="w-5 h-5" />,
      value: level,
      label: "Nivel actual",
      color: "text-blue-400",
      bgColor: "bg-blue-900/30 border-blue-500/20",
    },
    {
      icon: <Globe className="w-5 h-5" />,
      value: totalTrips,
      label: "Viajes",
      color: "text-emerald-400",
      bgColor: "bg-emerald-900/30 border-emerald-500/20",
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
        >
          <Card className={`text-center p-3 ${stat.bgColor}`}>
            <div className={`${stat.color} mx-auto mb-1 flex justify-center`}>
              {stat.icon}
            </div>
            <p className="text-white font-bold text-xl leading-none mb-0.5">{stat.value}</p>
            <p className="text-slate-400 text-[10px] leading-tight">{stat.label}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
