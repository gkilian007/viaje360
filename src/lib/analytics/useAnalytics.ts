import posthog from "posthog-js"

export function useAnalytics() {
  function track(event: string, props?: Record<string, unknown>) {
    try { posthog.capture(event, props) } catch {}
  }
  function identify(userId: string, props?: Record<string, unknown>) {
    try { posthog.identify(userId, props) } catch {}
  }
  return { track, identify }
}
