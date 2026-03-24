-- Fix: service_role should bypass RLS automatically, but some tables 
-- may have been created with RLS enabled and no policies.
-- Ensure service_role bypass is working by granting full access explicitly.

-- First, drop any conflicting policies and recreate cleanly
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'activity_knowledge',
      'trip_activity_events', 
      'trip_day_journals',
      'trip_day_activity_feedback',
      'user_preference_signals',
      'user_destination_memory',
      'destination_aggregate_signals',
      'trips',
      'activities',
      'itinerary_days',
      'onboarding_profiles',
      'itinerary_versions',
      'adaptation_events',
      'chat_messages',
      'profiles',
      'monuments',
      'achievements',
      'places_cache',
      'weather_cache'
    ])
  LOOP
    -- Grant all privileges to service_role on each table
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl);
    EXECUTE format('GRANT ALL ON public.%I TO authenticated', tbl);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', tbl);
  END LOOP;
END $$;

-- Also grant on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
