ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "intensity" text DEFAULT 'medium';
ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "requirements" text;
