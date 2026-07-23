import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { clientLeads, type ClientLeadFeature } from "./client-leads.js";
import { leadProposalStatusEnum } from "./enums.js";
import { createdAt, deletedAt, updatedAt } from "./helpers.js";
import { users } from "./users.js";

/**
 * The authored body of one proposal version.
 *
 * Stored as jsonb rather than 11 columns because it is a document the editor
 * owns end-to-end: it is never queried field-by-field, never filtered on, and
 * its section list is expected to change as the editor gains sections. `title`
 * and `status` are NOT in here — they are columns, because the proposal library
 * searches, sorts and filters on them.
 *
 * `features` reuses ClientLeadFeature: a proposal's feature table is a snapshot
 * of the lead's features taken when the version was created, editable from then
 * on independently of the lead. Same shape, so no mapping layer exists.
 */
export type LeadProposalContent = {
  executiveSummary: string;
  scopeOfWork: string[];
  deliverables: string[];
  timeline: string;
  teamStructure: string;
  assumptions: string;
  risks: string[];
  pricingNotes: string;
  termsAndConditions: string;
  features: ClientLeadFeature[];
};

/**
 * Versioned proposals for a client lead — the persistence the Proposal Editor
 * previously lacked (drafts lived in localStorage; see proposal-draft.store.ts).
 *
 * One lead has many versions. Versions are immutable in number only: the body
 * of any version stays editable, and `version_number` never repeats for a lead,
 * including after a draft is soft-deleted — the unique index is what guarantees
 * two concurrent "Create New Version" clicks cannot both claim V3.
 *
 * No organizationId, matching `client_leads`: a proposal inherits its lead's
 * tenancy, and leads are deliberately tenant-independent (see that table).
 */
export const leadProposals = pgTable(
  "lead_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    leadId: uuid("lead_id")
      .notNull()
      .references(() => clientLeads.id, { onDelete: "cascade" }),

    /** 1-based, per lead. Assigned by the service as MAX + 1 inside a transaction. */
    versionNumber: integer("version_number").notNull(),

    /** Mirrored from content authoring so the library can search and sort on it. */
    title: varchar("title", { length: 255 }).notNull(),

    status: leadProposalStatusEnum("status").notNull().default("DRAFT"),

    proposalJson: jsonb("proposal_json").$type<LeadProposalContent>().notNull(),

    /**
     * Reserved for server-side export storage. Export currently runs entirely in
     * the browser (pdfmake / docx), so nothing writes these yet — they stay null
     * rather than holding a path to a file that was never uploaded anywhere.
     */
    pdfPath: text("pdf_path"),
    docxPath: text("docx_path"),

    /** Internal note about this version — never rendered into the client document. */
    notes: text("notes"),

    /** Nullable so deleting a user preserves the proposal's history. */
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt,
    updatedAt,
    deletedAt,
  },
  (table) => [
    uniqueIndex("lead_proposals_lead_version_uidx").on(
      table.leadId,
      table.versionNumber,
    ),
    index("lead_proposals_lead_id_idx").on(table.leadId),
    index("lead_proposals_status_idx").on(table.status),
    index("lead_proposals_updated_at_idx").on(table.updatedAt),
  ],
);
