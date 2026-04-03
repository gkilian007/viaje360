-- Proactive Companion Engine: stores generated insights for in-app display and analytics
CREATE TABLE IF NOT EXISTS public.proactive_insights (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('evening_briefing', 'morning_briefing', 'post_day', 'budget_pulse', 'weather_change', 'ticket_reminder')),
  severity TEXT NOT NULL CHECK (severity IN ('urgent', 'helpful', 'nice_to_know')),
  day_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  actions JSONB DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ,
  auto_adapt BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  seen BOOLEAN DEFAULT FALSE,
  acted_on BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_proactive_insights_user_trip
  ON public.proactive_insights(user_id, trip_id);

CREATE INDEX IF NOT EXISTS idx_proactive_insights_expires
  ON public.proactive_insights(expires_at)
  WHERE seen = FALSE;

-- RLS
ALTER TABLE public.proactive_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own insights"
  ON public.proactive_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert/update insights"
  ON public.proactive_insights FOR ALL
  USING (true)
  WITH CHECK (true);
