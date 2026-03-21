"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Euro } from "lucide-react"

const budgetData = [
  { name: "Vuelos",      amount: 320, color: "#60a5fa" },
  { name: "Hotel",       amount: 280, color: "#a78bfa" },
  { name: "Actividades", amount: 150, color: "#34d399" },
  { name: "Comida",      amount:  97, color: "#fb923c" },
]

const total = budgetData.reduce((sum, item) => sum + item.amount, 0)

export function BudgetChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Euro className="w-4 h-4 text-emerald-400" />
          Desglose de Presupuesto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  padding: "6px 12px",
                }}
                labelStyle={{ color: "#f1f5f9", fontSize: 12 }}
                formatter={(value) => [`€${value}`, "Gasto"]}
                cursor={{ fill: "rgba(255,255,255,0.05)" }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {budgetData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3">
          {budgetData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-slate-400 flex-1">{item.name}</span>
              <span className="text-xs text-white font-semibold">€{item.amount}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
          <span className="text-xs text-slate-400">Total gastado</span>
          <span className="text-base text-white font-bold">€{total}</span>
        </div>
      </CardContent>
    </Card>
  )
}
