import type { ConsultationMode } from "../../shared/constants/consultation-mode.js";

export type ConsultationDto = {
  id: string;
  organizationId: string;
  createdBy: string;
  assignedTo: string | null;
  title: string;
  status: string;
  industry: string | null;
  projectType: string | null;
  consultationMode: ConsultationMode;
  budgetRange: string | null;
  timeline: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginationMetaDto = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedConsultationsDto = {
  items: ConsultationDto[];
  meta: PaginationMetaDto;
};
