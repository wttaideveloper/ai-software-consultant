CREATE TYPE "public"."lead_proposal_status" AS ENUM('DRAFT', 'READY', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "lead_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" "lead_proposal_status" DEFAULT 'DRAFT' NOT NULL,
	"proposal_json" jsonb NOT NULL,
	"pdf_path" text,
	"docx_path" text,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "lead_proposals" ADD CONSTRAINT "lead_proposals_lead_id_client_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."client_leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_proposals" ADD CONSTRAINT "lead_proposals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lead_proposals_lead_version_uidx" ON "lead_proposals" USING btree ("lead_id","version_number");--> statement-breakpoint
CREATE INDEX "lead_proposals_lead_id_idx" ON "lead_proposals" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_proposals_status_idx" ON "lead_proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lead_proposals_updated_at_idx" ON "lead_proposals" USING btree ("updated_at");