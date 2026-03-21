"use client"

import { Plane, Hotel, Ticket, UtensilsCrossed, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface BudgetCategory {
  label: string
  amount: number
  color: string
  icon: React.ReactNode
}

interface BudgetWidgetProps {
  spent?: number
  total?: number
}

const categories: BudgetCategory[] = [
  {
    label: "Vuelos",
    amount: 320,
    color: "bg-blue-500",
    icon: <Plane className="w-3.5 h-3.5" />,
  },
  {
    label: "Hotel",
    amount: 280,
    color: "bg-purple-500",
    icon: <Hotel className="w-3.5 h-3.5" />,
  },
  {
    label: "Actividades",
    amount: 150,
    color: "bg-amber-500",
    icon: <Ticket className="w-3.5 h-3.5" />,
  },
  {
    label: "Comida",
    amount: 97,
    color: "bg-emerald-500",
    icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
  },
]

function getProgressColor(percent: number): string {
  if (percent >= 90) return "bg-red-500"
  if (percent >= 70) return "bg-amber-500"
  return "bg-emerald-500"
}

export default function BudgetWidget({ spent = 847, total = 1500 }: BudgetWidgetProps) {
  const percent = Math.round((spent / total) * 100)
  const remaining = total - spent
  const progressColor = getProgressColor(percent)

  return (
    <Card className="border-slate-700/50 bg-slate-800/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Presupuesto</CardTitle>
          <button className="flex items-center gap-1 text-blue-400 text-xs hover:text-blue-300 transition-colors">
            Ver detalles <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Gastado</span>
            <span className="text-white font-semibold">
              €{spent}{" "}
              <span className="text-slate-400 font-normal">de €{total}</span>
            </span>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full transition-all duration-700 rounded-full ${progressColor}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className={percent >= 90 ? "text-red-400" : percent >= 70 ? "text-amber-400" : "text-emerald-400"}>
              {percent}% utilizado
            </span>
            <span className="text-slate-400">€{remaining} restante</span>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          {categories.map((cat) => {
            const catPercent = Math.round((cat.amount / total) * 100)
            return (
              <div key={cat.label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white ${cat.color}/20`}>
                  <span className={cat.color.replace("bg-", "text-")}>{cat.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{cat.label}</span>
                    <span className="text-white font-medium">€{cat.amount}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${cat.color}`}
                      style={{ width: `${catPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
