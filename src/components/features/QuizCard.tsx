"use client"

import { useAppStore } from "@/store/useAppStore"

export function QuizCard() {
  const {
    currentQuiz,
    isQuizLoading,
    quizAnswered,
    quizCorrect,
    answerQuiz,
    clearQuiz,
    setCurrentQuiz,
    setQuizLoading,
    currentTrip,
  } = useAppStore()

  async function fetchQuiz() {
    setQuizLoading(true)
    try {
      const dest = currentTrip?.destination ?? "Barcelona"
      const res = await fetch(`/api/quiz?destination=${encodeURIComponent(dest)}`)
      if (!res.ok) throw new Error("Failed")
      const data = (await res.json()) as { ok: true; data: { question: typeof currentQuiz } }
      setCurrentQuiz(data.data.question)
    } catch {
      setCurrentQuiz({
        id: "fallback-1",
        question: "¿En qué año fue declarada la Sagrada Família Patrimonio de la Humanidad por la UNESCO?",
        options: ["1982", "1984", "2005", "2010"],
        correctIndex: 3,
        funFact: "La UNESCO declaró la Sagrada Família Patrimonio de la Humanidad en 2010, junto con otras obras de Gaudí.",
        xpReward: 50,
      })
    } finally {
      setQuizLoading(false)
    }
  }

  if (!currentQuiz && !isQuizLoading) {
    return (
      <button
        className="w-full py-4 px-5 rounded-2xl flex items-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
        style={{
          background: "rgba(255, 219, 60, 0.08)",
          border: "1px solid rgba(255, 219, 60, 0.2)",
        }}
        onClick={fetchQuiz}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255, 219, 60, 0.15)" }}
        >
          <span
            className="material-symbols-outlined text-[22px] text-[#ffdb3c]"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
          >
            quiz
          </span>
        </div>
        <div className="text-left">
          <p className="text-[13px] font-semibold text-white">Trivia de Barcelona</p>
          <p className="text-[11px] text-[#c0c6d6]">Gana XP respondiendo preguntas</p>
        </div>
        <span className="material-symbols-outlined text-[18px] text-[#c0c6d6] ml-auto">
          chevron_right
        </span>
      </button>
    )
  }

  if (isQuizLoading) {
    return (
      <div
        className="w-full py-8 rounded-2xl flex items-center justify-center gap-2"
        style={{ background: "rgba(42, 42, 44, 0.8)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="w-3 h-3 rounded-full bg-[#0A84FF] animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-3 h-3 rounded-full bg-[#0A84FF] animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-3 h-3 rounded-full bg-[#0A84FF] animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: "rgba(42, 42, 44, 0.8)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="material-symbols-outlined text-[20px] text-[#ffdb3c]"
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
        >
          quiz
        </span>
        <span className="text-[11px] uppercase tracking-widest text-[#c0c6d6] font-medium">Trivia</span>
        <span className="ml-auto text-[11px] font-bold text-[#ffdb3c] flex items-center gap-0.5">
          <span className="material-symbols-outlined text-[13px]"
            style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
            stars
          </span>
          +{currentQuiz!.xpReward} XP
        </span>
      </div>

      <p className="text-[14px] font-semibold text-white leading-snug">{currentQuiz!.question}</p>

      <div className="flex flex-col gap-2">
        {currentQuiz!.options.map((option, i) => {
          let style: React.CSSProperties = {
            background: "rgba(19, 19, 21, 0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
          }
          let textClass = "text-[#e4e2e4]"

          if (quizAnswered) {
            if (i === currentQuiz!.correctIndex) {
              style = { background: "rgba(48, 209, 88, 0.15)", border: "1px solid rgba(48, 209, 88, 0.3)" }
              textClass = "text-[#30D158]"
            } else if (i !== currentQuiz!.correctIndex) {
              style = { background: "rgba(19, 19, 21, 0.4)", border: "1px solid rgba(255,255,255,0.04)" }
              textClass = "text-[#c0c6d6]/50"
            }
          }

          return (
            <button
              key={i}
              className={`w-full px-4 py-3 rounded-xl text-left text-[13px] font-medium transition-all hover:bg-white/5 ${textClass}`}
              style={style}
              onClick={() => !quizAnswered && answerQuiz(i)}
              disabled={quizAnswered}
            >
              <span className="text-[#c0c6d6] mr-2">{String.fromCharCode(65 + i)}.</span>
              {option}
            </button>
          )
        })}
      </div>

      {quizAnswered && (
        <div
          className="p-3 rounded-xl"
          style={{
            background: quizCorrect ? "rgba(48, 209, 88, 0.08)" : "rgba(255, 69, 58, 0.08)",
            border: `1px solid ${quizCorrect ? "rgba(48, 209, 88, 0.2)" : "rgba(255, 69, 58, 0.2)"}`,
          }}
        >
          <p className={`text-[12px] font-semibold mb-1 ${quizCorrect ? "text-[#30D158]" : "text-[#FF453A]"}`}>
            {quizCorrect ? "¡Correcto! 🎉" : "¡Casi! 😅"}
          </p>
          <p className="text-[12px] text-[#c0c6d6]">{currentQuiz!.funFact}</p>
        </div>
      )}

      {quizAnswered && (
        <div className="flex gap-2">
          <button
            className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-[#c0c6d6] transition-all hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={clearQuiz}
          >
            Cerrar
          </button>
          <button
            className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#0A84FF" }}
            onClick={fetchQuiz}
          >
            Otra pregunta
          </button>
        </div>
      )}
    </div>
  )
}
