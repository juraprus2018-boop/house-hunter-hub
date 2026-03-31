
-- Create unique index for upsert on search_queries
CREATE UNIQUE INDEX search_queries_combo_idx ON public.search_queries (
  COALESCE(query, ''),
  COALESCE(city, ''),
  COALESCE(listing_type, ''),
  COALESCE(property_type, '')
);

-- Create function to log/upsert search queries with count increment
CREATE OR REPLACE FUNCTION public.log_search_query(
  _query text DEFAULT NULL,
  _city text DEFAULT NULL,
  _listing_type text DEFAULT NULL,
  _property_type text DEFAULT NULL,
  _max_price numeric DEFAULT NULL,
  _min_bedrooms integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.search_queries (query, city, listing_type, property_type, max_price, min_bedrooms, count, first_searched_at, last_searched_at)
  VALUES (_query, _city, _listing_type, _property_type, _max_price, _min_bedrooms, 1, now(), now())
  ON CONFLICT (COALESCE(query, ''), COALESCE(city, ''), COALESCE(listing_type, ''), COALESCE(property_type, ''))
  DO UPDATE SET
    count = search_queries.count + 1,
    last_searched_at = now(),
    max_price = COALESCE(EXCLUDED.max_price, search_queries.max_price),
    min_bedrooms = COALESCE(EXCLUDED.min_bedrooms, search_queries.min_bedrooms);
END;
$$;
