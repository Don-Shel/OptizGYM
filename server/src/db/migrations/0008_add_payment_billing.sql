ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "billing" text NOT NULL DEFAULT 'monthly';
