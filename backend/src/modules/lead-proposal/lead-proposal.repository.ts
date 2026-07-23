import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  max,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import {
  auditLogs,
  clientLeads,
  leadProposals,
  users,
} from "../../db/schema/index.js";
import type { LeadProposalContent } from "../../db/schema/lead-proposals.js";
import {
  EDITABLE_STATUS,
  LEAD_PROPOSAL_AUDIT,
  type VersionReason,
} from "./lead-proposal.constants.js";
import type { ListLeadProposalsQuery } from "./lead-proposal.validation.js";

export type LeadProposalRecord = typeof leadProposals.$inferSelect;
export type LeadProposalStatus = LeadProposalRecord["status"];

export type CreateLeadProposalData = {
  leadId: string;
  versionNumber: number;
  title: string;
  proposalJson: LeadProposalContent;
  notes: string | null;
  createdBy: string | null;
};

export type UpdateLeadProposalData = {
  title?: string;
  proposalJson?: LeadProposalContent;
  notes?: string | null;
  status?: LeadProposalStatus;
};

/**
 * A library row: the proposal joined to the client it belongs to and the user
 * who created it. Both are joined here rather than fetched per row by the
 * service — the library renders Client and Created By in every row.
 */
export type LeadProposalWithContext = {
  proposal: LeadProposalRecord;
  leadName: string;
  leadCompany: string | null;
  createdByName: string | null;
};

export type ListLeadProposalsFilters = Pick<
  ListLeadProposalsQuery,
  "search" | "status" | "leadId" | "page" | "pageSize" | "sortBy" | "sortDir"
>;

/** Shared by the count and page queries so both always see the same filter set. */
function buildListConditions(
  filters: Omit<ListLeadProposalsFilters, "page" | "pageSize" | "sortBy" | "sortDir">,
): SQL[] {
  const conditions: SQL[] = [
    isNull(leadProposals.deletedAt),
    isNull(clientLeads.deletedAt),
  ];

  if (filters.search) {
    const term = `%${filters.search}%`;
    const matchesSearch = or(
      ilike(leadProposals.title, term),
      ilike(clientLeads.name, term),
      ilike(clientLeads.company, term),
    );

    if (matchesSearch) {
      conditions.push(matchesSearch);
    }
  }

  if (filters.status) {
    conditions.push(eq(leadProposals.status, filters.status));
  }

  if (filters.leadId) {
    conditions.push(eq(leadProposals.leadId, filters.leadId));
  }

  return conditions;
}

const SORT_COLUMNS = {
  updatedAt: leadProposals.updatedAt,
  createdAt: leadProposals.createdAt,
  title: leadProposals.title,
} as const;

export class LeadProposalRepository {
  async runInTransaction<T>(
    callback: (tx: DbExecutor) => Promise<T>,
  ): Promise<T> {
    return db.transaction(async (tx) => callback(tx));
  }

  /**
   * Highest version number ever used for this lead, including soft-deleted rows.
   * Deleting V2 must not let a later version reclaim the number — the unique
   * index would reject it, and the history would read as if V2 changed identity.
   */
  async findMaxVersionNumber(
    leadId: string,
    executor: DbExecutor = db,
  ): Promise<number> {
    const [result] = await executor
      .select({ value: max(leadProposals.versionNumber) })
      .from(leadProposals)
      .where(eq(leadProposals.leadId, leadId));

    return Number(result?.value ?? 0);
  }

  async create(
    data: CreateLeadProposalData,
    executor: DbExecutor = db,
  ): Promise<LeadProposalRecord> {
    const [proposal] = await executor
      .insert(leadProposals)
      .values(data)
      .returning();

    if (!proposal) {
      throw new Error("Failed to create lead proposal");
    }

    return proposal;
  }

  async findById(
    proposalId: string,
    executor: DbExecutor = db,
  ): Promise<LeadProposalRecord | null> {
    const [proposal] = await executor
      .select()
      .from(leadProposals)
      .where(
        and(eq(leadProposals.id, proposalId), isNull(leadProposals.deletedAt)),
      )
      .limit(1);

    return proposal ?? null;
  }

