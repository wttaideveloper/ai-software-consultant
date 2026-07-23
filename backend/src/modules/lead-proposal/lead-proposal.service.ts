import { and, eq, isNull } from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import { clientLeads } from "../../db/schema/index.js";
import type { LeadProposalContent } from "../../db/schema/lead-proposals.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import {
  CLIENT_FACING_STATUSES,
  EDITABLE_STATUS,
  VERSION_REASONS,
  type VersionReason,
} from "./lead-proposal.constants.js";
import type {
  LeadProposalDetailDto,
  LeadProposalListItemDto,
  LeadProposalSummaryDto,
  LeadProposalVersionsDto,
  LeadProposalEditSessionDto,
  LeadProposalLeadRollupDto,
  PaginatedLeadProposalRollupsDto,
  PaginatedLeadProposalsDto,
} from "./lead-proposal.dto.js";
import {
  leadProposalRepository,
  type LeadProposalRecord,
  type LeadProposalStatus,
  type LeadProposalWithContext,
} from "./lead-proposal.repository.js";
import type {
  CreateLeadProposalInput,
  ListLeadProposalsQuery,
  UpdateLeadProposalInput,
} from "./lead-proposal.validation.js";

/** Who is performing the action — needed for `createdBy` and the audit row. */
export type ProposalActor = {
  id: string;
  organizationId: string;
};

function toListItemDto(row: LeadProposalWithContext): LeadProposalListItemDto {
  const { proposal } = row;

  return {
    id: proposal.id,
    leadId: proposal.leadId,
    versionNumber: proposal.versionNumber,
    title: proposal.title,
    status: proposal.status,
    notes: proposal.notes,
    pdfPath: proposal.pdfPath,
    docxPath: proposal.docxPath,
    leadName: row.leadName,
    leadCompany: row.leadCompany,
    createdByName: row.createdByName,
    createdAt: proposal.createdAt,
    updatedAt: proposal.updatedAt,
  };
}

/** Builds on toListItemDto so the shared fields are mapped in exactly one place. */
function toDetailDto(row: LeadProposalWithContext): LeadProposalDetailDto {
  return {
    ...toListItemDto(row),
    content: row.proposal.proposalJson,
  };
}

/**
 * Builds the roll-up every surface shares.
 *
 * `items` must arrive newest-version-first, so the first match in each scan is
 * by definition the newest of its kind. One function serves the Lead Details
 * tiles, the editor's history panel and the library's per-client view — the
 * definitions of "working draft" and "client version" exist exactly once.
 */
function buildSummary(items: LeadProposalListItemDto[]): LeadProposalSummaryDto {
  const newestWith = (predicate: (item: LeadProposalListItemDto) => boolean) =>
    items.find(predicate) ?? null;

  return {
    total: items.length,
    latest: items[0] ?? null,
    /** The version an admin is currently working on, if any. */
    workingDraft: newestWith((item) => item.status === EDITABLE_STATUS),
    /** The newest version the client has actually seen. */
    clientVersion: newestWith((item) =>
      CLIENT_FACING_STATUSES.includes(item.status),
    ),
    latestSent: newestWith((item) => item.status === "SENT"),
    latestAccepted: newestWith((item) => item.status === "ACCEPTED"),
  };
}

/** Rule 2 vs Rule 3 — both fork, but the history should say which happened. */
function reasonForEditing(status: LeadProposalStatus): VersionReason {
  return status === "READY"
    ? VERSION_REASONS.EDIT_READY
    : VERSION_REASONS.EDIT_LOCKED;
}

/**
 * Allowed status moves.
 *
 * A proposal's lifecycle is a real workflow, not a free-form field: a draft the
 * client has never seen cannot jump to ACCEPTED, and an archived version cannot
 * quietly become live again without first returning to DRAFT. ARCHIVED is
 * reachable from everywhere because filing a version away is always valid.
 *
 * This is entirely independent of `client_lead_status` — moving a proposal never
 * touches the lead's sales stage, and vice versa.
 */
