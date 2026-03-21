import { Trophy, Lock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface TrophyData {
  id: string
  name: string
  description: string
  emoji: string
}

interface Props {
  trophy: TrophyData
  isUnlocked: boolean
  progress?: { current: number; total: number }
}

export function TrophyCard({ trophy, isUnlocked, progress }: Props) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 flex items-center gap-3 transition-all",
        isUnlocked
          ? "bg-amber-900/20 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.12)]"
          : "bg-slate-900/40 border-slate-700/30"
      )}
    >
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
          isUnlocked ? "bg-amber-500/20" : "bg-slate-800/60"
        )}
      >
        {isUnlocked ? (
          <span className="text-2xl">{trophy.emoji}</span>
        ) : (
          <Lock className="w-5 h-5 text-slate-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={cn("font-semibold text-sm", isUnlocked ? "text-white" : "text-slate-500")}>
            {trophy.name}
          </p>
          {isUnlocked && <Trophy className="w-3 h-3 text-amber-400" />}
        </div>
        <p className={cn("text-xs mt-0.5", isUnlocked ? "text-slate-400" : "text-slate-600")}>
          {trophy.description}
        </p>
        {isUnlocked ? (
          <p className="text-amber-500/70 text-[10px] mt-0.5">Desbloqueado ✓</p>
        ) : progress ? (
          <div className="mt-1.5 space-y-1">
            <Progress value={(progress.current / progress.total) * 100} className="h-1.5" />
            <p className="text-slate-600 text-[10px]">
              En progreso ({progress.current}/{progress.total})
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
