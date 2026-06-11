-- General in-app feedback (bug reports, ideas) submitted via the feedback widget

CREATE TABLE IF NOT EXISTS public.app_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('bug', 'idea', 'otro')),
  message text NOT NULL CHECK (char_length(message) BETWEEN 3 AND 2000),
  page_path text,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_app_feedback_created ON public.app_feedback(created_at DESC);

-- RLS: all writes go through the API with the service client; no direct client access
ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.app_feedback
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON public.app_feedback TO service_role;
