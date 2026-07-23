CREATE TYPE "public"."cost_complexity_level" AS ENUM('SIMPLE', 'MEDIUM', 'COMPLEX', 'ENTERPRISE');--> statement-breakpoint
CREATE TYPE "public"."cost_currency" AS ENUM('INR', 'USD', 'EUR', 'GBP');--> statement-breakpoint
CREATE TYPE "public"."cost_discount_type" AS ENUM('PERCENTAGE', 'FIXED');--> statement-breakpoint
CREATE TYPE "public"."cost_platform" AS ENUM('WEB', 'ANDROID', 'IOS', 'DESKTOP', 'ADMIN_PANEL', 'API', 'AI_INTEGRATION');--> statement-breakpoint
CREATE TYPE "public"."cost_role" AS ENUM('FRONTEND', 'BACKEND', 'UI_UX_DESIGN', 'QA_TESTING', 'DEVOPS', 'PROJECT_MANAGEMENT', 'AI_DEVELOPMENT');--> statement-breakpoint
CREATE TYPE "public"."cost_tax_type" AS ENUM('GST', 'VAT', 'SERVICE_TAX');--> statement-breakpoint
CREATE TABLE "cost_complexity_multipliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"level" "cost_complexity_level" NOT NULL,
	"multiplier" numeric(6, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_hourly_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"role" "cost_role" NOT NULL,
	"hourly_rate" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_platform_multipliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"platform" "cost_platform" NOT NULL,
	"multiplier" numeric(6, 3) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"risk_buffer_percentage" numeric(5, 2) DEFAULT '10' NOT NULL,
	"default_currency" "cost_currency" DEFAULT 'INR' NOT NULL,
	"currency_symbol" varchar(8) DEFAULT '₹' NOT NULL,
	"tax_enabled" boolean DEFAULT false NOT NULL,
	"tax_type" "cost_tax_type" DEFAULT 'GST' NOT NULL,
	"tax_percentage" numeric(5, 2) DEFAULT '18' NOT NULL,
	"discount_type" "cost_discount_type" DEFAULT 'PERCENTAGE' NOT NULL,
	"discount_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"max_discount_percentage" numeric(5, 2) DEFAULT '20' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cost_complexity_multipliers" ADD CONSTRAINT "cost_complexity_multipliers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_hourly_rates" ADD CONSTRAINT "cost_hourly_rates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_platform_multipliers" ADD CONSTRAINT "cost_platform_multipliers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_settings" ADD CONSTRAINT "cost_settings_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cost_complexity_org_level_uidx" ON "cost_complexity_multipliers" USING btree ("organization_id","level");--> statement-breakpoint
CREATE INDEX "cost_complexity_organization_id_idx" ON "cost_complexity_multipliers" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cost_hourly_rates_org_role_uidx" ON "cost_hourly_rates" USING btree ("organization_id","role");--> statement-breakpoint
CREATE INDEX "cost_hourly_rates_organization_id_idx" ON "cost_hourly_rates" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cost_platform_org_platform_uidx" ON "cost_platform_multipliers" USING btree ("organization_id","platform");--> statement-breakpoint
CREATE INDEX "cost_platform_organization_id_idx" ON "cost_platform_multipliers" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cost_settings_organization_id_uidx" ON "cost_settings" USING btree ("organization_id");