import { createBrowserClient } from "@supabase/ssr"

export function isSupabaseBrowserConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase browser client is not configured")
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
