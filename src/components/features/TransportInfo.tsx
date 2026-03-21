import { Train, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const metroLines = [
  {
    line: "L1",
    color: "#3b82f6",
    name: "Línea 1 – Azul",
    stops: ["Sol", "Gran Vía", "Tribunal"],
    note: "Gran Vía, centro",
  },
  {
    line: "L2",
    color: "#ef4444",
    name: "Línea 2 – Roja",
    stops: ["Ópera", "Banco de España"],
    note: "Palacio Real, Retiro",
  },
  {
    line: "L3",
    color: "#eab308",
    name: "Línea 3 – Amarilla",
    stops: ["Sol", "Lavapiés", "Embajadores"],
    note: "La Latina, Malasaña",
  },
]

export function TransportInfo() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Train className="w-4 h-4 text-blue-400" />
          Transporte: Metro de Madrid
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-slate-400">
          Líneas recomendadas para las actividades de tu itinerario:
        </p>

        <div className="space-y-3">
          {metroLines.map(({ line, color, name, stops, note }) => (
            <div key={line} className="flex items-start gap-3">
              <div
                className="w-8 h-6 rounded flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: color }}
              >
                <span className="text-white text-[10px] font-bold">{line}</span>
              </div>
              <div className="flex-1">
                <p className="text-slate-300 text-xs font-medium">{name}</p>
                <p className="text-slate-500 text-[10px] mb-1">{note}</p>
                <div className="flex flex-wrap gap-1">
                  {stops.map((stop) => (
                    <span
                      key={stop}
                      className="text-[10px] text-slate-400 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5"
                    >
                      {stop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10 mt-1"
        >
          <ExternalLink className="w-3 h-3" />
          Ver Plano de Metro
        </Button>
      </CardContent>
    </Card>
  )
}
