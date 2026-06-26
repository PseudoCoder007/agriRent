-- AgriRent Phase 1 Plan 03 — equipment-images Storage bucket.
-- Codifies the user_setup dashboard step from 01-01-PLAN.md ("Create a
-- Storage bucket named equipment-images with allowed_mime_types restricted
-- to image/jpeg, image/png, image/webp and a 5MB file size limit") as a
-- migration instead of a manual dashboard click, so it is reproducible and
-- reviewable like the rest of the schema.
--
-- Bucket-level MIME/size restriction is the second independent enforcement
-- layer (defense in depth) alongside the application-level imageFileSchema
-- check in src/lib/validations/equipment.schema.ts (see T-03-03 in
-- 01-03-PLAN.md's threat model).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'equipment-images',
  'equipment-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Bucket is public-read (equipment listings are visible to any authenticated
-- farmer/owner per T-03-04 — intentional, accepted information disclosure).
-- Writes are still authorization-scoped: only an authenticated owner may
-- upload into their own ownerId-prefixed path, matching the
-- `${ownerId}/${equipmentId}/${filename}` path convention used by
-- listing.service.ts's createEquipment().

CREATE POLICY "Public read access to equipment images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'equipment-images');

CREATE POLICY "Owners can upload their own equipment images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'equipment-images'
  AND public.is_owner()
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owners can update their own equipment images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'equipment-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Owners can delete their own equipment images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'equipment-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
