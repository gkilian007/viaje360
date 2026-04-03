# Proactive Companion Engine — Spec v1

## Concept

A single engine that decides **what** to tell the user, **when**, and **how** — turning Viaje360 from a reactive tool into an intelligent travel companion.

## Architecture

```
┌─────────────────────────────────────────────┐
│              Trigger Engine                   │
│  (evaluates all triggers on each check)      │
├─────────────────┬───────────────────────────┤
│  Weather        │  Budget                    │
│  Schedule       │  Fatigue                   │
│  Proximity      │  Tickets/Availability      │
│  Time-of-day    │  Learning (past trips)     │
└────────┬────────┴───────────────────────────┘
         │ produces ProactiveInsight[]
         ▼
┌─────────────────────────────────────────────┐
│              Priority Filter                 │
│  - Deduplicate                               │
│  - Rate limit (max 3 push/day)               │
│  - Quiet hours (23:00–07:00)                 │
│  - "Would I want this?" test                 │
└────────┬────────────────────────────────────┘
         │ filtered insights
         ▼
┌─────────────────────────────────────────────┐
│              Delivery Router                 │
│  - Push notification (urgent/actionable)     │
│  - In-app banner (next time they open)       │
│  - Chat message (conversational)             │
│  - Auto-adapt + notify (weather)             │
└─────────────────────────────────────────────┘
```

## Triggers (v1)

### 1. Evening Briefing (T-12h)
- **When:** 21:00 the night before each trip day
- **What:** Tomorrow's plan summary + weather + tips
- **Delivery:** Push notification → opens briefing card
- **Intelligence:**
  - Weather forecast for tomorrow
  - If any activity needs advance tickets → remind to buy NOW
  - If first activity is early → "Set alarm for X"
  - If weather changed since generation → auto-adapt + explain

### 2. Morning Briefing (T-0)
- **When:** 08:00 (or user's wake time from onboarding)
- **What:** Today's quick summary
- **Delivery:** Push notification + in-app banner
- **Content:**
  - "Buenos días. Hoy: [3-4 activity names]. [Weather emoji] [temp]°C."
  - First activity time + travel time from hotel
  - One contextual tip (e.g., "Es lunes — el museo cierra a las 14:00")

### 3. Nearby Discovery (between activities)
- **When:** User has 30+ min gap AND is in destination (GPS)
- **What:** Hidden gem / interesting spot nearby
- **Delivery:** In-app card (already built as MagicMoment)
- **Enhancement:**
  - Cross-reference with user interests
  - Filter by time of day (no bar at 10 AM)
  - "Estás a 3 min de X. Los viajeros que visitaron Roma lo califican 4.8⭐"

### 4. Post-Day Check-in
- **When:** 21:00 each trip day (after last activity)
- **What:** Recap + fatigue check + tomorrow adjustment offer
- **Delivery:** Push notification → opens diary/recap
- **Intelligence:**
  - Estimate steps/intensity from activities
  - "Hoy fue intenso (6 actividades, ~15km). ¿Quieres que relaje mañana?"
  - If user answers yes → auto-adapt next day with lighter plan
  - Prompt diary entry

### 5. Budget Pulse
- **When:** After each purchase log OR daily at 20:00
- **What:** Budget status + forecast
- **Delivery:** In-app badge + optional push if overspending
- **Intelligence:**
  - Track daily spend vs. budget / remaining days
  - "Llevas €X de €Y, te quedan Z días. Vas [bien / apretado / te pasas]."
  - If overspending: suggest cheaper alternatives for upcoming expensive activities
  - If underspending: "Tienes margen — ¿quieres upgrade algún restaurante?"

### 6. Smart Weather Adaptation (already built)
- **When:** Precipitation ≥ 80% for a trip day
- **What:** Auto-swap outdoor → indoor activities
- **Delivery:** Auto-adapt + in-app banner explaining the change
- **Status:** ✅ DONE (this session)

## ProactiveInsight Type

```typescript
interface ProactiveInsight {
  id: string
  trigger: "evening_briefing" | "morning_briefing" | "nearby" | "post_day" | "budget" | "weather" | "ticket_reminder"
  severity: "urgent" | "helpful" | "nice_to_know"
  dayNumber: number
  title: string                    // Short, emoji-prefixed
  body: string                     // 1-3 sentences, actionable
  actions?: ProactiveAction[]      // Buttons the user can tap
  expiresAt?: string               // Auto-dismiss after this time
  autoAdapt?: boolean              // If true, engine already adapted
  adaptationPrompt?: string        // For manual "adapt" button
}

interface ProactiveAction {
  label: string                    // Button text
  type: "adapt" | "dismiss" | "open_url" | "open_screen"
  payload?: string                 // URL, screen path, or adaptation reason
}
```

## Priority & Rate Limiting

- Max **3 push notifications per day** during trip
- Max **1 push per 2 hours** (except urgent)
- Quiet hours: **23:00–07:00** (respect user's timezone)
- Severity hierarchy: urgent > helpful > nice_to_know
- Same trigger type: max once per day (no duplicate budget alerts)
- User can disable individual trigger types in settings

## Implementation Plan

### Phase 1: Evening + Morning Briefing (highest impact)
1. Create `/api/proactive/evaluate` — server-side trigger evaluation
2. Create `ProactiveBriefingCard` component
3. Extend `notification-scheduler.ts` to schedule briefing pushes
4. Create cron worker to dispatch scheduled notifications
5. Morning briefing: push at wake time + in-app banner

### Phase 2: Post-Day Check-in + Budget
1. Budget tracking UI (simple expense logger)
2. Post-day intelligence (fatigue estimation)
3. "Relax tomorrow?" flow → one-tap auto-adapt

### Phase 3: Enhanced Nearby + Tickets
1. Ticket availability checking (limited APIs)
2. Enhanced MagicMoment with user history
3. Time-aware filtering (no bars in morning, etc.)

## Data Required

- `user_timezone` — needed for correct push timing (add to onboarding)
- `trip_expenses` table — for budget tracking
- `proactive_insights` table — log what was shown + user response (for learning)
- Weather API already integrated (Open-Meteo)
- Push infra already built (VAPID + web-push)

## Design Principles

1. **Useful, not annoying** — every notification must pass: "Would I be glad I got this?"
2. **Actionable** — always include a clear action (not just "FYI it might rain")
3. **Respectful** — quiet hours, rate limits, easy to disable per-type
4. **Learning** — track which insights users act on vs. dismiss → improve over time
