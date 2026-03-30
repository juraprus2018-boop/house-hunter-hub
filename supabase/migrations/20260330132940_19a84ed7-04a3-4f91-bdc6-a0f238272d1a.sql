
-- Neighborhood reviews table
CREATE TABLE public.neighborhood_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood text NOT NULL,
  city text NOT NULL,
  user_id uuid,
  name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  pros text,
  cons text,
  comment text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.neighborhood_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews" ON public.neighborhood_reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can insert reviews" ON public.neighborhood_reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage reviews" ON public.neighborhood_reviews
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_neighborhood_reviews_city ON public.neighborhood_reviews(city, neighborhood);
CREATE INDEX idx_neighborhood_reviews_approved ON public.neighborhood_reviews(is_approved);
