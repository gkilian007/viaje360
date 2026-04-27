# Viaje360 Madrid transport database

## Goal

Persist a reusable Madrid transport layer in Supabase so Viaje360 can reason about metro stations, bus stops, lines, schedules, closures, and accessibility with less dependence on runtime external APIs.

## Why

Viaje360 already has:
- curated Madrid POIs in DB
- mobility-aware heuristics
- local metro accessibility hints
- real trip persistence in trips + itinerary_versions + itinerary_days + activities

What is still missing is a proper transport knowledge layer that can support:
- station/stop-aware planning
- line-aware routing hints
- weekday/weekend/night schedule reasoning
- closures / works / non-accessible station warnings
- stronger metro vs bus personalization

## Scope

Phase 1 should add a local DB-backed transport foundation for Madrid using official or semi-official sources where possible.

### Phase 1 scope
- persist metro stations and bus stops for Madrid
- persist line-stop relationships for a first usable subset
- persist schedule/headway-like base information where source quality supports it
- persist closure / works / accessibility status when known
- expose a deterministic app-facing read layer for transport hints
- use this DB layer to enrich planner/detail logic later

### Implemented so far
- `madrid-transport-v1`: base network layer, selected hubs, airport night bus N32, Línea 6 night replacement alerts, accessibility/works seeds
- `madrid-transport-v2`: extended interchange/airport layer with Plaza de Castilla, Príncipe Pío, Legazpi, Línea 200, Exprés Aeropuerto 203, Aeropuerto T1-T2-T3 and Aeropuerto T4, plus a Plaza de Castilla accessibility pilot alert
- `madrid-transport-v3`: tourist-core station layer covering Gran Vía, Callao, Ópera, Chueca, La Latina, Lavapiés, Retiro and Banco de España with official station references, interchange/accessibility stance and useful EMT correspondences for planner enrichment
- `madrid-transport-v4`: Salamanca/Castellana + macro-hub layer covering Serrano, Velázquez, Núñez de Balboa, Colón, Alonso Martínez, Santiago Bernabéu, Chamartín, Conde de Casal and Méndez Álvaro to strengthen shopping, business, rail and intermodal planning context
- `madrid-transport-v5`: Prado/rail/west-access layer covering Sevilla, Recoletos, Estación del Arte, Atocha Renfe, Delicias, Argüelles and a Prado transport anchor to improve museum, train-arrival and mixed-mode itinerary reasoning

### Out of scope for phase 1
- full real-time arrival predictions
- universal GTFS ingestion for all operators and all edge cases
- perfect de-duplication of every legacy transport row
- replacing Google Routes end-to-end

## Data model direction

Create or populate transport-focused tables in Supabase, preferring explicit structure over vague JSON blobs.

Candidate entities:
- `transport_stops`
  - metro stations, bus stops, interchanges
- `transport_lines`
  - metro lines, EMT lines, interurban lines
- `transport_stop_lines`
  - join table mapping lines to stops
- `transport_schedules`
  - weekday / weekend / night frequencies or schedule summaries
- `transport_alerts`
  - closures, works, accessibility incidents, planned upgrades

If fewer tables are needed for the first pass, start with the minimum viable subset, but keep the shape extensible.

## Source priority

1. Official CRTM / Metro Madrid / EMT open data
2. Existing local curated transport accessibility knowledge already in workspace
3. Deterministic local seeds for gaps

## Product requirements

The DB layer should support these app needs:
- detect nearest plausible station/stop by neighborhood/context
- know whether a station is accessible / risky / closed / under works
- know whether a stop/station is an interchange
- distinguish day/night and weekday/weekend service shapes when known
- let the planner prefer bus vs metro differently by mobility profile
- let trip detail explain why a station/line was or was not recommended
- model traveler friction beyond accessibility alone: stroller, luggage, reduced pace, frequent-rest and wheelchair profiles should change walking tolerance and the desirability of stairs-heavy transfers
- estimate door-to-door transfer reality, not just raw ride time: walking to station, elevator/escalator friction, interchange complexity, extra delay with luggage/stroller, and a more conservative recommendation when accessibility is partial or unknown

## Mobility-aware transport v1

The first useful behavior layer after the DB seed is not full real-time routing. It is a deterministic recommendation layer that combines:
- seeded station accessibility / works / interchange metadata
- existing mobility profiles already present in Viaje360
- conservative penalties for luggage, stroller, wheelchair, reduced mobility, and frequent-rest profiles
- simple door-to-door transfer estimation (walk to stop + wait + ride + station friction)

