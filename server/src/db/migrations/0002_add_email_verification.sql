-- Add email verification fields to members table
ALTER TABLE "members" ADD COLUMN "email_verification_token" text;
ALTER TABLE "members" ADD COLUMN "email_verification_expires_at" timestamp;

-- Create index on verification token for fast lookups
CREATE INDEX "email_verification_token_idx" ON "members"("email_verification_token");
