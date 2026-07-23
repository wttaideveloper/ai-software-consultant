import {
  boolean,
  index,
  numeric,
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  costComplexityLevelEnum,
  costCurrencyEnum,
  costDiscountTypeEnum,
  costPlatformEnum,
  costRoleEnum,
  costTaxTypeEnum,
} from "./enums.js";
import { createdAt, updatedAt } from "./helpers.js";
import { organizations } from "./organizations.js";

/**
 * The pricing engine's configuration — four tables, all organization-scoped.
 *
 * Every consultancy prices differently, so none of these values may be hardcoded:
 * an admin changes a rate here and the next estimate reprices without a deploy.
 * The AI is never asked for money; it estimates effort, and these rows turn
 * effort into a price (see cost.engine.ts).
 *
 * `organizationId` is present on all four despite not being in the original
 * sketch: this is a multi-tenant platform and two organizations must not share a
 * rate card. Rows are provisioned lazily with documented defaults the first time
 * an organization reads its settings.
 *
 * Money and multipliers are `numeric`, never floating point — a rate card that
 * drifts by a cent per read is a support ticket. The pg driver returns numeric
 * as a string; DTO mappers convert once at the boundary.
 */

/** One configurable hourly rate per delivery role. */
export const costHourlyRates = pgTable(
  "cost_hourly_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: costRoleEnum("role").notNull(),
    hourlyRate: numeric("hourly_rate", { precision: 12, scale: 2 }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("cost_hourly_rates_org_role_uidx").on(
      table.organizationId,
      table.role,
    ),
    index("cost_hourly_rates_organization_id_idx").on(table.organizationId),
  ],
);

/** Price multiplier per complexity tier — Simple 1.0 … Enterprise 2.0. */
export const costComplexityMultipliers = pgTable(
  "cost_complexity_multipliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    level: costComplexityLevelEnum("level").notNull(),
    multiplier: numeric("multiplier", { precision: 6, scale: 3 }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("cost_complexity_org_level_uidx").on(
      table.organizationId,
      table.level,
    ),
    index("cost_complexity_organization_id_idx").on(table.organizationId),
  ],
);

/** Price multiplier per target platform. */
export const costPlatformMultipliers = pgTable(
  "cost_platform_multipliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    platform: costPlatformEnum("platform").notNull(),
    multiplier: numeric("multiplier", { precision: 6, scale: 3 }).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("cost_platform_org_platform_uidx").on(
      table.organizationId,
      table.platform,
    ),
    index("cost_platform_organization_id_idx").on(table.organizationId),
  ],
);

/**
 * The single settings row per organization: risk, currency, tax and the
 * discount ceiling. Unique on organizationId — one rate card per tenant.
 */
export const costSettings = pgTable(
  "cost_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    /** Percentage added to development cost to absorb delivery risk. 0–100. */
    riskBufferPercentage: numeric("risk_buffer_percentage", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("10"),

    defaultCurrency: costCurrencyEnum("default_currency").notNull().default("INR"),
    /** Stored alongside the code so the UI never maps code → symbol itself. */
    currencySymbol: varchar("currency_symbol", { length: 8 })
      .notNull()
      .default("₹"),

    taxEnabled: boolean("tax_enabled").notNull().default(false),
    taxType: costTaxTypeEnum("tax_type").notNull().default("GST"),
    taxPercentage: numeric("tax_percentage", { precision: 5, scale: 2 })
      .notNull()
      .default("18"),

    /** Default discount offered, and the ceiling no quote may exceed. */
    discountType: costDiscountTypeEnum("discount_type").notNull().default("PERCENTAGE"),
    discountValue: numeric("discount_value", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    maxDiscountPercentage: numeric("max_discount_percentage", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("20"),

    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("cost_settings_organization_id_uidx").on(table.organizationId),
  ],
);
