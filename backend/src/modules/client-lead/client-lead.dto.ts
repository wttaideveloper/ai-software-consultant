import type {
  ClientLeadEstimate,
  ClientLeadFeature,
} from "../../db/schema/client-leads.js";
import type { ClientLeadStatus } from "./client-lead.repository.js";

export type ClientLeadResponseDto = {
  id: string;
  status: string;
  createdAt: Date;
};

export type PaginationMetaDto = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * Row shape for the Admin lead inbox. Deliberately excludes the heavy snapshot
 * columns (requirementSummary, features, estimate) — the table never renders
 * them, and a page of 100 leads would otherwise ship a large amount of JSON the
 * client discards. The Lead Details endpoint returns those.
 *
 * `projectIdea` is the one snapshot column that is included: it is the only
 * human-readable name a lead has (there is no title column), and both the lead
 * inbox and the Sales Dashboard need a "Project" column. It is a short
 * free-text field, unlike the three above, and callers truncate it for display.
 */
export type ClientLeadListItemDto = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  consultationTime: string;
  platforms: string[];
  otherPlatform: string | null;
  projectIdea: string;
  status: ClientLeadStatus;
  createdAt: Date;
};

export type PaginatedClientLeadsDto = {
  items: ClientLeadListItemDto[];
  meta: PaginationMetaDto;
};

/**
 * Full lead for the Lead Details Workspace — the list row plus the snapshot
 * columns the workspace renders.
 *
 * Extends ClientLeadListItemDto rather than restating its ten fields, and the
 * feature/estimate shapes are imported from the table definition so this DTO
 * can never drift from the jsonb columns it describes.
 */
export type ClientLeadDetailDto = ClientLeadListItemDto & {
  whatsapp: string | null;
  country: string | null;
  preferredContactMethod: string;
  notes: string | null;

  requirementSummary: string;
  features: ClientLeadFeature[];
  estimate: ClientLeadEstimate;

  updatedAt: Date;
};
