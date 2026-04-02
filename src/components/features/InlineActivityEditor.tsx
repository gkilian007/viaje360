"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type { TimelineActivity } from "@/lib/types"

interface InlineActivityEditorProps {
  activity: TimelineActivity
  onSave: (patch: { name: string; time: string; duration: number }) => Promise<void>
  onCancel: () => void
}

export function InlineActivityEditor({ activity, onSave, onCancel }: InlineActivityEditorProps) {
  const [name, setName] = useState(activity.name)
  const [time, setTime] = useState(activity.time ?? "")
  const [duration, setDuration] = useState(String(activity.duration ?? 60))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const mins = parseInt(duration, 10)
    if (!name.trim()) { setError("El nombre es obligatorio"); return }
    if (isNaN(mins) || mins < 0) { setError("Duración inválida"); return }
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), time, duration: mins })
    } catch {
      setError("Error al guardar. Inténtalo de nuevo.")
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex-1 p-3 rounded-xl mb-3 overflow-hidden"
      style={{
        background: "rgba(10,132,255,0.06)",
        border: "1px solid rgba(10,132,255,0.25)",
      }}
    >
      <p className="text-[11px] uppercase tracking-widest text-[#0A84FF] font-medium mb-3">
        Editar actividad
      </p>
      <div className="flex flex-col gap-2">
        {/* Name */}
        <div>
          <label className="text-[10px] text-[#8e8e93] font-medium mb-1 block">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-[13px] text-white bg-[#2a2a2c] border border-white/10 focus:border-[#0A84FF]/50 focus:outline-none transition-colors"
            placeholder="Nombre de la actividad"
            autoFocus
          />
        </div>
        {/* Time + Duration */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-[#8e8e93] font-medium mb-1 block">Hora</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-[13px] text-white bg-[#2a2a2c] border border-white/10 focus:border-[#0A84FF]/50 focus:outline-none transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-[#8e8e93] font-medium mb-1 block">Duración (min)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min={0}
              step={15}
              className="w-full px-3 py-2 rounded-xl text-[13px] text-white bg-[#2a2a2c] border border-white/10 focus:border-[#0A84FF]/50 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-400 mt-2">{error}</p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-xl text-[12px] font-semibold text-white transition-all active:scale-95 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #0A84FF, #5856D6)" }}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 rounded-xl text-[12px] font-medium text-[#8e8e93] hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          Cancelar
        </button>
      </div>
    </motion.div>
  )
}
