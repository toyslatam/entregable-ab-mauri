
DROP POLICY IF EXISTS "public read released bucket" ON storage.objects;
UPDATE storage.buckets SET public = false WHERE id = 'released';
