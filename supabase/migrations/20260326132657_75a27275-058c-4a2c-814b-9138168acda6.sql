CREATE POLICY "Admins can view all alert subscribers"
ON public.daily_alert_subscribers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));