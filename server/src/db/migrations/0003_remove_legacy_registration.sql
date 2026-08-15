-- Remove columns used only by the deleted custom registration flow.
DROP INDEX IF EXISTS "email_verification_token_idx";
ALTER TABLE "members" DROP COLUMN IF EXISTS "password_hash";
ALTER TABLE "members" DROP COLUMN IF EXISTS "email_verification_token";
ALTER TABLE "members" DROP COLUMN IF EXISTS "email_verification_expires_at";
