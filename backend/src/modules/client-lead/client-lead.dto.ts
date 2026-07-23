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
