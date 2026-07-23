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
  consultationTime: string;
  platforms: string[];
  otherPlatform: string | null;
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
  estimatedWeeks: number;
  teamSize: number;
  complexity: ClientLeadFeatureComplexity;
  /** 0–1. Rendered as a percentage. */
  confidence: number;
  assumptions: string[];
  risks: string[];
  breakdown: ClientLeadEstimateBreakdownItem[];
};

/** Full lead returned by GET /api/client-leads/:id. */
export type ClientLeadDetail = ClientLead & {
  whatsapp: string | null;
  country: string | null;
  preferredContactMethod: string;
  notes: string | null;
  projectIdea: string;
  requirementSummary: string;
  features: ClientLeadFeature[];
  estimate: ClientLeadEstimate;
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
