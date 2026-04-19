-- Create city_guides table for "Verhuizen naar [stad]" pages
CREATE TABLE public.city_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL UNIQUE,
  city_slug text NOT NULL UNIQUE,
  intro text,
  registration_info text,
  transport_info text,
  parking_info text,
  schools_info text,
  housing_market_info text,
  neighborhoods_info text,
  practical_tips text,
  meta_title text,
  meta_description text,
  generated_by text DEFAULT 'ai',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.city_guides ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view city guides"
ON public.city_guides FOR SELECT
USING (true);

CREATE POLICY "Admins can manage city guides"
ON public.city_guides FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access on city_guides"
ON public.city_guides FOR ALL
USING (auth.role() = 'service_role'::text);

-- Trigger for updated_at
CREATE TRIGGER update_city_guides_updated_at
BEFORE UPDATE ON public.city_guides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast slug lookup
CREATE INDEX idx_city_guides_slug ON public.city_guides(city_slug);