const ALLOWED_TRANSITIONS: Record<LeadProposalStatus, LeadProposalStatus[]> = {
  DRAFT: ["READY", "ARCHIVED"],
  READY: ["DRAFT", "SENT", "ARCHIVED"],
  SENT: ["ACCEPTED", "REJECTED", "ARCHIVED"],
  ACCEPTED: ["ARCHIVED"],
  REJECTED: ["DRAFT", "ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export class LeadProposalService {
  /** 404s unless the lead exists and is not soft-deleted. */
  private async assertLeadExists(leadId: string): Promise<void> {
    const [lead] = await db
      .select({ id: clientLeads.id })
      .from(clientLeads)
      .where(and(eq(clientLeads.id, leadId), isNull(clientLeads.deletedAt)))
      .limit(1);

    if (!lead) {
      throw new AppError("Client request not found.", HTTP_STATUS.NOT_FOUND);
    }
  }

  private async getRowOr404(
    proposalId: string,
  ): Promise<LeadProposalWithContext> {
    const row = await leadProposalRepository.findByIdWithContext(proposalId);

    if (!row) {
      throw new AppError("Proposal not found.", HTTP_STATUS.NOT_FOUND);
    }

    return row;
  }

  /**
   * THE single writer for `lead_proposals`. Every version in the system — manual,
   * duplicated, forked by an edit, regenerated or imported — is created here and
   * nowhere else, so version numbering, the DRAFT default and the audit row can
   * never diverge between call sites.
   *
   * The version number is read and written inside one transaction, and the
   * unique index on (lead_id, version_number) is the real guard: if two admins
   * fork the same proposal at the same moment, one transaction wins and the
   * other fails its insert rather than both writing V3.
   */
  private async writeVersion(
    params: {
      leadId: string;
      title: string;
      content: LeadProposalContent;
      notes: string | null;
      source: LeadProposalRecord | null;
      reason: VersionReason;
      actor: ProposalActor;
    },
    executor?: DbExecutor,
  ): Promise<LeadProposalRecord> {
    const run = async (tx: DbExecutor) => {
      const versionNumber =
        (await leadProposalRepository.findMaxVersionNumber(params.leadId, tx)) + 1;

      const created = await leadProposalRepository.create(
        {
          leadId: params.leadId,
          versionNumber,
          title: params.title,
          // Always DRAFT. A new version is by definition unpublished work; the
          // status column is moved only through the status endpoint.
          proposalJson: params.content,
          notes: params.notes,
          createdBy: params.actor.id,
        },
        tx,
      );

      await leadProposalRepository.recordVersionCreated(
        {
          organizationId: params.actor.organizationId,
          actorId: params.actor.id,
          leadId: params.leadId,
          source: params.source
            ? {
                id: params.source.id,
                versionNumber: params.source.versionNumber,
                status: params.source.status,
              }
            : null,
          destination: { id: created.id, versionNumber: created.versionNumber },
          reason: params.reason,
        },
        tx,
      );

      logger.info(
        `Lead proposal version created: lead=${params.leadId} v${created.versionNumber} reason=${params.reason}` +
          (params.source ? ` from v${params.source.versionNumber}` : ""),
      );

      return created;
    };

    return executor
      ? run(executor)
      : leadProposalRepository.runInTransaction(run);
  }

  /**
   * The helper every automatic fork goes through: copies an existing version's
   * title and body into a new DRAFT at the next version number, leaving the
   * source untouched.
   *
   * Used by Rule 2 (editing a READY proposal), Rule 3 (editing a locked one) and
   * the explicit Duplicate action. The caller supplies the reason; it never
   * supplies the version number, the status or the content.
   */
  async createNextVersionFromExisting(
    sourceProposalId: string,
    reason: VersionReason,
    actor: ProposalActor,
    options: { title?: string } = {},
  ): Promise<LeadProposalDetailDto> {
    const created = await leadProposalRepository.runInTransaction(async (tx) => {
      const source = await leadProposalRepository.findById(sourceProposalId, tx);

      if (!source) {
        throw new AppError(
          "The proposal being copied no longer exists.",
          HTTP_STATUS.NOT_FOUND,
        );
      }

      return this.writeVersion(
        {
          leadId: source.leadId,
          title: options.title?.trim() || source.title,
          content: source.proposalJson,
          notes: source.notes,
          source,
          reason,
          actor,
        },
        tx,
      );
    });

    return this.getById(created.id);
  }

  /**
   * Creating a version from supplied content: "Create New Version" (prefilled
   * from the lead), the localStorage import, or an explicit Duplicate — which
   * delegates to createNextVersionFromExisting so copying lives in one place.
   */
  async createVersion(
    leadId: string,
    input: CreateLeadProposalInput,
    actor: ProposalActor,
  ): Promise<LeadProposalDetailDto> {
    await this.assertLeadExists(leadId);

    if (input.sourceProposalId && !input.content) {
      const source = await leadProposalRepository.findById(input.sourceProposalId);

      if (source && source.leadId !== leadId) {
        throw new AppError(
          "A proposal can only be duplicated within the same client request.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      return this.createNextVersionFromExisting(
        input.sourceProposalId,
        input.reason ?? VERSION_REASONS.DUPLICATED,
        actor,
        { title: input.title },
      );
    }

    if (!input.content || !input.title) {
      throw new AppError(
        "Proposal title and content are required.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const source = input.sourceProposalId
      ? await leadProposalRepository.findById(input.sourceProposalId)
      : null;

    const created = await this.writeVersion({
      leadId,
      title: input.title.trim(),
      content: input.content,
      notes: input.notes ?? null,
      source,
      reason: input.reason ?? VERSION_REASONS.MANUAL,
      actor,
    });

    return this.getById(created.id);
  }

  /**
   * Applies the editing rules and hands back the version the admin should
   * actually be editing.
   *
   * The client says "I want to edit this"; the server decides what that means:
   *  - Rule 1, DRAFT → the same version, untouched (`created: false`)
   *  - Rule 2, READY → a new DRAFT copy
   *  - Rule 3, SENT/ACCEPTED/REJECTED/ARCHIVED → a new DRAFT copy
   *
   * Deciding here rather than in the UI is the point: no caller can edit a
   * locked version by skipping a check, and the reason recorded in the audit
   * trail is derived from the real status rather than trusted from the client.
   */
  async openForEditing(
    proposalId: string,
    actor: ProposalActor,
  ): Promise<LeadProposalEditSessionDto> {
    const { proposal } = await this.getRowOr404(proposalId);

    if (proposal.status === EDITABLE_STATUS) {
      return {
        proposal: await this.getById(proposalId),
        created: false,
        source: null,
      };
    }

    const created = await this.createNextVersionFromExisting(
      proposalId,
      reasonForEditing(proposal.status),
      actor,
    );

    return {
      proposal: created,
      created: true,
      source: {
        id: proposal.id,
        versionNumber: proposal.versionNumber,
        status: proposal.status,
      },
    };
  }

  /**
   * Regenerate — always forks, never overwrites, whatever the source status is.
   *
   * The replacement body is built client-side by buildProposalDraft() from the
   * lead's current summary, features and estimate (the same pure generator the
   * editor uses); this method is what makes the result a new version rather than
   * an overwrite of the one on screen.
   */
  async regenerate(
    proposalId: string,
    input: { title: string; content: LeadProposalContent },
    actor: ProposalActor,
  ): Promise<LeadProposalDetailDto> {
    const created = await leadProposalRepository.runInTransaction(async (tx) => {
      const source = await leadProposalRepository.findById(proposalId, tx);

      if (!source) {
        throw new AppError("Proposal not found.", HTTP_STATUS.NOT_FOUND);
      }

      return this.writeVersion(
        {
          leadId: source.leadId,
          title: input.title.trim() || source.title,
          content: input.content,
          notes: source.notes,
          source,
          reason: VERSION_REASONS.REGENERATED,
          actor,
        },
        tx,
      );
    });

    return this.getById(created.id);
  }

  async listByLead(leadId: string): Promise<LeadProposalVersionsDto> {
    await this.assertLeadExists(leadId);

    const rows = await leadProposalRepository.findManyByLeadId(leadId);
    const items = rows.map(toListItemDto);

    return { items, summary: buildSummary(items) };
  }

  /** Proposal library — every version across every lead. */
  async list(query: ListLeadProposalsQuery): Promise<PaginatedLeadProposalsDto> {
    const filters = {
      search: query.search,
      status: query.status,
      leadId: query.leadId,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    };

    const [total, rows] = await Promise.all([
      leadProposalRepository.countAll(filters),
      leadProposalRepository.findMany(filters),
    ]);

    return {
      items: rows.map(toListItemDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
      },
    };
  }

  /**
   * Library, grouped by client: one row per lead with its latest version,
   * current working draft and current client version.
   *
   * Three queries, not N+1 — the page of leads is resolved first, then all their
   * versions come back in one call and are reduced by buildSummary(), the same
   * function the per-lead view uses.
   */
  async listLeadRollups(
    query: ListLeadProposalsQuery,
  ): Promise<PaginatedLeadProposalRollupsDto> {
    const filters = {
      search: query.search,
      status: query.status,
      leadId: query.leadId,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    };

    const [total, leadIds] = await Promise.all([
      leadProposalRepository.countLeads(filters),
      leadProposalRepository.findLeadPage(filters),
    ]);

    const rows = await leadProposalRepository.findManyByLeadIds(leadIds);
    const byLead = new Map<string, LeadProposalListItemDto[]>();

    for (const row of rows) {
      const items = byLead.get(row.proposal.leadId) ?? [];
      items.push(toListItemDto(row));
      byLead.set(row.proposal.leadId, items);
    }

    // Ordered by the lead page, which already carries "most recently touched".
    const items: LeadProposalLeadRollupDto[] = leadIds.flatMap((leadId) => {
      const versions = byLead.get(leadId);
      if (!versions || versions.length === 0) return [];

      const first = versions[0]!;
      return [
        {
          leadId,
          leadName: first.leadName,
          leadCompany: first.leadCompany,
          summary: buildSummary(versions),
        },
      ];
    });

    return {
      items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
      },
    };
  }

  async getById(proposalId: string): Promise<LeadProposalDetailDto> {
    return toDetailDto(await this.getRowOr404(proposalId));
  }

  /**
   * Body edit — DRAFT only.
   *
   * Every other status is immutable: a sent proposal is the record of what the
   * client received, and an archived one is history. Callers that want to change
   * a locked version go through openForEditing(), which forks it. This is the
   * backstop that makes "old versions are never lost" true regardless of UI.
   */
  async update(
    proposalId: string,
    input: UpdateLeadProposalInput,
  ): Promise<LeadProposalDetailDto> {
    const { proposal } = await this.getRowOr404(proposalId);

    if (proposal.status !== EDITABLE_STATUS) {
      throw new AppError(
        `Proposal V${proposal.versionNumber} is ${proposal.status.toLowerCase()} and can no longer be edited. Open it to start a new draft.`,
        HTTP_STATUS.CONFLICT,
      );
    }

    const updated = await leadProposalRepository.update(proposalId, {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.content !== undefined ? { proposalJson: input.content } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });

    if (!updated) {
      throw new AppError("Proposal not found.", HTTP_STATUS.NOT_FOUND);
    }

    logger.info(`Lead proposal updated: ${proposalId}`);
    return this.getById(proposalId);
  }

  /**
   * One endpoint behind every "Mark Ready / Mark Sent / Mark Accepted /
   * Mark Rejected / Archive" action, so the transition rules live in exactly one
   * place instead of being re-checked in five near-identical handlers.
   */
  async changeStatus(
    proposalId: string,
    status: LeadProposalStatus,
  ): Promise<LeadProposalDetailDto> {
    const { proposal } = await this.getRowOr404(proposalId);

    if (proposal.status === status) {
      return this.getById(proposalId);
    }

    if (!ALLOWED_TRANSITIONS[proposal.status].includes(status)) {
      throw new AppError(
        `A ${proposal.status.toLowerCase()} proposal cannot be marked ${status.toLowerCase()}.`,
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const updated = await leadProposalRepository.update(proposalId, { status });

    if (!updated) {
      throw new AppError("Proposal not found.", HTTP_STATUS.NOT_FOUND);
    }

    logger.info(
      `Lead proposal status changed: ${proposalId} ${proposal.status} → ${status}`,
    );

    return this.getById(proposalId);
  }

  /**
   * Drafts only. Anything further along has been shown to a client or acted on,
   * and deleting it would erase what was sent — archive those instead.
   */
  async remove(proposalId: string): Promise<void> {
    const { proposal } = await this.getRowOr404(proposalId);

    if (proposal.status !== "DRAFT") {
      throw new AppError(
        "Only draft proposals can be deleted. Archive this version instead.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const deleted = await leadProposalRepository.softDelete(proposalId);

    if (!deleted) {
      throw new AppError("Proposal not found.", HTTP_STATUS.NOT_FOUND);
    }

    logger.info(`Lead proposal deleted: ${proposalId}`);
  }
}

export const leadProposalService = new LeadProposalService();
