import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

const DESTINATION_EMOJIS: Record<string, string> = {
  barcelona: "🏛️", madrid: "🎭", paris: "🗼", roma: "🏟️", rome: "🏟️",
  tokio: "🗼", tokyo: "🗺️", london: "🎡", londre: "🎡", amsterdam: "🌷",
  berlin: "🏙️", lisboa: "🐟", lisbon: "🐟", vienna: "🎻", viena: "🎻",
  prague: "🏰", praga: "🏰", bali: "🌺", dubai: "🌆", "nueva york": "🗽",
  "new york": "🗽",
}

function getEmoji(destination: string): string {
  const key = destination.toLowerCase().trim()
  return DESTINATION_EMOJIS[key] ?? "✈️"
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const destination = sp.get("destination") ?? "Mi viaje"
  const country = sp.get("country") ?? ""
  const emoji = getEmoji(destination)

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0a0a0f 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle at 100px 100px, rgba(10,132,255,0.15) 0%, transparent 50%), radial-gradient(circle at 1100px 530px, rgba(191,90,242,0.15) 0%, transparent 50%)",
          }}
        />

        {/* Top gradient bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #0A84FF, #5856D6, #BF5AF2)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px 100px",
            gap: "24px",
            flex: 1,
          }}
        >
          {/* Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#0A84FF",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Viaje360 · Mi viaje
            </div>
          </div>

          {/* Main destination */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <span style={{ fontSize: "100px", lineHeight: 1 }}>{emoji}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  fontSize: "80px",
                  fontWeight: 900,
                  color: "white",
                  lineHeight: 1,
                  letterSpacing: "-2px",
                }}
              >
                {destination}
              </div>
              {country && (
                <div
                  style={{
                    fontSize: "28px",
                    color: "rgba(192,198,214,0.8)",
                    fontWeight: 400,
                  }}
                >
                  {country}
                </div>
              )}
            </div>
          </div>

          {/* Bottom tagline */}
          <div
            style={{
              fontSize: "20px",
              color: "rgba(192,198,214,0.6)",
              fontWeight: 400,
              marginTop: "16px",
            }}
          >
            Itinerario creado con inteligencia artificial · Planifica tu próximo viaje en viaje360.app
          </div>
        </div>

        {/* Bottom logo */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "100px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0A84FF, #5856D6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            ✈️
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            viaje360.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
