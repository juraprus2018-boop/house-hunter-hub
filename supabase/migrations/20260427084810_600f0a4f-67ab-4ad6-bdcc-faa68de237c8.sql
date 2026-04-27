-- Auto-added cities (merged into UI selector)
CREATE TABLE public.extra_cities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'auto',
  property_count INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extra_cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible extra cities"
  ON public.extra_cities FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins can manage extra cities"
  ON public.extra_cities FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access on extra_cities"
  ON public.extra_cities FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER trg_extra_cities_updated_at
  BEFORE UPDATE ON public.extra_cities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sync runs log
CREATE TABLE public.missing_cities_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  triggered_by TEXT NOT NULL DEFAULT 'manual',
  total_unique_cities INTEGER NOT NULL DEFAULT 0,
  missing_count INTEGER NOT NULL DEFAULT 0,
  added_count INTEGER NOT NULL DEFAULT 0,
  missing_cities JSONB NOT NULL DEFAULT '[]'::jsonb,
  added_cities JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT
);

ALTER TABLE public.missing_cities_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view missing cities log"
  ON public.missing_cities_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access on missing_cities_log"
  ON public.missing_cities_log FOR ALL
  USING (auth.role() = 'service_role');

CREATE INDEX idx_missing_cities_log_run_at ON public.missing_cities_log(run_at DESC);