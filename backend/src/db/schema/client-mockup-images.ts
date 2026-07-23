import { index, integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { clientMockupSets } from "./client-mockup-sets.js";
import { createdAt } from "./helpers.js";

/**
 * One concept screen inside a batch: the card's name/description plus a pointer
 * to where the rendered image actually lives.
 *
 * **Image bytes are deliberately not stored here.** `storageKey` is an opaque
 * handle owned by the MockupStorage port (shared/storage/), so swapping the
 * filesystem adapter for S3 later is a storage-layer change and never a schema
 * migration. Storing the provider's own URL was rejected outright: gpt-image-1
 * returns base64 and DALL·E URLs expire within the hour, so a persisted provider
 * URL is a guaranteed broken image.
 */
export const clientMockupImages = pgTable(
  "client_mockup_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    setId: uuid("set_id")
      .notNull()
      .references(() => clientMockupSets.id, { onDelete: "cascade" }),

    /** e.g. "Login", "Restaurant Details" — planned by the text model, not the image model. */
    screenName: varchar("screen_name", { length: 120 }).notNull(),
    description: text("description").notNull(),

    /** Display order, so the gallery reads as a user journey rather than completion order. */
    sortOrder: integer("sort_order").notNull().default(0),

    storageKey: varchar("storage_key", { length: 512 }).notNull(),
    mimeType: varchar("mime_type", { length: 64 }).notNull().default("image/png"),

    createdAt,
  },
  (table) => [index("client_mockup_images_set_id_idx").on(table.setId)],
);
