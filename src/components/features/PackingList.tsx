"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type {
  PackingItem,
  PackingCategory,
} from "@/lib/services/packing.service"
import { CATEGORY_LABELS } from "@/lib/services/packing.service"

interface PackingListProps {
  tripId: string
}

export function PackingList({ tripId }: PackingListProps) {
  const [items, setItems] = useState<PackingItem[]>([])
  const [weatherSummary, setWeatherSummary] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<PackingCategory | null>(null)

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`/api/packing?tripId=${tripId}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.data?.items ?? [])
        setWeatherSummary(data.data?.weatherSummary)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [tripId])

  useEffect(() => { fetchList() }, [fetchList])

  const togglePacked = useCallback(async (itemId: string) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, packed: !i.packed } : i))
    // Persist toggle
    try {
      await fetch("/api/packing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, itemId, packed: !items.find(i => i.id === itemId)?.packed }),
      })
    } catch {
      // Revert on error
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, packed: !i.packed } : i))
    }
  }, [tripId, items])

  const grouped = useMemo(() => {
    const groups = new Map<PackingCategory, PackingItem[]>()
    for (const item of items) {
      const list = groups.get(item.category) ?? []
      list.push(item)
      groups.set(item.category, list)
    }
    return groups
  }, [items])

  const stats = useMemo(() => {
    const total = items.length
    const packed = items.filter(i => i.packed).length
    return { total, packed, pct: total > 0 ? Math.round((packed / total) * 100) : 0 }
  }, [items])

  if (loading) {
    return (
      <div className="px-5 py-3">
        <div className="h-20 rounded-2xl bg-[#1a1a2e] animate-pulse" />
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <div className="px-5 mb-4">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden p-4"
        style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-semibold text-white">🎒 Lista de equipaje</p>
            {weatherSummary && (
              <p className="text-[10px] text-[#888] mt-0.5">🌡️ {weatherSummary}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#aaa]">{stats.packed}/{stats.total}</span>
            <div className="w-12 h-1.5 rounded-full bg-[rgba(255,255,255,0.06)]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: stats.pct === 100 ? "#30D158" : "#0A84FF" }}
                initial={{ width: 0 }}
                animate={{ width: `${stats.pct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5">
          {Array.from(grouped.entries()).map(([cat, catItems]) => {
            const catPacked = catItems.filter(i => i.packed).length
            const allPacked = catPacked === catItems.length
            const isExpanded = expandedCategory === cat
            const meta = CATEGORY_LABELS[cat]

            return (
              <div key={cat}>
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] transition-all"
                  style={{
                    background: allPacked
                      ? "rgba(48,209,88,0.1)"
                      : isExpanded
                        ? "rgba(10,132,255,0.12)"
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      allPacked
                        ? "rgba(48,209,88,0.2)"
                        : isExpanded
                          ? "rgba(10,132,255,0.2)"
                          : "rgba(255,255,255,0.06)"
                    }`,
                    color: allPacked ? "#30D158" : isExpanded ? "#0A84FF" : "#999",
                  }}
                >
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                  <span className="text-[9px] opacity-60">
                    {catPacked}/{catItems.length}
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Expanded category items */}
      <AnimatePresence>
        {expandedCategory && grouped.has(expandedCategory) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-2xl overflow-hidden"
            style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="p-3 space-y-0.5">
              {grouped.get(expandedCategory)!.map(item => (
                <motion.button
                  key={item.id}
                  layout
                  onClick={() => togglePacked(item.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-left"
                  style={{
                    background: item.packed ? "rgba(48,209,88,0.06)" : "transparent",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Checkbox */}
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
                    style={{
                      background: item.packed ? "#30D158" : "transparent",
                      border: item.packed ? "none" : "1.5px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    {item.packed && (
                      <span className="material-symbols-outlined text-[14px] text-white">check</span>
                    )}
                  </div>

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[12px] transition-all"
                      style={{
                        color: item.packed ? "#666" : "#fff",
                        textDecoration: item.packed ? "line-through" : "none",
                      }}
                    >
                      {item.emoji} {item.name}
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-[#888] ml-1">×{item.quantity}</span>
                      )}
                    </p>
                    {item.reason && !item.packed && (
                      <p className="text-[10px] text-[#666] mt-0.5">{item.reason}</p>
                    )}
                  </div>

                  {/* Priority badge */}
                  {item.priority === 1 && !item.packed && (
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                      style={{ background: "rgba(255,69,58,0.1)", color: "#FF453A" }}
                    >
                      MUST
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
