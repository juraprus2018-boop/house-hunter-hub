
CREATE TABLE public.ad_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  ad_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ad slots"
ON public.ad_slots
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all ad slots"
ON public.ad_slots
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ad slots"
ON public.ad_slots
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ad slots"
ON public.ad_slots
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ad slots"
ON public.ad_slots
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_ad_slots_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ad_slots_updated_at
BEFORE UPDATE ON public.ad_slots
FOR EACH ROW EXECUTE FUNCTION public.touch_ad_slots_updated_at();

INSERT INTO public.ad_slots (slot_key, name, description, is_active) VALUES
  ('homepage', 'Homepage', 'Wordt getoond op de homepage tussen de secties.', true),
  ('city_page', 'Stadspagina', 'Wordt getoond op stadspaginas (bijv. /woningen-maastricht).', true),
  ('search_page', 'Zoekpagina', 'Wordt getoond op de zoekpagina (/zoeken).', true),
  ('property_detail', 'Detailpagina woning', 'Wordt getoond boven het Reageer op deze woning blok op de detailpagina.', true);
