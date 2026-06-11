import { PostHog } from "posthog-node"

/**
 * Server-side PostHog client for API routes. Returns null when no key is
 * configured so callers can skip analytics without conditional env checks.
 * Callers must `await client.shutdown()` after capturing (serverless-safe).
 */
export function getServerPostHog(): PostHog | null {
  const key = process.env.POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key || key === "placeholder") return null
  return new PostHog(key, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
  })
}
