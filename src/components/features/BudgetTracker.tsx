"use client"

import { useCallback, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { BudgetSummary, ExpenseCategory, TripExpense } from "@/lib/services/budget.service"

interface BudgetTrackerProps {
  tripId: string
}

const CATEGORY_EMOJI: Record<ExpenseCategory, string> = {
  food: "🍽️",
  transport: "🚕",
  tickets: "🎟️",
  shopping: "🛍️",
  accommodation: "🏨",
  other: "📦",
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: "Comida",
  transport: "Transporte",
  tickets: "Entradas",
  shopping: "Compras",
  accommodation: "Alojamiento",
  other: "Otros",
}

const STATUS_COLORS = {
  under: { ring: "#30D158", bg: "rgba(48,209,88,0.1)", label: "Bien de presupuesto 👍" },
  on_track: { ring: "#0A84FF", bg: "rgba(10,132,255,0.1)", label: "En línea 📊" },
  over: { ring: "#FF453A", bg: "rgba(255,69,58,0.1)", label: "Por encima ⚠️" },
}

export function BudgetTracker({ tripId }: BudgetTrackerProps) {
  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [expenses, setExpenses] = useState<TripExpense[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/expenses?tripId=${tripId}`)
      if (res.ok) {
        const data = await res.json()
        setSummary(data.data?.summary ?? null)
        setExpenses(data.data?.expenses ?? [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => { fetchData() }, [fetchData])

  const addExpense = async (formData: {
    amount: number
    category: ExpenseCategory
    description: string
  }) => {
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, ...formData }),
      })
      if (res.ok) {
        const data = await res.json()
        setSummary(data.data?.summary ?? summary)
        setShowAddForm(false)
        fetchData()
      }
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="px-5 py-3">
        <div className="h-24 rounded-2xl bg-[#1a1a2e] animate-pulse" />
      </div>
    )
  }

  if (!summary || summary.totalBudget === 0) {
    return null // No budget set
  }

  const pct = Math.min(100, Math.round((summary.totalSpent / summary.totalBudget) * 100))
  const colors = STATUS_COLORS[summary.status]

  return (
    <div className="px-5 mb-4">
      {/* Budget ring card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden p-4"
        style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-4">
          {/* Circular progress */}
          <div className="relative w-16 h-16 shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.5" fill="none"
                stroke={colors.ring}
                strokeWidth="3"
                strokeDasharray={`${pct} 100`}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[12px] font-bold text-white">{pct}%</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[13px] font-semibold text-white">💰 Presupuesto</p>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: colors.bg, color: colors.ring }}
              >
                {colors.label}
              </span>
            </div>
            <p className="text-[11px] text-[#aaa]">
              €{summary.totalSpent} de €{summary.totalBudget} · Quedan €{summary.remaining}
            </p>
            <p className="text-[10px] text-[#666] mt-0.5">{summary.tip}</p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {(Object.entries(summary.byCategory) as [ExpenseCategory, number][])
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([cat, amount]) => (
              <div
                key={cat}
                className="shrink-0 px-2.5 py-1.5 rounded-xl text-[10px]"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]} €{Math.round(amount)}
              </div>
            ))}
        </div>

        {/* Add expense button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="mt-3 w-full py-2 rounded-xl text-[12px] font-semibold text-[#0A84FF] transition-all"
          style={{ background: "rgba(10,132,255,0.08)", border: "1px solid rgba(10,132,255,0.15)" }}
        >
          {showAddForm ? "Cancelar" : "+ Añadir gasto"}
        </motion.button>
      </motion.div>

      {/* Add expense form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AddExpenseForm onSubmit={addExpense} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent expenses */}
      {expenses.length > 0 && (
        <div className="mt-2 space-y-1">
          {expenses.slice(0, 5).map(exp => (
            <div
              key={exp.id}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <span className="text-[14px]">{CATEGORY_EMOJI[exp.category]}</span>
              <span className="text-[11px] text-[#aaa] flex-1 truncate">
                {exp.description || exp.activityName || CATEGORY_LABELS[exp.category]}
              </span>
              <span className="text-[11px] font-semibold text-white">€{exp.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddExpenseForm({ onSubmit }: {
  onSubmit: (data: { amount: number; category: ExpenseCategory; description: string }) => void
}) {
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<ExpenseCategory>("food")
  const [description, setDescription] = useState("")

  return (
    <div
      className="mt-2 p-4 rounded-2xl space-y-3"
      style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div>
        <label className="text-[10px] text-[#666] uppercase tracking-wider">Importe (€)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0.00"
          className="mt-1 w-full px-3 py-2 rounded-xl bg-[#0d0d1a] text-white text-[14px] border border-[rgba(255,255,255,0.08)] focus:border-[#0A84FF] outline-none"
        />
      </div>

      <div>
        <label className="text-[10px] text-[#666] uppercase tracking-wider">Categoría</label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {(Object.keys(CATEGORY_EMOJI) as ExpenseCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-2.5 py-1.5 rounded-xl text-[11px] transition-all"
              style={{
                background: cat === category ? "rgba(10,132,255,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${cat === category ? "rgba(10,132,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                color: cat === category ? "#0A84FF" : "#999",
              }}
            >
              {CATEGORY_EMOJI[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[10px] text-[#666] uppercase tracking-wider">Descripción (opcional)</label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Lunch en Trastevere..."
          className="mt-1 w-full px-3 py-2 rounded-xl bg-[#0d0d1a] text-white text-[13px] border border-[rgba(255,255,255,0.08)] focus:border-[#0A84FF] outline-none"
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          const num = parseFloat(amount)
          if (num > 0) onSubmit({ amount: num, category, description })
        }}
        disabled={!amount || parseFloat(amount) <= 0}
        className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-all disabled:opacity-40"
        style={{ background: "rgba(10,132,255,0.85)" }}
      >
        Guardar gasto
      </motion.button>
    </div>
  )
}
