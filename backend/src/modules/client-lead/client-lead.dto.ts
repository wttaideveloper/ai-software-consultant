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
 * columns (projectIdea, requirementSummary, features, estimate) — the table
 * never renders them, and a page of 100 leads would otherwise ship a large
 * amount of JSON the client discards. The Lead Details endpoint returns those.
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

  projectIdea: string;
  requirementSummary: string;
  features: ClientLeadFeature[];
  estimate: ClientLeadEstimate;

  updatedAt: Date;
};
