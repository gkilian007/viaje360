import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const destination = searchParams.get("destination") ?? "Tu destino"
  const days = searchParams.get("days") ?? "0"
  const activities = searchParams.get("activities") ?? "0"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0a0a1a 0%, #131325 50%, #0a0a1a 100%)",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background gradient circle */}
        <div
          style={{
            position: "absolute",
            top: "-200px",
            right: "-200px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(10,132,255,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(94,92,230,0.12) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <span style={{ fontSize: "48px" }}>🌍</span>
          <span style={{ fontSize: "32px", fontWeight: 700, color: "#ffffff" }}>Viaje360</span>
        </div>

        {/* Destination */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: "900px",
            display: "flex",
          }}
        >
          {destination}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              padding: "12px 24px",
            }}
          >
            <span style={{ fontSize: "28px" }}>📅</span>
            <span style={{ fontSize: "24px", fontWeight: 600, color: "#ffffff" }}>{days} días</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              padding: "12px 24px",
            }}
          >
            <span style={{ fontSize: "28px" }}>📍</span>
            <span style={{ fontSize: "24px", fontWeight: 600, color: "#ffffff" }}>{activities} actividades</span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: "36px",
            fontSize: "20px",
            color: "#0A84FF",
            fontWeight: 600,
            display: "flex",
          }}
        >
          Planificado con inteligencia artificial ✨
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
