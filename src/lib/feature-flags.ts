/**
 * Simple env-based feature flags.
 * Usage: getFeatureFlag("GOOGLE_PLACES") checks FEATURE_GOOGLE_PLACES env var.
 *
 * Convention: FEATURE_<NAME>=true|1 to enable.
 * If the env var is missing or anything else, the flag is OFF.
 */

import { readBooleanEnv } from "@/lib/env"

const FLAG_PREFIX = "FEATURE_"

/** Known feature flags with their defaults (all off unless env says otherwise) */
const DEFAULTS: Record<string, boolean> = {
  GOOGLE_PLACES: false,
  OPEN_METEO: true,
  PLACES_CACHE: false,
  WEATHER_CACHE: false,
  RATE_LIMITING: true,
}

export function getFeatureFlag(name: string): boolean {
  return readBooleanEnv(`${FLAG_PREFIX}${name}`, DEFAULTS[name] ?? false)
}

export function getAllFeatureFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {}
  for (const name of Object.keys(DEFAULTS)) {
    flags[name] = getFeatureFlag(name)
  }
  return flags
}
