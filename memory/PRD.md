# Viaje360 - Product Requirements Document

## Original Problem Statement
Continuar el proyecto Viaje360 - una aplicación de viajes con AI que genera itinerarios personalizados, aprende de las preferencias del usuario, y se adapta en tiempo real.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict)
- **UI**: React 19, Tailwind CSS, Radix UI, Framer Motion
- **AI**: Google Gemini (gemini-2.5-flash)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **State**: Zustand (persisted to localStorage)
- **Data Fetching**: TanStack React Query
- **Forms**: React Hook Form + Zod validation

## Core Architecture
```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── chat/          # Conversational AI
│   │   ├── diary/         # Travel diary endpoints (NEW)
│   │   ├── itinerary/     # Itinerary generation
│   │   ├── places/        # Places search
│   │   └── weather/       # Weather data
│   ├── explore/           # Discover destinations
│   ├── onboarding/        # 18-step wizard
│   ├── plan/              # Itinerary view
│   │   └── diary/         # Travel diary page (NEW)
│   └── status/            # Trip status
├── components/
│   ├── features/          # Domain components
│   │   └── diary/         # Diary components (NEW)
│   ├── layout/            # Navigation
│   ├── onboarding/        # Wizard steps
│   └── ui/                # Base components
├── lib/
│   ├── services/          # Business logic
│   │   └── trip-learning.ts # Self-learning memory
│   └── supabase/          # Database
└── store/                 # Zustand stores
```

## User Personas
1. **Viajero Frecuente** - Busca optimizar tiempo y descubrir lugares únicos
2. **Viajero Planificador** - Quiere todo detallado y organizado
3. **Viajero Espontáneo** - Prefiere flexibilidad con sugerencias inteligentes
4. **Familia Viajera** - Necesita actividades kid-friendly y accesibles

## What's Been Implemented

### Session 1 - March 23, 2026

#### ✅ Travel Diary (End-of-Day Journal) - PRIORITY 1
Complete implementation of the end-of-day travel diary feature:

**Frontend Components Created:**
- `/src/components/features/diary/MoodSelector.tsx` - 5 emoji-based mood options
- `/src/components/features/diary/EnergyPaceSlider.tsx` - Energy and pace rating sliders (1-5)
- `/src/components/features/diary/ActivityFeedbackCard.tsx` - Like/dislike and would-repeat for each activity
- `/src/components/features/diary/DiaryConversation.tsx` - Main guided conversation UI
- `/src/components/features/diary/DiaryPromptCard.tsx` - Entry point card on plan page
- `/src/components/features/diary/index.ts` - Barrel export

**Pages Created:**
- `/src/app/plan/diary/page.tsx` - Diary page with full conversation flow

**API Routes Created:**
- `/src/app/api/diary/route.ts` - POST to save diary, GET to fetch existing diary

**Plan Page Updated:**
- Added DiaryPromptCard after timeline
- Added success toast notification for saved diary

**Flow:**
1. User sees "¿Cómo ha ido el día?" card at end of plan page
2. Clicks to open guided diary conversation
3. Selects mood (5 options with emojis)
4. Rates energy and pace (1-5 sliders)
5. Gives feedback on each activity (like/dislike, would repeat)
6. Optional: writes free-text summary
7. Saves diary - shows success toast and redirects to plan

**Testing Status:**
- Backend: 100% passing
- Frontend: 95% passing (minor navigation URL cosmetic issue)

#### ✅ Interactive Map with Animated Avatar - PRIORITY 2
Complete implementation of the interactive map with route visualization and animated avatar:

**Frontend Components Created:**
- `/src/components/features/map/types.ts` - TypeScript types, coordinates, colors
- `/src/components/features/map/useRouteAnimation.ts` - Animation state machine hook
- `/src/components/features/map/TravelerAvatar.tsx` - Animated avatar component
- `/src/components/features/map/AnimatedMapWithControls.tsx` - Main map component with controls

**Page Created:**
- `/src/app/mapa/page.tsx` - Full map page with all controls

**Navigation Updated:**
- Added "Mapa" tab to NAV_TABS in constants.ts

**Features:**
1. Mapbox GL JS integration with dark style
2. Activity markers with color-coded types (hotel=purple, park=green, restaurant=orange)
3. Numbered badges on markers (1, 2, 3...)
4. Route line connecting all activities
5. Animated avatar (hiking icon with pulse effect)
6. Animation controls (play, pause, reset)
7. Progress bar showing animation progress
8. Day selector to switch between days
9. Activity list panel (toggleable)
10. Jump to activity functionality
11. Camera follows avatar during animation
12. Stats badge showing number of stops

**Testing Status:**
- Frontend: 90% passing
- Fixed: React state update loop issue

## Prioritized Backlog

### P0 - Critical (Next Session)
1. **Weather Adaptation** - Automatic indoor alternatives when rain forecasted
2. **PWA + Offline** - Service worker for offline trip access

### P1 - Important
3. **Export Features** - Share as link, PDF, or Google Calendar
4. **Explore Page Enhancement** - Real destination cards with photos and search
5. **Supabase Full Integration** - Persist diary entries and map data

### P2 - Nice to Have
6. **Dark Mode** - Toggle theme (CSS variables ready)
7. **Push Notifications** - Upcoming activity reminders
8. **Walking/Driving Routes** - Real route directions between activities
9. **3D Avatar** - Enhanced avatar with sprite animations

## Next Tasks
1. Add weather-based activity suggestions (rainy day alternatives)
2. Implement PWA with service worker for offline mode
3. Add export functionality (PDF, Google Calendar)
4. Complete Supabase persistence for diary and map data
5. Add real destination photos to explore page

## Notes
- Mobile-first design with responsive desktop layout
- Uses Material Symbols for icons
- Glassmorphism and gradient aesthetics throughout
- Framer Motion for all animations