### V1 requirements
- treat `wheelchair` as the strictest profile: do not recommend metro transfers that rely on stations with unknown/partial accessibility when a simpler bus/taxi alternative exists
- treat stroller / baby / heavy luggage as slower walkers with higher station friction, especially for interchanges and long station access corridors
- penalize `isInterchange` hubs when the accessibility status is partial/unknown and the traveler profile is sensitive
- expose a compact transport brief for Madrid prompts that explicitly tells the planner when metro is acceptable, risky, or should be avoided
- include realistic transfer language in prompts: if the traveler carries luggage or a stroller, walking and transfers should take longer than the default adult profile
- prefer conservative truth over fake precision; when the exact elevator or corridor time is not known, express it as friction/penalty rather than inventing exact seconds
- compute a first fit label per node (`recommended` / `caution` / `avoid`) plus an estimated extra-minute penalty driven by accessibility state, interchange complexity, luggage and mobility profile
- expose that fit signal in the product API layer so Explore/planner/UI can later explain *why* a hub is fine, risky, or should be avoided for a given traveler
- expose a simple door-to-door estimate for product consumption: walk-to-stop + wait + ride + station friction, adjusted by mobility/luggage/stroller profile and time of day
- expose a first traveler-aware recommended mode per node (`walk` / `bus` / `metro` / `taxi` / `mixed`) with a short reason, so product surfaces can suggest not only *which node* but also *how to approach it*
- expose a lightweight segment decision layer on top of the node: compare walking vs simplified transport for a plausible segment and return a preferred mode with rationale, so later planner work can reuse the same deterministic decision model between activities

## Constraints

- Must remain compatible with current Viaje360 architecture
- Must preserve fallback behavior when Supabase data is missing
- Should avoid pretending to know real-time values when only static schedule data exists
- Must label confidence clearly when data is incomplete

## Success criteria

- Madrid transport layer exists in Supabase with meaningful seed data
- Planner/trip detail can query transport records deterministically
- Closures/works/accessibility can be represented in DB, not only in TS seed files
- Build/lint stay green
- At least one ingestion/seed script can populate the transport layer reproducibly

## Immediate implementation order

1. inspect live schema and decide minimum viable transport tables
2. create a first ingestion/seed script for Madrid transport data
3. persist metro accessibility/closure knowledge into DB
4. add bus/stop schedule foundation where source quality is acceptable
5. wire a reusable app-side transport read helper
6. inject that helper into Madrid itinerary generation so the planner uses deterministic transport context before inventing generic station advice

## Current execution status
- Seed/data layer is already live through `madrid-transport-v5` (50 rows in `activity_knowledge` for Madrid transport).
- The next product layer is a DB-first helper that reads Madrid transport rows from Supabase and falls back to the local seed when DB is unavailable.
- Initial intended integration point: itinerary generation prompt for Madrid only, so the planner can choose real hubs/stations/correspondences more coherently without changing unrelated destinations.


## Product integration now in code
- `src/lib/services/madrid-transport-knowledge.ts` provides a DB-first Madrid transport read layer backed by `activity_knowledge` and local-seed fallback.
- `src/lib/services/madrid-transport-knowledge.ts` also computes a first traveler-aware fit assessment per node: fit label, estimated extra minutes, and reasons based on accessibility, interchange friction, stroller/luggage, and mobility profile.
- `src/lib/services/itinerary.service.ts` now injects a Madrid-only transport context into itinerary generation prompts, using accommodation/interests/must-see terms to rank the most relevant stations and hubs.
- The Madrid planner/adaptation prompts now also include explicit transfer decision rules so Gemini treats fit scoring, door-to-door friction, accessibility uncertainty, stroller/luggage burden, and interchange complexity as real planning constraints rather than decorative notes.
- The itinerary service now also annotates Madrid itineraries after generation/adaptation with deterministic between-activity segment guidance: when consecutive activities are far enough apart and have coordinates, the planner adds an inline access hint based on simplified walk-vs-transport decision logic, persisted in activity notes/recommendation reasoning without requiring a schema migration first.
- Next planner-level behavior for Madrid should remain schema-light: if accumulated segment friction inside a day becomes too expensive for the traveler profile, the planner should reduce visible density conservatively (through notes/recommendation reasoning and selective caution language first, not by destructive automatic rewrites of the day structure).
- `src/app/api/destination-transport/route.ts` exposes a lightweight Madrid transport highlights endpoint for product surfaces and now accepts traveler-profile query hints to return fit-aware transport highlights plus a simple door-to-door estimate, a recommended mode per node, and a first segment-level preferred-mode decision.
- `src/app/explore/page.tsx` now surfaces Madrid transport highlights from that DB-first layer, so the seeded transport knowledge is already visible in product before deeper planner/persistence work.
- Explore now also surfaces the first traveler-aware transport scoring layer (`fitLabel`, `extraMinutes`, simplified `doorToDoor.totalMinutes`, recommended mode, and a first segment-level preferred-mode hint) so the transport data is not just internally available but legible in product.
- This keeps the change isolated to Madrid generation and Explore first, avoiding a risky broad UI migration.
