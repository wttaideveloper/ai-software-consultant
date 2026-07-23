import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/index.js";
import { clientLeads } from "../../db/schema/index.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import type {
  LeadProposalDetailDto,
  LeadProposalListItemDto,
  LeadProposalSummaryDto,
  LeadProposalVersionsDto,
  PaginatedLeadProposalsDto,
} from "./lead-proposal.dto.js";
import {
  leadProposalRepository,
  type LeadProposalStatus,
  type LeadProposalWithContext,
} from "./lead-proposal.repository.js";
import type {
  CreateLeadProposalInput,
  ListLeadProposalsQuery,
  UpdateLeadProposalInput,
} from "./lead-proposal.validation.js";

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
 * Which statuses count as "with the client", and in what order of authority.
 * Absent statuses (DRAFT, REJECTED, ARCHIVED) can never be the active proposal.
 */
const ACTIVE_STATUS_PRECEDENCE: Partial<Record<LeadProposalStatus, number>> = {
  ACCEPTED: 3,
  SENT: 2,
  READY: 1,
};

function resolveActive(
  items: LeadProposalListItemDto[],
): LeadProposalListItemDto | null {
  let active: LeadProposalListItemDto | null = null;
  let bestRank = 0;

  for (const item of items) {
    const rank = ACTIVE_STATUS_PRECEDENCE[item.status] ?? 0;
    if (rank === 0) continue;

    // items arrive newest-version-first, so a strict > keeps the newest version
    // when two share the same status.
    if (rank > bestRank) {
      bestRank = rank;
      active = item;
    }
  }

  return active;
}

function buildSummary(items: LeadProposalListItemDto[]): LeadProposalSummaryDto {
  return {
    total: items.length,
    latest: items[0] ?? null,
    active: resolveActive(items),
  };
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
   * Creates the next version for a lead.
   *
   * The version number is read and written inside one transaction, and the
   * unique index on (lead_id, version_number) is the real guard: if two admins
   * click "Create New Version" at the same moment, one transaction wins and the
   * other fails its insert rather than both writing V3.
   */
  async createVersion(
    leadId: string,
    input: CreateLeadProposalInput,
    userId: string,
  ): Promise<LeadProposalDetailDto> {
    await this.assertLeadExists(leadId);

    const created = await leadProposalRepository.runInTransaction(async (tx) => {
      let title = input.title?.trim() ?? "";
      let content = input.content;

      if (input.sourceProposalId) {
        const source = await leadProposalRepository.findById(
          input.sourceProposalId,
          tx,
        );

        if (!source) {
          throw new AppError(
            "The proposal being duplicated no longer exists.",
            HTTP_STATUS.NOT_FOUND,
          );
        }

        if (source.leadId !== leadId) {
          throw new AppError(
            "A proposal can only be duplicated within the same client request.",
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        content = source.proposalJson;
        title = title || source.title;
      }

      if (!content) {
        throw new AppError(
          "Proposal content is required.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const versionNumber =
        (await leadProposalRepository.findMaxVersionNumber(leadId, tx)) + 1;

      return leadProposalRepository.create(
        {
          leadId,
          versionNumber,
          title,
          proposalJson: content,
          notes: input.notes ?? null,
          createdBy: userId,
        },
        tx,
      );
    });

    logger.info(
      `Lead proposal created: lead=${leadId} version=${created.versionNumber} id=${created.id}`,
    );

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

  async getById(proposalId: string): Promise<LeadProposalDetailDto> {
    return toDetailDto(await this.getRowOr404(proposalId));
  }

  /**
   * Body edit. Any version stays editable, including one already sent — the
   * spec is explicit that admins can edit any version, and a version's number
   * and history are what carry the audit story, not immutability of the body.
   */
  async update(
    proposalId: string,
    input: UpdateLeadProposalInput,
  ): Promise<LeadProposalDetailDto> {
    await this.getRowOr404(proposalId);

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
