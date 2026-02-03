-- Create scraped_properties table for review queue
CREATE TABLE public.scraped_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scraper_id UUID REFERENCES public.scrapers(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  source_site TEXT NOT NULL,
  title TEXT NOT NULL,
  price NUMERIC,
  city TEXT,
  postal_code TEXT,
  street TEXT,
  house_number TEXT,
  surface_area NUMERIC,
  bedrooms INTEGER,
  bathrooms INTEGER,
  property_type TEXT,
  listing_type TEXT,
  description TEXT,
  images TEXT[],
  raw_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  published_property_id UUID REFERENCES public.properties(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scraped_properties ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage scraped properties
CREATE POLICY "Admins can view scraped properties"
  ON public.scraped_properties FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert scraped properties"
  ON public.scraped_properties FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update scraped properties"
  ON public.scraped_properties FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scraped properties"
  ON public.scraped_properties FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role bypass for edge functions
CREATE POLICY "Service role full access"
  ON public.scraped_properties FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_scraped_properties_updated_at
  BEFORE UPDATE ON public.scraped_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();