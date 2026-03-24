-- Enable RLS on all self-learning tables and grant service_role full access.
-- Also grant access to authenticated users where appropriate.

-- activity_knowledge
ALTER TABLE public.activity_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.activity_knowledge FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON public.activity_knowledge FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON public.activity_knowledge FOR SELECT TO authenticated USING (true);

-- trip_activity_events
ALTER TABLE public.trip_activity_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.trip_activity_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "auth_own" ON public.trip_activity_events FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- trip_day_journals
ALTER TABLE public.trip_day_journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.trip_day_journals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "auth_own" ON public.trip_day_journals FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- trip_day_activity_feedback
ALTER TABLE public.trip_day_activity_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.trip_day_activity_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);

-- user_preference_signals
ALTER TABLE public.user_preference_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.user_preference_signals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "auth_own" ON public.user_preference_signals FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- user_destination_memory
ALTER TABLE public.user_destination_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.user_destination_memory FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "auth_own" ON public.user_destination_memory FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- destination_aggregate_signals
ALTER TABLE public.destination_aggregate_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON public.destination_aggregate_signals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON public.destination_aggregate_signals FOR SELECT TO anon USING (true);
CREATE POLICY "auth_read" ON public.destination_aggregate_signals FOR SELECT TO authenticated USING (true);

-- Also ensure existing core tables have service_role access
DO $$ 
BEGIN
  -- trips
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trips' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY "service_role_all" ON public.trips FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  -- activities
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY "service_role_all" ON public.activities FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  -- itinerary_days
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_days' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY "service_role_all" ON public.itinerary_days FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  -- onboarding_profiles
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'onboarding_profiles' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY "service_role_all" ON public.onboarding_profiles FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  -- itinerary_versions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'itinerary_versions' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY "service_role_all" ON public.itinerary_versions FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
  -- adaptation_events
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'adaptation_events' AND policyname = 'service_role_all') THEN
    EXECUTE 'CREATE POLICY "service_role_all" ON public.adaptation_events FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;
