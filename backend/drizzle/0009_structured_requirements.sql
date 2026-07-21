CREATE TABLE "structured_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"consultation_id" uuid NOT NULL,
	"structured_data" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" "requirement_summary_status" DEFAULT 'draft' NOT NULL,
	"generated_by" "requirement_summary_generated_by" DEFAULT 'AI' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "structured_requirements" ADD CONSTRAINT "structured_requirements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "structured_requirements" ADD CONSTRAINT "structured_requirements_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "structured_requirements_consultation_id_uidx" ON "structured_requirements" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "structured_requirements_organization_id_idx" ON "structured_requirements" USING btree ("organization_id");