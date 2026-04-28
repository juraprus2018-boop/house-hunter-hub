
INSERT INTO storage.buckets (id, name, public)
VALUES ('tiktok-media', 'tiktok-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read
CREATE POLICY "Public read tiktok-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'tiktok-media');

-- Service role can write (edge functions use service role)
CREATE POLICY "Service role write tiktok-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tiktok-media' AND auth.role() = 'service_role');

CREATE POLICY "Service role update tiktok-media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tiktok-media' AND auth.role() = 'service_role');

CREATE POLICY "Service role delete tiktok-media"
ON storage.objects FOR DELETE
USING (bucket_id = 'tiktok-media' AND auth.role() = 'service_role');
