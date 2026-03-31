
-- Table: log of URLs submitted to Google Indexing API
CREATE TABLE public.google_indexing_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  url_type text NOT NULL DEFAULT 'property', -- property, city, landing
  status text NOT NULL DEFAULT 'submitted', -- submitted, indexed, error
  response_status integer,
  response_body text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: daily rank tracking per keyword/URL
CREATE TABLE public.google_rank_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracked_url text NOT NULL,
  keyword text NOT NULL,
  position numeric,
  clicks integer DEFAULT 0,
  impressions integer DEFAULT 0,
  ctr numeric,
  tracked_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tracked_url, keyword, tracked_date)
);

-- Indexes
CREATE INDEX idx_indexing_log_created ON public.google_indexing_log(created_at DESC);
CREATE INDEX idx_indexing_log_url ON public.google_indexing_log(url);
CREATE INDEX idx_rank_tracking_url_date ON public.google_rank_tracking(tracked_url, tracked_date DESC);
CREATE INDEX idx_rank_tracking_keyword ON public.google_rank_tracking(keyword);

-- RLS
ALTER TABLE public.google_indexing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_rank_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage google_indexing_log" ON public.google_indexing_log
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access on google_indexing_log" ON public.google_indexing_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can manage google_rank_tracking" ON public.google_rank_tracking
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access on google_rank_tracking" ON public.google_rank_tracking
  FOR ALL USING (auth.role() = 'service_role');
