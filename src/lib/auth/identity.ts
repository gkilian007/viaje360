export const DEV_ANONYMOUS_USER_ID = "00000000-0000-0000-0000-000000000001"

export interface CurrentUserIdentity {
  userId: string | null
  isAuthenticated: boolean
  isAnonymous: boolean
}

interface ResolveCurrentUserIdentityOptions {
  authUserId?: string | null
  allowAnonymousFallback?: boolean
  fallbackUserId?: string
}

interface AllowAnonymousFallbackOptions {
  nodeEnv?: string
  explicitFlag?: string | undefined
}

export function shouldAllowAnonymousFallback({
  nodeEnv = process.env.NODE_ENV,
  explicitFlag = process.env.VIAJE360_ALLOW_ANONYMOUS_FALLBACK,
}: AllowAnonymousFallbackOptions = {}): boolean {
  if (explicitFlag === "true") return true
  return nodeEnv !== "production"
}

export function resolveCurrentUserIdentity({
  authUserId,
  allowAnonymousFallback = shouldAllowAnonymousFallback(),
  fallbackUserId = DEV_ANONYMOUS_USER_ID,
}: ResolveCurrentUserIdentityOptions): CurrentUserIdentity {
  if (authUserId) {
    return {
      userId: authUserId,
      isAuthenticated: true,
      isAnonymous: false,
    }
  }

  if (allowAnonymousFallback) {
    return {
      userId: fallbackUserId,
      isAuthenticated: false,
      isAnonymous: true,
    }
  }

  return {
    userId: null,
    isAuthenticated: false,
    isAnonymous: false,
  }
}
