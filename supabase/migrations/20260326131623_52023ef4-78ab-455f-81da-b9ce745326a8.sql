CREATE OR REPLACE FUNCTION public.block_duplicate_admin_sent_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  normalized_email text;
BEGIN
  normalized_email := lower(btrim(NEW.recipient_email));
  NEW.recipient_email := normalized_email;

  PERFORM pg_advisory_xact_lock(hashtextextended(normalized_email, 0));

  IF EXISTS (
    SELECT 1
    FROM public.admin_sent_emails
    WHERE lower(btrim(recipient_email)) = normalized_email
  ) THEN
    RAISE EXCEPTION 'duplicate recipient email: %', normalized_email
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_duplicate_admin_sent_email_trigger ON public.admin_sent_emails;

CREATE TRIGGER block_duplicate_admin_sent_email_trigger
BEFORE INSERT ON public.admin_sent_emails
FOR EACH ROW
EXECUTE FUNCTION public.block_duplicate_admin_sent_email();