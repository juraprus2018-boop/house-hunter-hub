
CREATE TABLE public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'daisycon',
  status text NOT NULL DEFAULT 'running',
  feed_id uuid REFERENCES public.daisycon_feeds(id) ON DELETE SET NULL,
  feed_name text,
  total_feeds integer DEFAULT 0,
  processed_feeds integer DEFAULT 0,
  imported integer DEFAULT 0,
  updated integer DEFAULT 0,
  skipped integer DEFAULT 0,
  errors integer DEFAULT 0,
  message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage import_jobs" ON public.import_jobs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access on import_jobs" ON public.import_jobs
  FOR ALL TO public
  USING (auth.role() = 'service_role');
