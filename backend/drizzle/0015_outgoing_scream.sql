ALTER TABLE "client_leads" ADD COLUMN "tech_stack" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "client_leads" ADD COLUMN "pricing" jsonb;