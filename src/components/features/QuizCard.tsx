"use client"

import { useState } from "react"
import { Zap, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/useAppStore"

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
}

interface QuizCardProps {
  quizData: QuizQuestion
}

export function QuizCard({ quizData }: QuizCardProps) {
  const addXp = useAppStore((s) => s.addXp)
  const [selected, setSelected] = useState<number | null>(null)

  const answered = selected !== null
  const isCorrect = selected === quizData.correctIndex

  function handleSelect(index: number) {
    if (answered) return
    setSelected(index)
    if (index === quizData.correctIndex) {
      addXp(50)
    }
  }

  return (
    <Card className="border-slate-700/30 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Quiz del Día</p>
          <p className="text-white font-semibold text-sm">Gana +50 XP</p>
        </div>
        <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
          <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
          <span className="text-white text-xs font-bold">50 XP</span>
        </div>
      </div>

      <CardContent className="p-4">
        <p className="text-white font-medium text-sm mb-4 leading-snug">{quizData.question}</p>

        <div className="space-y-2">
          {quizData.options.map((option, i) => {
            let btnClass = "w-full justify-start text-left text-sm h-auto py-2.5 px-3 "

            if (!answered) {
              btnClass += "bg-slate-700/50 hover:bg-slate-700 text-white border border-slate-600/50 hover:border-slate-500"
            } else if (i === quizData.correctIndex) {
              btnClass += "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
            } else if (i === selected) {
              btnClass += "bg-red-500/20 text-red-400 border border-red-500/50"
            } else {
              btnClass += "bg-slate-800/50 text-slate-500 border border-slate-700/30"
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={answered}
                className={`rounded-lg flex items-center gap-2 transition-colors ${btnClass}`}
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-600/50 flex items-center justify-center text-[11px] font-bold">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{option}</span>
                {answered && i === quizData.correctIndex && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                )}
                {answered && i === selected && i !== quizData.correctIndex && (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>

        {answered && (
          <p className={`text-xs mt-3 text-center font-medium ${isCorrect ? "text-emerald-400" : "text-slate-400"}`}>
            {isCorrect ? "¡Correcto! +50 XP ganados 🎉" : `Respuesta correcta: ${quizData.options[quizData.correctIndex]}`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
