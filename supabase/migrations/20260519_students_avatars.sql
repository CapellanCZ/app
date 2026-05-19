-- Student profiles + avatar storage for mobile app headers (HSO, SDAO, DO, Profile tab)

-- ── students table (synced with auth.users.id) ───────────────────────────────

CREATE TABLE IF NOT EXISTS public.students (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  first_name  TEXT NOT NULL DEFAULT '',
  last_name   TEXT NOT NULL DEFAULT '',
  program     TEXT NOT NULL DEFAULT '',
  student_id  TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select_own" ON public.students;
CREATE POLICY "students_select_own"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "students_insert_own" ON public.students;
CREATE POLICY "students_insert_own"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "students_update_own" ON public.students;
CREATE POLICY "students_update_own"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── avatars bucket (public read; students write only their folder) ───────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_select_own_folder" ON storage.objects;
CREATE POLICY "avatars_select_own_folder"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername (name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "avatars_insert_own_folder" ON storage.objects;
CREATE POLICY "avatars_insert_own_folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername (name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "avatars_update_own_folder" ON storage.objects;
CREATE POLICY "avatars_update_own_folder"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername (name))[1] = auth.uid()::TEXT
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername (name))[1] = auth.uid()::TEXT
  );

DROP POLICY IF EXISTS "avatars_delete_own_folder" ON storage.objects;
CREATE POLICY "avatars_delete_own_folder"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername (name))[1] = auth.uid()::TEXT
  );
