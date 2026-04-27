const TRUE_VALUES = new Set(["1", "true", "yes", "on"])
const FALSE_VALUES = new Set(["0", "false", "no", "off"])

export class MissingEnvironmentVariableError extends Error {
  readonly missing: string[]
  readonly context?: string

  constructor(missing: string[], context?: string) {
    const missingList = missing.join(", ")
    super(
      context
        ? `${context} is not configured. Missing env: ${missingList}`
        : `Missing environment variables: ${missingList}`
    )
    this.name = "MissingEnvironmentVariableError"
    this.missing = missing
    this.context = context
  }
}

export function getEnv(name: string): string | undefined {
  const value = process.env[name]
  if (typeof value !== "string") return undefined

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function hasEnv(name: string): boolean {
  return Boolean(getEnv(name))
}

export function requireEnv(name: string, context?: string): string
export function requireEnv(names: string[], context?: string): Record<string, string>
export function requireEnv(nameOrNames: string | string[], context?: string) {
  if (Array.isArray(nameOrNames)) {
    const missing = nameOrNames.filter((name) => !hasEnv(name))
    if (missing.length > 0) {
      throw new MissingEnvironmentVariableError(missing, context)
    }

    return Object.fromEntries(
      nameOrNames.map((name) => [name, getEnv(name) as string])
    ) as Record<string, string>
  }

  const value = getEnv(nameOrNames)
  if (!value) {
    throw new MissingEnvironmentVariableError([nameOrNames], context)
  }

  return value
}

export function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const value = getEnv(name)?.toLowerCase()
  if (!value) return defaultValue
  if (TRUE_VALUES.has(value)) return true
  if (FALSE_VALUES.has(value)) return false
  return defaultValue
}

export const REQUIRED_RUNTIME_ENVS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
] as const

export const OPTIONAL_RUNTIME_ENVS = [
  "GROQ_API_KEY",
  "GOOGLE_PLACES_API_KEY",
  "OPENTRIPMAP_API_KEY",
  "VIAJE360_ALLOW_ANONYMOUS_FALLBACK",
] as const

export const FEATURE_FLAG_ENVS = [
  "FEATURE_GOOGLE_PLACES",
  "FEATURE_OPEN_METEO",
  "FEATURE_PLACES_CACHE",
  "FEATURE_WEATHER_CACHE",
  "FEATURE_RATE_LIMITING",
] as const
