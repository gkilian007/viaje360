# Viaje360

## Local setup

1. Copy the env template:

```bash
cp .env.example .env.local
```

2. Fill in the required secrets in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`

3. Optional:
   - `GOOGLE_PLACES_API_KEY` if you want Google Places as the primary places provider
   - feature flags such as `FEATURE_GOOGLE_PLACES`, `FEATURE_PLACES_CACHE`, `FEATURE_WEATHER_CACHE`, `FEATURE_RATE_LIMITING`

4. Start the app:

```bash
npm run dev
```

## Production/deployment docs

- `docs/deployment/secrets.md`
- `docs/deployment/env-matrix.md`
- `docs/deployment/production-checklist.md`
- `supabase/README.md`

## Runtime behavior

- Missing `GOOGLE_PLACES_API_KEY` does not break places search; the app falls back to Gemini.
- Missing cache/service-role capabilities fail closed for cache/persistence paths instead of crashing the whole request flow where fallbacks exist.
- Missing required AI/Supabase runtime envs now return explicit configuration errors for affected routes.
