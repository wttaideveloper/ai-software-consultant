CREATE TYPE "public"."client_mockup_set_status" AS ENUM('PENDING', 'READY', 'FAILED');--> statement-breakpoint
CREATE TABLE "client_mockup_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"set_id" uuid NOT NULL,
	"screen_name" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"storage_key" varchar(512) NOT NULL,
	"mime_type" varchar(64) DEFAULT 'image/png' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_mockup_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_key" uuid NOT NULL,
	"status" "client_mockup_set_status" DEFAULT 'PENDING' NOT NULL,
	"requirements_hash" varchar(64) NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "client_mockup_images" ADD CONSTRAINT "client_mockup_images_set_id_client_mockup_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."client_mockup_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_mockup_images_set_id_idx" ON "client_mockup_images" USING btree ("set_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_mockup_sets_consultation_key_idx" ON "client_mockup_sets" USING btree ("consultation_key");--> statement-breakpoint
CREATE INDEX "client_mockup_sets_status_idx" ON "client_mockup_sets" USING btree ("status");