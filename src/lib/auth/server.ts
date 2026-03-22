import { cookies } from "next/headers"
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { getEnv } from "@/lib/env"
import { resolveCurrentUserIdentity, shouldAllowAnonymousFallback, type CurrentUserIdentity } from "./identity"

function getPublicSupabaseEnv() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL")
  const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

export async function createRouteSupabaseClient() {
  const env = getPublicSupabaseEnv()
  if (!env) return null

  const cookieStore = await cookies()

  return createSupabaseServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Route handlers can read session cookies without always mutating them.
        }
      },
    },
  })
}

export async function resolveRequestIdentity(): Promise<CurrentUserIdentity> {
  try {
    const supabase = await createRouteSupabaseClient()
    const authUserId = supabase
      ? (await supabase.auth.getUser()).data.user?.id ?? null
      : null

    return resolveCurrentUserIdentity({
      authUserId,
      allowAnonymousFallback: shouldAllowAnonymousFallback(),
    })
  } catch {
    return resolveCurrentUserIdentity({
      authUserId: null,
      allowAnonymousFallback: shouldAllowAnonymousFallback(),
    })
  }
}
