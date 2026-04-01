
-- Page views tracking table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_url text NOT NULL,
  referrer text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for live queries (last 5 min, last 24h)
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_page_url ON public.page_views (page_url, created_at DESC);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous tracking)
CREATE POLICY "Anyone can insert page views" ON public.page_views
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admins can read
CREATE POLICY "Admins can view page views" ON public.page_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Service role full access
CREATE POLICY "Service role full access page_views" ON public.page_views
  FOR ALL USING (auth.role() = 'service_role');

-- Daisycon click tracking table
CREATE TABLE public.daisycon_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  session_id text,
  source_url text NOT NULL,
  source_site text,
  page_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_daisycon_clicks_created_at ON public.daisycon_clicks (created_at DESC);
CREATE INDEX idx_daisycon_clicks_property ON public.daisycon_clicks (property_id, created_at DESC);

ALTER TABLE public.daisycon_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert daisycon clicks" ON public.daisycon_clicks
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can view daisycon clicks" ON public.daisycon_clicks
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access daisycon_clicks" ON public.daisycon_clicks
  FOR ALL USING (auth.role() = 'service_role');
