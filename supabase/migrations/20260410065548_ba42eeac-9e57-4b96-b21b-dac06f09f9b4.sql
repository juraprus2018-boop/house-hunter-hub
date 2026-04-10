CREATE TABLE public.city_realtors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  website TEXT,
  rating NUMERIC,
  reviews_count INTEGER DEFAULT 0,
  place_id TEXT UNIQUE,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_city_realtors_city ON public.city_realtors (city);

ALTER TABLE public.city_realtors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view realtors"
ON public.city_realtors
FOR SELECT
TO public
USING (true);

CREATE POLICY "Service role full access on city_realtors"
ON public.city_realtors
FOR ALL
TO public
USING (auth.role() = 'service_role'::text);

CREATE TRIGGER update_city_realtors_updated_at
BEFORE UPDATE ON public.city_realtors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();