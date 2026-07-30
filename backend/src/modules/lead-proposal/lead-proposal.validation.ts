import { z } from "zod";
import { leadProposalStatusEnum } from "../../db/schema/enums.js";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../shared/constants/app.js";
import { techStackInputSchema } from "../tech-stack/tech-stack.validation.js";
import { VERSION_REASONS } from "./lead-proposal.constants.js";

/**
 * Feature snapshot carried by a proposal version.
 *
 * Intentionally identical to the Client Portal's feature schema — a proposal's
 * feature table starts as a copy of the lead's, so an admin cannot author a
 * feature shape the rest of the system could not have produced.
 */
const proposalFeatureSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  included: z.boolean(),
});

/**
 * Editable Project Estimate carried by a version. Prefilled from the lead's
 * frozen snapshot on the client, then adjustable per version. Optional so older
 * versions (created before it existed) remain valid and fall back to the lead.
 * Stored inside `proposal_json`, so no column/migration is involved.
 */
const proposalEstimateSchema = z.object({
  currency: z.string(),
  costMin: z.number().nullable(),
  costMax: z.number().nullable(),
  timelineMinWeeks: z.number(),
  timelineMaxWeeks: z.number(),
  estimatedHours: z.number(),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  teamSize: z.number(),
  // Grouped since the technology engine shipped; still accepts the flat list
  // every proposal version authored before then was saved with, so reopening an
  // old version never fails validation.
  techStack: techStackInputSchema,
});

/**
 * The authored body. Every field is required but may be empty — a half-written
 * draft is a legitimate state, so the schema validates shape, not completeness.
 * Only `title` (below) must be non-empty, because it names the version
 * everywhere in the UI.
 */
export const leadProposalContentSchema = z.object({
  executiveSummary: z.string(),
  scopeOfWork: z.array(z.string()),
  deliverables: z.array(z.string()),
  timeline: z.string(),
  teamStructure: z.string(),
  assumptions: z.string(),
  risks: z.array(z.string()),
  pricingNotes: z.string(),
  termsAndConditions: z.string(),
  features: z.array(proposalFeatureSchema),
  projectEstimate: proposalEstimateSchema.optional(),
});

export type LeadProposalContentInput = z.infer<typeof leadProposalContentSchema>;

const titleSchema = z
  .string()
  .trim()
  .min(1, "Proposal title is required")
  .max(255, "Proposal title must be at most 255 characters");

/**
 * Creating a version, in either of the two ways the UI offers:
 *
 * - "Create New Version" sends `content`, built client-side by
 *   buildProposalDraft() from the lead's summary / features / estimate. That
 *   generator is pure and already exists; re-implementing it server-side would
 *   duplicate it and let the two copies drift.
 * - "Duplicate" sends `sourceProposalId` instead, and the server copies that
 *   version's body — no round-trip, and the copy is taken inside the same
 *   transaction that assigns the version number.
 */
export const createLeadProposalSchema = z
  .object({
    title: titleSchema.optional(),
    content: leadProposalContentSchema.optional(),
    sourceProposalId: z.string().uuid("Source proposal id must be a valid UUID").optional(),
    notes: z.string().trim().max(2000).optional(),
    /**
     * Provenance for the audit trail. Only the reasons a client can legitimately
     * originate are accepted — EDIT_READY / EDIT_LOCKED are derived server-side
     * from the real status in openForEditing(), never taken from a request.
     */
    reason: z
      .enum([
        VERSION_REASONS.MANUAL,
        VERSION_REASONS.DUPLICATED,
        VERSION_REASONS.IMPORTED,
      ])
      .optional(),
  })
  .refine((value) => Boolean(value.content) || Boolean(value.sourceProposalId), {
    message: "Provide either content or sourceProposalId",
    path: ["content"],
  })
  .refine((value) => Boolean(value.sourceProposalId) || Boolean(value.title), {
    message: "Proposal title is required",
    path: ["title"],
  });

/**
 * Regenerate carries the freshly generated body. The server decides the version
 * number, the DRAFT status and the reason — the client only supplies content.
 */
export const regenerateLeadProposalSchema = z.object({
  title: titleSchema,
  content: leadProposalContentSchema,
});

export type RegenerateLeadProposalInput = z.infer<
  typeof regenerateLeadProposalSchema
>;

export type CreateLeadProposalInput = z.infer<typeof createLeadProposalSchema>;

/**
 * Body edits. Status is deliberately absent — it moves through its own endpoint
 * so a lifecycle transition is never an accidental side effect of a save.
 */
export const updateLeadProposalSchema = z
  .object({
    title: titleSchema.optional(),
    content: leadProposalContentSchema.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided",
  );

export type UpdateLeadProposalInput = z.infer<typeof updateLeadProposalSchema>;

export const updateLeadProposalStatusSchema = z.object({
  status: z.enum(leadProposalStatusEnum.enumValues),
});

export type UpdateLeadProposalStatusInput = z.infer<
  typeof updateLeadProposalStatusSchema
>;

export const leadProposalIdParamsSchema = z.object({
  id: z.string().uuid("Proposal id must be a valid UUID"),
});

export const leadIdParamsSchema = z.object({
  leadId: z.string().uuid("Client request id must be a valid UUID"),
});

/**
 * Proposal library query — every proposal across every lead. Follows the
 * project-wide pagination contract and adds the library's own filters/sort.
 */
export const listLeadProposalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  /** Matched against proposal title and the client's name/company. */
  search: z.string().trim().optional(),
  status: z.enum(leadProposalStatusEnum.enumValues).optional(),
  leadId: z.string().uuid().optional(),
  sortBy: z.enum(["updatedAt", "createdAt", "title"]).default("updatedAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  /**
   * "versions" (default) lists one row per proposal version; "clients" lists one
   * row per client with its latest / working-draft / client-version roll-up.
   * Same filters either way — only the grain differs.
   */
  groupBy: z.enum(["versions", "clients"]).default("versions"),
});

export type ListLeadProposalsQuery = z.infer<typeof listLeadProposalsQuerySchema>;
