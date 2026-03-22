# Secrets and Configuration

## Required secrets

### Core app
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required for trusted server operations, cache persistence, versioning, and admin writes)
- `GEMINI_API_KEY` (required for chat, itinerary generation, quiz generation, and places fallback)

Use `.env.example` as the canonical template for local/staging/prod variable names.

## Optional secrets

### Places provider
- `GOOGLE_PLACES_API_KEY`
  - Optional
  - Enables Google Places as primary provider when `FEATURE_GOOGLE_PLACES=true`
  - If absent, Gemini fallback remains active

### Auth/dev fallback
- `VIAJE360_ALLOW_ANONYMOUS_FALLBACK`
  - Optional
  - Defaults to enabled in non-production and disabled in production
  - Only set to `true` in production if you intentionally want anonymous fallback

## Feature flags

Set as environment variables:
- `FEATURE_GOOGLE_PLACES=true|false`
- `FEATURE_OPEN_METEO=true|false`
- `FEATURE_PLACES_CACHE=true|false`
- `FEATURE_WEATHER_CACHE=true|false`
- `FEATURE_RATE_LIMITING=true|false`

## Operational notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- `NEXT_PUBLIC_*` vars are client-visible by design.
- Google Places should be considered optional infrastructure, not a hard dependency.
- Missing required AI or Supabase envs now fail with explicit 503 configuration errors instead of generic crashes.
- Rotate API keys independently by environment.
