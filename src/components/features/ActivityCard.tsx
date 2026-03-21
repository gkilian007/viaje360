"use client"

import type { LucideIcon } from "lucide-react"
import { Star, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface ActivityCardProps {
  name: string
  category: string
  price: string
  rating: number
  icon: LucideIcon
  duration?: string
}

export function ActivityCard({
  name,
  category,
  price,
  rating,
  icon: Icon,
  duration,
}: ActivityCardProps) {
  return (
    <div className="flex-shrink-0 w-44 bg-slate-800/80 border border-slate-700/30 rounded-2xl p-3 cursor-pointer hover:border-slate-600/50 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center mb-2">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <p className="text-white font-medium text-sm leading-tight mb-0.5 line-clamp-2">{name}</p>
      <p className="text-slate-500 text-xs mb-2">{category}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-amber-400 text-xs font-medium">{rating}</span>
        </div>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
          {price}
        </Badge>
      </div>
      {duration && (
        <div className="flex items-center gap-1 mt-1.5">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="text-slate-500 text-xs">{duration}</span>
        </div>
      )}
    </div>
  )
}
