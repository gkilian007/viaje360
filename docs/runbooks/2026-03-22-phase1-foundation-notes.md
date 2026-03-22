# Phase 1 foundation notes

Date: 2026-03-22
Scope: Batch 1 tasks 1-3

## Auth and identity
- API routes now resolve the current user through Supabase server auth when session cookies are present.
- Anonymous/dev fallback is preserved through `VIAJE360_ALLOW_ANONYMOUS_FALLBACK=true` or any non-production `NODE_ENV`.
- In production without auth or explicit fallback, protected write paths return `401` instead of silently writing as the demo user.
- Anonymous fallback user id remains `00000000-0000-0000-0000-000000000001` for local/dev continuity.

## API contracts
- Route inputs are validated with shared Zod contracts in `src/lib/api/contracts.ts`.
- Success responses use `{ ok: true, data: ... }`.
- Errors use `{ ok: false, error: { code, message, details? } }`.
- Validation errors expose flattened field details for frontend handling.

## Persistence and hydration
- `GET /api/trips/active` now returns trip, itinerary days, and persisted chat history together.
- `AppBootstrap` hydrates deterministically from backend when an active trip exists, otherwise it keeps local/demo state.
- Persisted backend chat replaces stale local chat when backend data is available.
- If Supabase save fails during itinerary generation, the app still returns a local trip id so the user can continue in fallback mode.

## Environment expectations
Required for authenticated persistence:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional for local/dev anonymous mode:
- `VIAJE360_ALLOW_ANONYMOUS_FALLBACK=true`

Required for itinerary/chat generation:
- `GEMINI_API_KEY`
