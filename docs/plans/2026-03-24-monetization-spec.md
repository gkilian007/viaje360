# Viaje360 — Monetization Spec (Opción B: Híbrido)

_Created: 2026-03-24_

## Modelo de negocio

### Trial por destino
- **2 días gratis** desde la primera generación de un viaje a ese destino
- Acceso completo durante el trial: IA, adaptación, mapa, diario, todo
- El trial es **por destino** (ciudad/país), no por cuenta
- Si el usuario genera Madrid y luego Tokyo, cada uno tiene su propio trial de 2 días

### Después del trial (día 3+)
**Qué se bloquea:**
- ❌ Adaptación con IA ("cambia la cena por sushi")
- ❌ Generar nuevos viajes al mismo destino
- ❌ Diario de viaje
- ✅ Ver el itinerario existente (read-only)
- ✅ Ver el mapa con los puntos
- ✅ Navegar entre días

**Mensaje del paywall:** "Tu trial de 2 días para {destino} ha terminado. Desbloquea acceso permanente."

### Opciones de pago

| Plan | Precio | Qué incluye |
|------|--------|-------------|
| **Por viaje** | €4.99 | Acceso permanente a ese destino (IA, adaptación, diario) |
| **Anual** | €29.99/año | Todos los destinos ilimitados, sin trials |

### Lógica de negocio
- A partir de ~7 viajes/año, la suscripción es más barata → upsell natural
- El paywall muestra ambas opciones con comparativa visual
- La suscripción anual tiene badge "Ahorra 60%" (vs 7+ viajes × €4.99)

---

## Schema de base de datos

### `user_subscriptions` (nueva tabla)
```sql
create table public.user_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  plan text not null check (plan in ('free', 'annual')),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired')),
  stripe_subscription_id text,
  stripe_customer_id text,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### `destination_purchases` (nueva tabla)
```sql
create table public.destination_purchases (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  destination text not null, -- normalized: lowercase trimmed
  stripe_payment_intent_id text,
  amount numeric not null default 4.99,
  currency text not null default 'EUR',
  purchased_at timestamptz not null default now(),
  created_at timestamptz default now()
);
-- Unique: un usuario solo compra un destino una vez
create unique index idx_destination_purchases_user_dest 
  on public.destination_purchases(user_id, destination);
```

### `destination_trials` (nueva tabla)
```sql
create table public.destination_trials (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  destination text not null, -- normalized: lowercase trimmed
  started_at timestamptz not null default now(),
  expires_at timestamptz not null, -- started_at + 2 days
  created_at timestamptz default now()
);
create unique index idx_destination_trials_user_dest 
  on public.destination_trials(user_id, destination);
```

---

## Access resolution logic

```
function resolveAccess(userId, destination):
  1. Check user_subscriptions → plan='annual' AND status='active' AND expires_at > now()
     → YES: full access (subscriber)
  
  2. Check destination_purchases → user_id + destination
     → YES: full access (purchased)
  
  3. Check destination_trials → user_id + destination
     → If exists AND expires_at > now(): full access (trial active)
     → If exists AND expires_at <= now(): BLOCKED (trial expired)
     → If not exists: create trial (started_at=now, expires_at=now+2days), full access
  
  Return: { hasAccess: boolean, reason: 'subscriber'|'purchased'|'trial'|'expired', trialExpiresAt?, daysRemaining? }
```

---

## API endpoints

### `GET /api/access?destination={dest}`
Returns access status for the current user + destination.
Response:
```json
{
  "hasAccess": true,
  "reason": "trial",
  "plan": "free",
  "trialExpiresAt": "2026-03-26T14:00:00Z",
  "daysRemaining": 1.5,
  "canAdapt": true,
  "canGenerate": true,
  "canDiary": true
}
```

### `POST /api/purchase/destination`
Body: `{ destination, paymentMethodId }`
Creates Stripe payment + destination_purchase record.

### `POST /api/subscribe/annual`
Body: `{ paymentMethodId }`
Creates Stripe subscription + user_subscription record.

---

## UI Components

### `PaywallModal`
- Triggered when user tries a blocked action (adapt, generate, diary)
- Shows destination name + "Tu trial ha terminado"
- Two cards side by side:
  - 🎫 "Este viaje — €4.99" (compra única, acceso permanente)
  - 🌍 "Todos los viajes — €29.99/año" (badge "Ahorra 60%")
- Dark theme matching app
- Stripe Elements embedded for payment

### `TrialBanner`
- Subtle banner in plan page when trial is active
- "Trial gratuito: X días restantes para {destino}"
- Disappears if purchased or subscribed

### `AccessGate` (wrapper component)
- Like V3's Paywall.jsx but adapted
- Wraps premium features (AdaptInput, DiaryPromptCard, generate button)
- If no access → shows locked state + "Desbloquear" CTA

---

## Implementation phases

### Phase 1 — Access logic + DB (no Stripe yet)
- Migration: create 3 tables
- `access.service.ts`: resolveAccess function
- `GET /api/access` endpoint
- `AccessGate` component
- `TrialBanner` component
- `PaywallModal` (UI only, no real payments)
- Wire into plan page: gate AdaptInput, DiaryPromptCard

### Phase 2 — Stripe integration
- Stripe setup (keys, webhook)
- `POST /api/purchase/destination` with real Stripe
- `POST /api/subscribe/annual` with real Stripe
- Payment confirmation flow
- Webhook handling for subscription lifecycle

### Phase 3 — Polish
- Email receipts
- Subscription management (cancel, upgrade)
- Usage analytics
- A/B test pricing

---

## Dev notes
- Normalize destinations: `destination.toLowerCase().trim()`
- Trial clock starts on first generation, NOT on first visit
- Trial is calendar-based (48h from generation), not usage-based
- Anonymous dev user gets auto-trial like everyone else
- For dev/testing: env var `VIAJE360_BYPASS_PAYWALL=true` skips all access checks
