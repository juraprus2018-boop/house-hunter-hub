CREATE TABLE public.admin_sent_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  template_name TEXT NOT NULL,
  html_content TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  opened_at TIMESTAMP WITH TIME ZONE,
  tracking_id UUID NOT NULL DEFAULT gen_random_uuid(),
  sent_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_sent_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_sent_emails" ON public.admin_sent_emails
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access on admin_sent_emails" ON public.admin_sent_emails
  FOR ALL TO public
  USING (auth.role() = 'service_role'::text);