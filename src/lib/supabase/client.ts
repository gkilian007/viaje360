import { createBrowserClient } from "@supabase/ssr"

// IMPORTANT: Next.js only inlines NEXT_PUBLIC_* vars when accessed as
// literal `process.env.NEXT_PUBLIC_XXX` expressions. Using dynamic lookups
// like process.env[name] will NOT be replaced at build time.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export function isSupabaseBrowserConfigured() {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0
}

export function createClient() {
  if (!isSupabaseBrowserConfigured()) {
    throw new Error("Supabase browser client is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export async function getBrowserCurrentUserId() {
  if (!isSupabaseBrowserConfigured()) {
    return null
  }

  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}
