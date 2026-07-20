export type ConsultationStatus = "draft" | "in_progress" | "completed" | "cancelled";

export type Consultation = {
  id: string;
  organizationId: string;
  createdBy: string;
  assignedTo: string | null;
  title: string;
  status: ConsultationStatus;
  industry: string | null;
  projectType: string | null;
  budgetRange: string | null;
  timeline: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type ListConsultationsParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ConsultationStatus;
  assignedTo?: string;
};
