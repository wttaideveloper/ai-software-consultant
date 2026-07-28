import type { ConsultationMode } from "../../shared/constants/consultation-mode.js";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
} from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import { consultations, users } from "../../db/schema/index.js";

export type ConsultationRecord = typeof consultations.$inferSelect;

export type ListConsultationsFilters = {
  organizationId: string;
  search?: string;
  status?: string;
  assignedTo?: string;
  page: number;
  pageSize: number;
};

export type CreateConsultationData = {
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
};

export type UpdateConsultationData = {
  title?: string;
  industry?: string | null;
  projectType?: string | null;
  consultationMode?: ConsultationMode;
  budgetRange?: string | null;
  timeline?: string | null;
  status?: string;
  assignedTo?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
};

export class ConsultationsRepository {
  async runInTransaction<T>(
    callback: (tx: DbExecutor) => Promise<T>,
  ): Promise<T> {
    return db.transaction(async (tx) => callback(tx));
  }

  private buildListConditions(filters: ListConsultationsFilters) {
    const conditions = [
      eq(consultations.organizationId, filters.organizationId),
      isNull(consultations.deletedAt),
    ];

    if (filters.search) {
      conditions.push(ilike(consultations.title, `%${filters.search}%`));
    }

    if (filters.status) {
      conditions.push(eq(consultations.status, filters.status));
    }

    if (filters.assignedTo) {
      conditions.push(eq(consultations.assignedTo, filters.assignedTo));
    }

    return and(...conditions);
  }

  async countByOrganization(
    filters: Omit<ListConsultationsFilters, "page" | "pageSize">,
    executor: DbExecutor = db,
  ): Promise<number> {
    const [result] = await executor
      .select({ value: count() })
      .from(consultations)
      .where(this.buildListConditions({ ...filters, page: 1, pageSize: 1 }));

    return Number(result?.value ?? 0);
  }

  async findManyByOrganization(
    filters: ListConsultationsFilters,
    executor: DbExecutor = db,
  ): Promise<ConsultationRecord[]> {
    const offset = (filters.page - 1) * filters.pageSize;

    return executor
      .select()
      .from(consultations)
      .where(this.buildListConditions(filters))
      .orderBy(desc(consultations.createdAt), asc(consultations.id))
      .limit(filters.pageSize)
      .offset(offset);
  }

  async findByIdAndOrganization(
    consultationId: string,
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<ConsultationRecord | null> {
    const [consultation] = await executor
      .select()
      .from(consultations)
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(consultations.organizationId, organizationId),
          isNull(consultations.deletedAt),
        ),
      )
      .limit(1);

    return consultation ?? null;
  }

  async create(
    data: CreateConsultationData,
    executor: DbExecutor = db,
  ): Promise<ConsultationRecord> {
    const [consultation] = await executor
      .insert(consultations)
      .values({
        organizationId: data.organizationId,
        createdBy: data.createdBy,
        assignedTo: data.assignedTo,
        title: data.title,
        status: data.status,
        industry: data.industry,
        projectType: data.projectType,
        consultationMode: data.consultationMode,
        budgetRange: data.budgetRange,
        timeline: data.timeline,
      })
      .returning();

    if (!consultation) {
      throw new Error("Failed to create consultation");
    }

    return consultation;
  }

  async update(
    consultationId: string,
    organizationId: string,
    data: UpdateConsultationData,
    executor: DbExecutor = db,
  ): Promise<ConsultationRecord> {
    const [consultation] = await executor
      .update(consultations)
      .set(data)
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(consultations.organizationId, organizationId),
          isNull(consultations.deletedAt),
        ),
      )
      .returning();

    if (!consultation) {
      throw new Error("Failed to update consultation");
    }

    return consultation;
  }

  async softDelete(
    consultationId: string,
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<ConsultationRecord> {
    const [consultation] = await executor
      .update(consultations)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(consultations.id, consultationId),
          eq(consultations.organizationId, organizationId),
          isNull(consultations.deletedAt),
        ),
      )
      .returning();

    if (!consultation) {
      throw new Error("Failed to delete consultation");
    }

    return consultation;
  }

  async findActiveUserInOrganization(
    userId: string,
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<{ id: string } | null> {
    const [user] = await executor
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, userId),
          eq(users.organizationId, organizationId),
          isNull(users.deletedAt),
        ),
      )
      .limit(1);

    return user ?? null;
  }
}

export const consultationsRepository = new ConsultationsRepository();
