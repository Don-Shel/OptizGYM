ALTER TABLE "members" ADD COLUMN IF NOT EXISTS "profile_preferences" jsonb DEFAULT '{}'::jsonb;
