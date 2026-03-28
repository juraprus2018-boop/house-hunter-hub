
CREATE TABLE public.property_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  content text NOT NULL,
  is_approved boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.property_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved comments
CREATE POLICY "Anyone can view approved comments"
ON public.property_comments
FOR SELECT
TO public
USING (is_approved = true);

-- Anyone (anon + authenticated) can insert comments
CREATE POLICY "Anyone can insert comments"
ON public.property_comments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can manage all comments
CREATE POLICY "Admins can manage comments"
ON public.property_comments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
