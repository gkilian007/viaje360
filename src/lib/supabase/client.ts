import { createBrowserClient } from "@supabase/ssr"
import { hasEnv, requireEnv } from "@/lib/env"

export function isSupabaseBrowserConfigured() {
  return hasEnv("NEXT_PUBLIC_SUPABASE_URL") && hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export function createClient() {
  const env = requireEnv(
    ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    "Supabase browser client"
  )

  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export async function getBrowserCurrentUserId() {
  if (!isSupabaseBrowserConfigured()) {
    return null
  }

  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}
