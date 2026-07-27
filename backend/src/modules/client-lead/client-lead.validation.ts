import { z } from "zod";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../shared/constants/app.js";
import { clientLeadStatusEnum } from "../../db/schema/enums.js";

const featureInputSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  included: z.boolean(),
});

const estimateBreakdownItemSchema = z.object({
  category: z.string().trim().min(1),
  hours: z.number(),
});

const estimateInputSchema = z.object({
  estimatedHours: z.number(),
  estimatedWeeks: z.number(),
  teamSize: z.number(),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(0).max(1),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
  breakdown: z.array(estimateBreakdownItemSchema),
});

/**
 * The Cost Engine breakdown the client was shown. Accepted as-is and frozen — the
 * server never re-prices this at submission, so it is a faithful record of that
 * moment rather than a recalculation.
 */
const pricingBreakdownSchema = z.object({
  estimatedHours: z.number(),
  hourlyRate: z.number(),
  /**
   * @deprecated Optional so both shapes validate: the engine no longer emits it,
   * but a client running cached JS from before the change may still send it.
   * Accepted and ignored rather than rejected.
   */
  complexityMultiplier: z.number().optional(),
  platformMultiplier: z.number(),
  baseCost: z.number(),
  developmentCost: z.number(),
  riskBufferPercentage: z.number(),
  riskBufferAmount: z.number(),
  subtotal: z.number(),
  discountAmount: z.number(),
  discountCapped: z.boolean(),
  taxPercentage: z.number(),
  taxAmount: z.number(),
  finalPrice: z.number(),
});

const pricingSnapshotSchema = z.object({
  currency: z.string(),
  currencySymbol: z.string(),
  complexityLevel: z.string(),
  platforms: z.array(z.string()),
  unpricedPlatforms: z.array(z.string()),
  rateBasis: z.enum(["EXPLICIT", "ROLE", "BLENDED"]),
  breakdown: pricingBreakdownSchema,
});

export const createClientLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  country: z.string().trim().optional(),
  preferredContactMethod: z.enum(["EMAIL", "PHONE", "WHATSAPP"]).default("EMAIL"),
  notes: z.string().trim().optional(),

  projectIdea: z.string().trim().min(1, "Project idea is required"),
  consultationTime: z.string().trim().min(1, "Consultation time is required"),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
  otherPlatform: z.string().trim().optional(),

  requirementSummary: z.string().trim().min(1, "A requirement summary is required"),
  features: z.array(featureInputSchema).min(1, "At least one feature is required"),
  estimate: estimateInputSchema,
  // Snapshot extras: exactly what the client saw. Optional so an older client can
  // still submit; the pricing is captured, never recomputed on the server.
  techStack: z.array(z.string()).optional().default([]),
  pricing: pricingSnapshotSchema.nullable().optional().default(null),
});

export type CreateClientLeadInput = z.infer<typeof createClientLeadSchema>;

/**
 * Admin-side lead inbox query. Follows the project-wide pagination contract
 * (page / pageSize / search) and adds status + created-date filters.
 *
 * Status values are read straight off the pgEnum so this can never drift from
 * the column definition. The enum currently has four members — there is no
 * PROPOSAL_SENT state in the database.
 */
export const listClientLeadsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
    /** Matched against name, company and email. */
    search: z.string().trim().optional(),
    status: z.enum(clientLeadStatusEnum.enumValues).optional(),
    /** Inclusive lower bound on createdAt. */
    dateFrom: z.coerce.date().optional(),
    /** Inclusive upper bound on createdAt — widened to end-of-day in the service. */
    dateTo: z.coerce.date().optional(),
  })
  .refine(
    (value) =>
      !value.dateFrom || !value.dateTo || value.dateFrom <= value.dateTo,
    { message: "dateFrom must be on or before dateTo", path: ["dateFrom"] },
  );

export type ListClientLeadsQuery = z.infer<typeof listClientLeadsQuerySchema>;

export const clientLeadIdParamsSchema = z.object({
  id: z.string().uuid("Client request id must be a valid UUID"),
});

/**
 * Admin edits to a lead. Scoped to exactly the three things the Lead Details
 * Workspace can change — status, the requirement summary, and the feature list.
 *
 * Contact details and the estimate snapshot are deliberately not editable: the
 * estimate is a record of what the client was shown at submission time, and
 * rewriting it would destroy that audit trail.
 *
 * `featureInputSchema` is reused from the create payload above, so an admin
 * cannot store a feature shape the Client Portal could not have produced.
 */
export const updateClientLeadSchema = z
  .object({
    status: z.enum(clientLeadStatusEnum.enumValues).optional(),
    requirementSummary: z
      .string()
      .trim()
      .min(1, "Requirement summary cannot be empty")
      .optional(),
    features: z.array(featureInputSchema).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided",
  );

export type UpdateClientLeadInput = z.infer<typeof updateClientLeadSchema>;
