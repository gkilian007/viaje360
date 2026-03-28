import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Viaje360 — Planificador de viajes con IA"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #131315 0%, #0a1628 50%, #131315 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 24 }}>✈️</div>
        <div style={{ fontSize: 56, fontWeight: 900, color: "white", marginBottom: 16 }}>
          Viaje360
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#9ca3af",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Planifica tu viaje perfecto con inteligencia artificial
        </div>
        <div
          style={{
            marginTop: 40,
            padding: "12px 32px",
            background: "linear-gradient(135deg, #0A84FF, #5856D6)",
            borderRadius: 50,
            fontSize: 22,
            color: "white",
            fontWeight: 600,
          }}
        >
          2 días gratis — viaje360.app
        </div>
      </div>
    ),
    { ...size }
  )
}
