CREATE TYPE "public"."consultation_mode" AS ENUM('NEW_PROJECT', 'FEATURE_ENHANCEMENT', 'MAINTENANCE', 'MODERNIZATION');--> statement-breakpoint
ALTER TABLE "client_leads" ADD COLUMN "consultation_mode" "consultation_mode" DEFAULT 'NEW_PROJECT' NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "consultation_mode" "consultation_mode" DEFAULT 'NEW_PROJECT' NOT NULL;