  /** Detail read for the editor — carries the client/author context the header shows. */
  async findByIdWithContext(
    proposalId: string,
    executor: DbExecutor = db,
  ): Promise<LeadProposalWithContext | null> {
    const [row] = await executor
      .select({
        proposal: leadProposals,
        leadName: clientLeads.name,
        leadCompany: clientLeads.company,
        createdByName: users.fullName,
      })
      .from(leadProposals)
      .innerJoin(clientLeads, eq(leadProposals.leadId, clientLeads.id))
      .leftJoin(users, eq(leadProposals.createdBy, users.id))
      .where(
        and(eq(leadProposals.id, proposalId), isNull(leadProposals.deletedAt)),
      )
      .limit(1);

    return row ?? null;
  }

  /** Every live version of one lead, newest version first. */
  async findManyByLeadId(
    leadId: string,
    executor: DbExecutor = db,
  ): Promise<LeadProposalWithContext[]> {
    return executor
      .select({
        proposal: leadProposals,
        leadName: clientLeads.name,
        leadCompany: clientLeads.company,
        createdByName: users.fullName,
      })
      .from(leadProposals)
      .innerJoin(clientLeads, eq(leadProposals.leadId, clientLeads.id))
      .leftJoin(users, eq(leadProposals.createdBy, users.id))
      .where(
        and(eq(leadProposals.leadId, leadId), isNull(leadProposals.deletedAt)),
      )
      .orderBy(desc(leadProposals.versionNumber));
  }

  async countAll(
    filters: Omit<ListLeadProposalsFilters, "page" | "pageSize" | "sortBy" | "sortDir">,
    executor: DbExecutor = db,
  ): Promise<number> {
    const [result] = await executor
      .select({ value: count() })
      .from(leadProposals)
      .innerJoin(clientLeads, eq(leadProposals.leadId, clientLeads.id))
      .where(and(...buildListConditions(filters)));

    return Number(result?.value ?? 0);
  }

  async findMany(
    filters: ListLeadProposalsFilters,
    executor: DbExecutor = db,
  ): Promise<LeadProposalWithContext[]> {
    const conditions = buildListConditions(filters);
    const offset = (filters.page - 1) * filters.pageSize;
    const sortColumn = SORT_COLUMNS[filters.sortBy];
    const direction = filters.sortDir === "asc" ? asc : desc;

    return executor
      .select({
        proposal: leadProposals,
        leadName: clientLeads.name,
        leadCompany: clientLeads.company,
        createdByName: users.fullName,
      })
      .from(leadProposals)
      .innerJoin(clientLeads, eq(leadProposals.leadId, clientLeads.id))
      .leftJoin(users, eq(leadProposals.createdBy, users.id))
      .where(and(...conditions))
      // id is a stable tiebreaker so rows can't shuffle between pages when
      // several proposals share a sort value.
      .orderBy(direction(sortColumn), desc(leadProposals.id))
      .limit(filters.pageSize)
      .offset(offset);
  }

  /**
   * Partial update. Returns null when no live row matched so the service can
   * raise a 404 rather than a generic failure.
   */
  async update(
    proposalId: string,
    data: UpdateLeadProposalData,
    executor: DbExecutor = db,
  ): Promise<LeadProposalRecord | null> {
    const [proposal] = await executor
      .update(leadProposals)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(eq(leadProposals.id, proposalId), isNull(leadProposals.deletedAt)),
      )
      .returning();

