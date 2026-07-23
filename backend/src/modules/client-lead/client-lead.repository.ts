import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  isNull,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import { clientLeads } from "../../db/schema/index.js";
import type { CreateClientLeadInput } from "./client-lead.validation.js";

export type ClientLeadRecord = typeof clientLeads.$inferSelect;
export type ClientLeadStatus = ClientLeadRecord["status"];

export type ListClientLeadsFilters = {
  /** Matched case-insensitively against name, company and email. */
  search?: string;
  status?: ClientLeadStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page: number;
  pageSize: number;
};

/**
 * Shared by the count and page queries so both always see the same filter set —
 * the same split used by FeatureLibraryRepository.
 */
function buildListConditions(
  filters: Omit<ListClientLeadsFilters, "page" | "pageSize">,
): SQL[] {
  const conditions: SQL[] = [isNull(clientLeads.deletedAt)];

  if (filters.search) {
    const term = `%${filters.search}%`;
    const matchesSearch = or(
      ilike(clientLeads.name, term),
      ilike(clientLeads.company, term),
      ilike(clientLeads.email, term),
    );

    if (matchesSearch) {
      conditions.push(matchesSearch);
    }
  }

  if (filters.status) {
    conditions.push(eq(clientLeads.status, filters.status));
  }

  if (filters.dateFrom) {
    conditions.push(gte(clientLeads.createdAt, filters.dateFrom));
  }

  if (filters.dateTo) {
    conditions.push(lte(clientLeads.createdAt, filters.dateTo));
  }

  return conditions;
}

export class ClientLeadRepository {
  async create(
    data: CreateClientLeadInput,
    executor: DbExecutor = db,
  ): Promise<ClientLeadRecord> {
    const [lead] = await executor
      .insert(clientLeads)
      .values({
        name: data.name,
        email: data.email,
        company: data.company ?? null,
        phone: data.phone ?? null,
        whatsapp: data.whatsapp ?? null,
        country: data.country ?? null,
        preferredContactMethod: data.preferredContactMethod,
        notes: data.notes ?? null,
        projectIdea: data.projectIdea,
        consultationTime: data.consultationTime,
        platforms: data.platforms,
        otherPlatform: data.otherPlatform ?? null,
        requirementSummary: data.requirementSummary,
        features: data.features,
        estimate: data.estimate,
      })
      .returning();

    if (!lead) {
      throw new Error("Failed to create client lead");
    }

    return lead;
  }

  /**
   * No organizationId parameter, unlike every other list method in the codebase:
   * client_leads is intentionally tenant-independent (see the table definition),
   * so there is nothing to scope by here.
   */
  async countAll(
    filters: Omit<ListClientLeadsFilters, "page" | "pageSize">,
    executor: DbExecutor = db,
  ): Promise<number> {
    const conditions = buildListConditions(filters);

    const [result] = await executor
      .select({ value: count() })
      .from(clientLeads)
      .where(and(...conditions));

    return Number(result?.value ?? 0);
  }

  async findMany(
    filters: ListClientLeadsFilters,
    executor: DbExecutor = db,
  ): Promise<ClientLeadRecord[]> {
    const conditions = buildListConditions(filters);
    const offset = (filters.page - 1) * filters.pageSize;

    return executor
      .select()
      .from(clientLeads)
      .where(and(...conditions))
      // Newest first. id is a stable tiebreaker so rows can't shuffle between
      // pages when several leads share a createdAt timestamp.
      .orderBy(desc(clientLeads.createdAt), desc(clientLeads.id))
      .limit(filters.pageSize)
      .offset(offset);
  }

  async findById(
    leadId: string,
    executor: DbExecutor = db,
  ): Promise<ClientLeadRecord | null> {
    const [lead] = await executor
      .select()
      .from(clientLeads)
      .where(and(eq(clientLeads.id, leadId), isNull(clientLeads.deletedAt)))
      .limit(1);

    return lead ?? null;
  }
}

export const clientLeadRepository = new ClientLeadRepository();
