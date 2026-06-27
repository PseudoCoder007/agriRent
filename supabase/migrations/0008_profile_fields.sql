-- AgriRent Phase 03.4 Plan 01 — profile fields + avatars Storage bucket.
--
-- Adds phone/avatar_url/avatar_updated_at columns to public.users and
-- creates a dedicated avatars Storage bucket with ownership-scoped RLS
-- policies, mirroring the equipment-images bucket pattern from
-- 0002_equipment_images_bucket.sql.

-- 1. Additive columns on public.users. All nullable, no backfill.

-- SECURITY NOTE: the existing 0003_users_public_read.sql policy
-- (USING (true)) makes this phone column readable by ANY authenticated
-- user, not just its owner — same accepted tradeoff already extended to
-- email for marketplace owner/farmer coordination. Accepted per phase
-- planning: application code must never render another user's phone
-- number in any UI (mirrors how email is already handled). No
-- column-level RLS exists in Postgres without GRANT tricks; this is a
-- deliberate, documented tradeoff, not an oversight.
ALTER TABLE public.users ADD COLUMN phone text;

-- avatar_url stores the Storage *path* (e.g. "${userId}/avatar.jpg"),
-- never a pre-built public URL — mirrors equipment_images.storage_path /
-- getEquipmentImageUrl()'s build-at-read-time pattern.
ALTER TABLE public.users ADD COLUMN avatar_url text;

-- avatar_updated_at is written only inside the future uploadAvatar()
-- service function (Plan 03), used purely as a cache-busting query-param
-- source. No trigger needed since it is set in the same UPDATE statement
-- that writes avatar_url.
ALTER TABLE public.users ADD COLUMN avatar_updated_at timestamptz;

-- 2. avatars Storage bucket — same 5MB/JPEG-PNG-WebP limits as
--    equipment-images.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. storage.objects RLS policies scoped to bucket_id = 'avatars'.
--    Unlike the equipment-images INSERT policy, do NOT add
--    public.is_owner() — any authenticated user, farmer or owner, must be
--    able to upload their own avatar.

CREATE POLICY "Public read access to avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- No new policy on public.users itself — the existing
-- "users update own row" policy already covers UPDATE of the two new
-- columns (RLS is row-level, not column-level).
