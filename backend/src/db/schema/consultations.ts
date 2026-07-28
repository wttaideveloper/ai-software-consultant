import {
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { consultationModeEnum } from "./enums.js";
import { createdAt, deletedAt, updatedAt } from "./helpers.js";
import { organizations } from "./organizations.js";
import { users } from "./users.js";

export const consultations = pgTable(
  "consultations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    assignedTo: uuid("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    status: varchar("status", { length: 64 }).notNull().default("draft"),
    /**
     * Drives the entire downstream pipeline (discovery questions, feature
     * categories, estimate shape, proposal template, mockup gating) — not a label.
     * Defaulted so consultations created before this column existed keep working
     * as the new-build consultations they always were.
     */
    consultationMode: consultationModeEnum("consultation_mode")
      .notNull()
      .default("NEW_PROJECT"),
    industry: varchar("industry", { length: 128 }),
    projectType: varchar("project_type", { length: 128 }),
    budgetRange: varchar("budget_range", { length: 128 }),
    timeline: varchar("timeline", { length: 128 }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt,
    updatedAt,
    deletedAt,
  },
  (table) => [
    index("consultations_organization_id_idx").on(table.organizationId),
    index("consultations_created_by_idx").on(table.createdBy),
    index("consultations_assigned_to_idx").on(table.assignedTo),
  ],
);
