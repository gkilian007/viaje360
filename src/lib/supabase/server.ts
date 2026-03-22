import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { hasEnv, requireEnv } from "@/lib/env"

export function isSupabaseConfigured() {
  return (
    hasEnv("NEXT_PUBLIC_SUPABASE_URL") &&
    hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
    hasEnv("SUPABASE_SERVICE_ROLE_KEY")
  )
}

export function createServiceClient() {
  const env = requireEnv(
    ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    "Supabase service client"
  )

  return createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  )
}
