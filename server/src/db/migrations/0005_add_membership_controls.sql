ALTER TABLE "members" ADD COLUMN "freeze_until" timestamp;
ALTER TABLE "members" ADD COLUMN "cancel_at_period_end" integer DEFAULT 0;
