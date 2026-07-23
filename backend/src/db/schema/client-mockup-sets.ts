import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { clientMockupSetStatusEnum } from "./enums.js";
import { createdAt, deletedAt, updatedAt } from "./helpers.js";

/**
 * One batch of AI-generated concept screens for a single Client Portal visit.
 *
 * No organizationId and no consultationId — like `client_leads`, this is a
 * top-level tenant-independent entity, because the portal is public and holds no
 * server-side consultation record (see client-leads.ts for the same reasoning).
 *
 * `consultationKey` is the cache identity the whole feature turns on: a UUID the
 * browser mints once per wizard run and keeps in sessionStorage. It is what makes
 * "generate once, never on refresh" possible without inventing accounts for
 * anonymous visitors. Unique, so two concurrent POSTs cannot both create a set —
 * the second collides and reads the first instead of double-spending on images.
 *
 * The row doubles as the job record: PENDING means a worker is filling it, and a
 * client polls until READY or FAILED.
 */
export const clientMockupSets = pgTable(
  "client_mockup_sets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    consultationKey: uuid("consultation_key").notNull(),

    status: clientMockupSetStatusEnum("status").notNull().default("PENDING"),

    /**
     * Fingerprint of the summary/features/platforms this batch was generated from.
     * Stored so a later change can be *detected* (and offered as a regenerate)
     * rather than silently re-billing the client on every edit.
     */
    requirementsHash: varchar("requirements_hash", { length: 64 }).notNull(),

    /**
     * How many batches this key has consumed (1 = the initial one). Enforces the
     * per-consultation regeneration ceiling, which — unlike the in-memory IP
     * limiter — is durable and survives restarts and multiple instances.
     */
    generationCount: integer("generation_count").notNull().default(1),

    /** Operator-facing failure reason; never surfaced verbatim to the public portal. */
    error: text("error"),

    createdAt,
    updatedAt,
    deletedAt,
  },
  (table) => [
    uniqueIndex("client_mockup_sets_consultation_key_idx").on(
      table.consultationKey,
    ),
    index("client_mockup_sets_status_idx").on(table.status),
  ],
);
