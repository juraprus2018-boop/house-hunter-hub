
CREATE TABLE public.makelaar_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kantoornaam TEXT NOT NULL,
  contactpersoon TEXT NOT NULL,
  email TEXT NOT NULL,
  telefoon TEXT,
  website TEXT,
  koppeling_type TEXT NOT NULL DEFAULT 'xml',
  crm_software TEXT,
  feed_url TEXT,
  opmerking TEXT,
  status TEXT NOT NULL DEFAULT 'nieuw',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.makelaar_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert makelaar leads"
ON public.makelaar_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view makelaar leads"
ON public.makelaar_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