    return proposal ?? null;
  }

  /** Soft delete, matching every other deletable entity in this schema. */
  async softDelete(
    proposalId: string,
    executor: DbExecutor = db,
  ): Promise<boolean> {
    const [proposal] = await executor
      .update(leadProposals)
      .set({ deletedAt: new Date() })
      .where(
        and(eq(leadProposals.id, proposalId), isNull(leadProposals.deletedAt)),
      )
      .returning({ id: leadProposals.id });

    return Boolean(proposal);
  }

  /**
   * Records a version fork in `audit_logs`.
   *
   * `before` carries the source version, `after` the destination plus the
   * reason — the shape a future activity feed or version-compare view needs,
   * stored in the table the schema already provides for it. Writes go in the
   * same transaction as the insert, so a version can never exist without its
   * provenance.
   */
  async recordVersionCreated(
    entry: {
      organizationId: string;
      actorId: string | null;
      leadId: string;
      source: {
        id: string;
        versionNumber: number;
        status: LeadProposalStatus;
      } | null;
      destination: { id: string; versionNumber: number };
      reason: VersionReason;
    },
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor.insert(auditLogs).values({
      organizationId: entry.organizationId,
      actorId: entry.actorId,
      action: LEAD_PROPOSAL_AUDIT.ACTION_VERSION_CREATED,
      entityType: LEAD_PROPOSAL_AUDIT.ENTITY_TYPE,
      entityId: entry.destination.id,
      before: entry.source
        ? {
            proposalId: entry.source.id,
            versionNumber: entry.source.versionNumber,
            status: entry.source.status,
          }
        : null,
      after: {
        leadId: entry.leadId,
        proposalId: entry.destination.id,
        versionNumber: entry.destination.versionNumber,
        status: EDITABLE_STATUS,
        reason: entry.reason,
      },
    });
  }

  /**
   * Every live version of the given leads, newest version first.
   *
   * Backs the library's per-client roll-up: the page of leads is resolved first,
   * then their versions are fetched in this one query and reduced in the
   * service by the same function that builds a single lead's summary.
   */
  async findManyByLeadIds(
    leadIds: string[],
    executor: DbExecutor = db,
  ): Promise<LeadProposalWithContext[]> {
    if (leadIds.length === 0) {
      return [];
    }

    return executor
      .select({
        proposal: leadProposals,
        leadName: clientLeads.name,
        leadCompany: clientLeads.company,
        createdByName: users.fullName,
      })
      .from(leadProposals)
      .innerJoin(clientLeads, eq(leadProposals.leadId, clientLeads.id))
      .leftJoin(users, eq(leadProposals.createdBy, users.id))
      .where(
        and(
          isNull(leadProposals.deletedAt),
          sql`${leadProposals.leadId} = ANY(${sql.param(leadIds)}::uuid[])`,
        ),
      )
      .orderBy(desc(leadProposals.versionNumber));
  }

  /**
   * One entry per lead that has at least one live proposal, most recently
   * touched first — the page the library's "By client" view walks.
   */
  async findLeadPage(
    filters: ListLeadProposalsFilters,
    executor: DbExecutor = db,
  ): Promise<string[]> {
    const conditions = buildListConditions(filters);
    const offset = (filters.page - 1) * filters.pageSize;

    const rows = await executor
      .select({
        leadId: leadProposals.leadId,
        lastTouched: max(leadProposals.updatedAt),
      })
      .from(leadProposals)
      .innerJoin(clientLeads, eq(leadProposals.leadId, clientLeads.id))
      .where(and(...conditions))
      .groupBy(leadProposals.leadId)
      .orderBy(desc(max(leadProposals.updatedAt)))
      .limit(filters.pageSize)
      .offset(offset);

    return rows.map((row) => row.leadId);
  }

  /** Number of distinct leads matching the filters — the roll-up view's total. */
  async countLeads(
    filters: Omit<ListLeadProposalsFilters, "page" | "pageSize" | "sortBy" | "sortDir">,
    executor: DbExecutor = db,
  ): Promise<number> {
    const rows = await executor
      .selectDistinct({ leadId: leadProposals.leadId })
      .from(leadProposals)
      .innerJoin(clientLeads, eq(leadProposals.leadId, clientLeads.id))
      .where(and(...buildListConditions(filters)));

    return rows.length;
  }

  /**
   * Per-lead version counts for the Client Requests list, in one grouped query
   * rather than N queries — used to badge how many proposals a lead has.
   */
  async countByLeadIds(
    leadIds: string[],
    executor: DbExecutor = db,
  ): Promise<Map<string, number>> {
    if (leadIds.length === 0) {
      return new Map();
    }

    const rows = await executor
      .select({ leadId: leadProposals.leadId, value: count() })
      .from(leadProposals)
      .where(
        and(
          isNull(leadProposals.deletedAt),
          sql`${leadProposals.leadId} = ANY(${sql.param(leadIds)}::uuid[])`,
        ),
      )
      .groupBy(leadProposals.leadId);

    return new Map(rows.map((row) => [row.leadId, Number(row.value)]));
  }
}

export const leadProposalRepository = new LeadProposalRepository();
