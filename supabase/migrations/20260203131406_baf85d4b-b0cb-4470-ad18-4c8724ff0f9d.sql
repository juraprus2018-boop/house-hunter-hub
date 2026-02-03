-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create scrapers configuration table
CREATE TABLE public.scrapers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_run_status TEXT,
  properties_found INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on scrapers
ALTER TABLE public.scrapers ENABLE ROW LEVEL SECURITY;

-- Only admins can manage scrapers
CREATE POLICY "Admins can manage scrapers"
ON public.scrapers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Public can view active scrapers
CREATE POLICY "Public can view scrapers"
ON public.scrapers
FOR SELECT
USING (true);

-- Scraper run logs
CREATE TABLE public.scraper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scraper_id UUID REFERENCES public.scrapers(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  properties_scraped INTEGER DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on scraper_logs
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view scraper logs"
ON public.scraper_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert scraper logs"
ON public.scraper_logs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update trigger for scrapers
CREATE TRIGGER update_scrapers_updated_at
BEFORE UPDATE ON public.scrapers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default scrapers for Dutch real estate websites
INSERT INTO public.scrapers (name, website_url, description, config) VALUES
('Funda', 'https://www.funda.nl', 'Grootste woningplatform van Nederland', '{"selectors": {"title": ".object-header__title", "price": ".object-header__price"}}'),
('Pararius', 'https://www.pararius.nl', 'Huurwoningen in Nederland', '{"selectors": {"title": ".listing-title", "price": ".listing-price"}}'),
('Jaap.nl', 'https://www.jaap.nl', 'Koop en huurwoningen', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('Huurwoningen.nl', 'https://www.huurwoningen.nl', 'Huurwoningen overzicht', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('Kamernet', 'https://www.kamernet.nl', 'Kamers en studio''s', '{"selectors": {"title": ".listing-title", "price": ".listing-price"}}'),
('HousingAnywhere', 'https://housinganywhere.com', 'Internationale huurwoningen', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('Woonbron', 'https://www.woonbron.nl', 'Sociale huurwoningen Rotterdam', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('Vesteda', 'https://www.vesteda.com', 'Premium huurwoningen', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('De Key', 'https://www.dekey.nl', 'Woningcorporatie Amsterdam', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('Rochdale', 'https://www.rochdale.nl', 'Woningcorporatie Amsterdam', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('Woonstad Rotterdam', 'https://www.woonstadrotterdam.nl', 'Woningcorporatie Rotterdam', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('Wooniezie', 'https://www.wooniezie.nl', 'Sociale huurwoningen', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('123Wonen', 'https://www.123wonen.nl', 'Huurwoningen en kamers', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('DirectWonen', 'https://www.directwonen.nl', 'Woningen zonder makelaar', '{"selectors": {"title": ".property-title", "price": ".property-price"}}'),
('Nederwoon', 'https://www.nederwoon.nl', 'Huurwoningen in NL', '{"selectors": {"title": ".property-title", "price": ".property-price"}}');