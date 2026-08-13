-- Fix: Drop broad SELECT policy that allows file listing
-- Public URL access works without any policy, so this is safe
DROP POLICY IF EXISTS "Public read delivery images" ON storage.objects;

-- Optional: If you ever need API access to specific folders only:
-- CREATE POLICY "Read products and voice only"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'delivery'
--   AND (
--     storage.foldername(name) = 'products'
--     OR storage.foldername(name) = 'voice'
--   )
-- );
