ALTER TABLE "project_estimations" ALTER COLUMN "estimated_weeks" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "project_estimations" ADD COLUMN "mode_plan" jsonb;