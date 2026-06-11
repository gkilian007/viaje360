"use client"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client"

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    let url = window.location.origin + pathname
    const qs = searchParams?.toString()
    if (qs) url += `?${qs}`
    posthog.capture("$pageview", { $current_url: url })
  }, [pathname, searchParams])

  return null
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key || key === "placeholder") return
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
    })

    if (!isSupabaseBrowserConfigured()) return

    // Identify with the Supabase user id so client events merge with
    // server-side captures (which already use userId as distinctId).
    // INITIAL_SESSION covers OAuth redirects; identify is a no-op when
    // the distinct id is unchanged.
    const supabase = createClient()
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email })
      } else if (event === "SIGNED_OUT") {
        posthog.reset()
      }
    })
    return () => authSub.subscription.unsubscribe()
  }, [])

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PostHogProvider>
  )
}
