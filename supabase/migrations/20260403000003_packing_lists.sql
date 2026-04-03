CREATE TABLE IF NOT EXISTS public.packing_lists (
  trip_id UUID NOT NULL,
  user_id UUID NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (trip_id, user_id)
);

ALTER TABLE public.packing_lists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can manage own packing lists" ON public.packing_lists
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
