-- Phase 2+3: Trip expenses for budget tracking + user timezone

-- Trip expenses table
CREATE TABLE IF NOT EXISTS public.trip_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  category TEXT NOT NULL CHECK (category IN ('food', 'transport', 'tickets', 'shopping', 'accommodation', 'other')),
  description TEXT,
  activity_name TEXT,
  day_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_expenses_user_trip
  ON public.trip_expenses(user_id, trip_id);

-- User timezone (add to onboarding_profiles if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'onboarding_profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.onboarding_profiles ADD COLUMN timezone TEXT DEFAULT 'Europe/Madrid';
  END IF;
END $$;
