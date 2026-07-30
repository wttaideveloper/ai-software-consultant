import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import { normalizeTechStack } from "../tech-stack/tech-stack.engine.js";
import type {
  ClientLeadDetailDto,
  ClientLeadListItemDto,
  ClientLeadResponseDto,
  PaginatedClientLeadsDto,
} from "./client-lead.dto.js";
import {
  clientLeadRepository,
  type ClientLeadRecord,
} from "./client-lead.repository.js";
import type {
  CreateClientLeadInput,
  ListClientLeadsQuery,
  UpdateClientLeadInput,
} from "./client-lead.validation.js";

function toListItemDto(lead: ClientLeadRecord): ClientLeadListItemDto {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    phone: lead.phone,
    consultationMode: lead.consultationMode,
    consultationTime: lead.consultationTime,
    platforms: lead.platforms,
    otherPlatform: lead.otherPlatform,
    projectIdea: lead.projectIdea,
    status: lead.status,
    createdAt: lead.createdAt,
  };
}

/** Builds on toListItemDto so the shared ten fields are mapped in exactly one place. */
function toDetailDto(lead: ClientLeadRecord): ClientLeadDetailDto {
  return {
    ...toListItemDto(lead),
    whatsapp: lead.whatsapp,
    country: lead.country,
    preferredContactMethod: lead.preferredContactMethod,
    notes: lead.notes,
    // projectIdea comes from toListItemDto — it is a list column now.
    requirementSummary: lead.requirementSummary,
    features: lead.features,
    estimate: lead.estimate,
    // Leads submitted before the technology engine shipped hold a flat string[];
    // this categorises them on the way out, so the Admin renders every lead
    // identically without the stored rows ever being rewritten.
    techStack: normalizeTechStack(lead.techStack),
    pricing: lead.pricing,
    updatedAt: lead.updatedAt,
  };
}

/**
 * A `dateTo` of 2026-07-23 arrives parsed as midnight, which would exclude every
 * lead created during that day. Widen it to the final millisecond so the filter
 * behaves the way a date picker implies (inclusive of the chosen day).
 */
function toEndOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Pure persistence — no AI call here. Saves the visitor's contact details alongside
 * a snapshot of their edited requirement summary, feature list, and estimate, so a
 * future Admin Portal lead inbox can review the full context without the client
 * flow having to change.
 */
export class ClientLeadService {
  async create(input: CreateClientLeadInput): Promise<ClientLeadResponseDto> {
    try {
      /**
       * Canonicalised before it is frozen, so the snapshot is stored deduplicated,
       * categorised and in presentation order regardless of which client bundle
       * submitted it. Normalising only on read would leave the durable record in
       * whatever shape the browser happened to send.
       */
      const lead = await clientLeadRepository.create({
        ...input,
        techStack: normalizeTechStack(input.techStack),
      });
      logger.info(`Client lead created: ${lead.id}`);

      return {
        id: lead.id,
        status: lead.status,
        createdAt: lead.createdAt,
      };
    } catch (error) {
      logger.error(
        `Failed to create client lead: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      throw new AppError(
        "Failed to submit your request. Please try again.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Admin lead inbox. Not organization-scoped — client_leads carries no
   * organizationId (see the table definition), so any authenticated caller
   * holding CRM_READ sees every lead in the system.
   */
  async list(query: ListClientLeadsQuery): Promise<PaginatedClientLeadsDto> {
    const filters = {
      search: query.search,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo ? toEndOfDay(query.dateTo) : undefined,
      page: query.page,
      pageSize: query.pageSize,
    };

    const [total, leads] = await Promise.all([
      clientLeadRepository.countAll(filters),
      clientLeadRepository.findMany(filters),
    ]);

    return {
      items: leads.map(toListItemDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
      },
    };
  }

  /** Full lead for the Lead Details Workspace. Reuses the existing findById. */
  async getById(leadId: string): Promise<ClientLeadDetailDto> {
    const lead = await clientLeadRepository.findById(leadId);

    if (!lead) {
      throw new AppError("Client request not found.", HTTP_STATUS.NOT_FOUND);
    }

    return toDetailDto(lead);
  }

  /**
   * Applies an admin edit (status / requirement summary / feature list) and
   * returns the updated lead, so the client can refresh from the response
   * rather than issuing a second read.
   */
  async update(
    leadId: string,
    input: UpdateClientLeadInput,
  ): Promise<ClientLeadDetailDto> {
    const lead = await clientLeadRepository.update(leadId, input);

    if (!lead) {
      throw new AppError("Client request not found.", HTTP_STATUS.NOT_FOUND);
    }

    logger.info(`Client lead updated: ${lead.id}`);
    return toDetailDto(lead);
  }
}

export const clientLeadService = new ClientLeadService();
