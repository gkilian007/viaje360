import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

function getOrigin(req: NextRequest): string {
  // Behind reverse proxies (Cloudflare Tunnel, etc.), req.url resolves to localhost.
  // Use forwarded headers to reconstruct the real origin.
  const forwardedHost = req.headers.get("x-forwarded-host")
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https"
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }
  const host = req.headers.get("host")
  if (host && !host.startsWith("localhost") && !host.startsWith("127.")) {
    return `${forwardedProto}://${host}`
  }
  return new URL(req.url).origin
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const origin = getOrigin(req)
  const next = searchParams.get("next")
  const safeNext = next && next.startsWith("/") ? next : "/home"

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          },
        },
      }
    )

    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${safeNext}`)
}
