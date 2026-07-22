CREATE TYPE "public"."client_lead_status" AS ENUM('NEW', 'CONTACTED', 'CONVERTED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."client_preferred_contact_method" AS ENUM('EMAIL', 'PHONE', 'WHATSAPP');--> statement-breakpoint
CREATE TABLE "client_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"company" varchar(255),
	"phone" varchar(64),
	"whatsapp" varchar(64),
	"country" varchar(128),
	"preferred_contact_method" "client_preferred_contact_method" DEFAULT 'EMAIL' NOT NULL,
	"notes" text,
	"project_idea" text NOT NULL,
	"consultation_time" varchar(32) NOT NULL,
	"platforms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"other_platform" varchar(255),
	"requirement_summary" text NOT NULL,
	"features" jsonb NOT NULL,
	"estimate" jsonb NOT NULL,
	"status" "client_lead_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "client_leads_email_idx" ON "client_leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "client_leads_status_idx" ON "client_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "client_leads_created_at_idx" ON "client_leads" USING btree ("created_at");