
CREATE TABLE public.search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text,
  city text,
  listing_type text,
  property_type text,
  max_price numeric,
  min_bedrooms integer,
  count integer NOT NULL DEFAULT 1,
  first_searched_at timestamptz NOT NULL DEFAULT now(),
  last_searched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view search queries" ON public.search_queries
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can insert search queries" ON public.search_queries
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.search_queries
  FOR ALL TO public
  USING (auth.role() = 'service_role');

CREATE UNIQUE INDEX idx_search_queries_unique ON public.search_queries (
  COALESCE(query, ''), COALESCE(city, ''), COALESCE(listing_type, ''), COALESCE(property_type, '')
);
