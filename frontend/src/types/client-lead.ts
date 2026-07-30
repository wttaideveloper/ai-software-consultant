import type { ConsultationMode } from "./consultation-mode";
import type { TechStackGroup } from "./tech-stack";

/**
 * Admin-side view of a Client Portal submission (the `client_leads` table).
 *
 * The status union mirrors the `client_lead_status` pgEnum exactly. There is no
 * PROPOSAL_SENT member in the database — adding one needs a migration, so it is
 * deliberately absent here rather than being faked in the UI layer.
 */
export const CLIENT_LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "CONVERTED",
  "CLOSED",
] as const;

export type ClientLeadStatus = (typeof CLIENT_LEAD_STATUSES)[number];

/** Row shape returned by GET /api/client-leads — list columns only. */
export type ClientLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  /** Engagement type this request was captured under; older leads default to NEW_PROJECT. */
  consultationMode: ConsultationMode;
  consultationTime: string;
  platforms: string[];
  otherPlatform: string | null;
  /** Free text from the wizard's first step — a lead has no title column, so this is its name. Truncate for display. */
  projectIdea: string;
  status: ClientLeadStatus;
  createdAt: string;
};

export const FEATURE_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type ClientLeadFeaturePriority = (typeof FEATURE_PRIORITIES)[number];

export const FEATURE_COMPLEXITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type ClientLeadFeatureComplexity = (typeof FEATURE_COMPLEXITIES)[number];

/** Snapshot of one feature as the client left it at submission time. */
export type ClientLeadFeature = {
  name: string;
  category: string;
  description: string;
  priority: ClientLeadFeaturePriority;
  complexity: ClientLeadFeatureComplexity;
  included: boolean;
};

export type ClientLeadEstimateBreakdownItem = {
  category: string;
  hours: number;
};

export type ClientLeadEstimate = {
  estimatedHours: number;
  /** Null for a MAINTENANCE engagement — a support arrangement has no delivery date. */
  estimatedWeeks: number | null;
  teamSize: number;
  complexity: ClientLeadFeatureComplexity;
  /** 0–1. Rendered as a percentage. */
  confidence: number;
  assumptions: string[];
  risks: string[];
  breakdown: ClientLeadEstimateBreakdownItem[];
  /** Engagement-specific detail; exactly one is set, and none for a new build. */
  maintenancePlan?: {
    engagementType: string;
    supportHoursPerMonth: number;
    priorityLevel: string;
    suggestedSla: string;
    supportScope: string[];
  } | null;
  migrationPlan?: {
    /** Technologies being migrated away from; absent on plans predating the field. */
    currentStack?: string[];
    phases: Array<{ name: string; description: string; hours: number }>;
    rollbackStrategy: string;
    downtimeEstimate: string;
  } | null;
  enhancementImpact?: {
    impactAnalysis: string[];
    dependencies: string[];
    affectedModules: string[];
  } | null;
};

export type ClientLeadPricingBreakdown = {
  estimatedHours: number;
  hourlyRate: number;
  /**
   * @deprecated Only present on leads quoted before complexity multipliers were
   * removed from the pricing engine. Never written for new leads.
   */
  complexityMultiplier?: number;
  platformMultiplier: number;
  baseCost: number;
  developmentCost: number;
  riskBufferPercentage: number;
  riskBufferAmount: number;
  subtotal: number;
  discountAmount: number;
  discountCapped: boolean;
  taxPercentage: number;
  taxAmount: number;
  finalPrice: number;
};

/**
 * The frozen project cost the client saw at submission. Read-only history — the
 * Admin renders a range from `breakdown.finalPrice` + `currency`, never re-prices.
 * Null for leads submitted before this snapshot existed, or when unpriced.
 */
export type ClientLeadPricing = {
  currency: string;
  currencySymbol: string;
  complexityLevel: string;
  platforms: string[];
  unpricedPlatforms: string[];
  rateBasis: "EXPLICIT" | "ROLE" | "BLENDED";
  breakdown: ClientLeadPricingBreakdown;
};

/** Full lead returned by GET /api/client-leads/:id. */
export type ClientLeadDetail = ClientLead & {
  whatsapp: string | null;
  country: string | null;
  preferredContactMethod: string;
  notes: string | null;
  requirementSummary: string;
  features: ClientLeadFeature[];
  estimate: ClientLeadEstimate;
  /**
   * Recommended technologies the client saw, grouped by category; empty for
   * pre-snapshot leads. The server normalises legacy flat snapshots on read, so
   * this is always grouped on the wire.
   */
  techStack: TechStackGroup[];
  /** Frozen project cost the client saw; null for pre-snapshot leads or unpriced. */
  pricing: ClientLeadPricing | null;
  updatedAt: string;
};

/** Only the three admin-editable fields; contact details and the estimate are immutable. */
export type UpdateClientLeadPayload = {
  status?: ClientLeadStatus;
  requirementSummary?: string;
  features?: ClientLeadFeature[];
};

export type ListClientLeadsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ClientLeadStatus;
  /** ISO date (yyyy-mm-dd). Inclusive. */
  dateFrom?: string;
  /** ISO date (yyyy-mm-dd). Inclusive — the API widens it to end-of-day. */
  dateTo?: string;
};
