import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import type { ClientLeadResponseDto } from "./client-lead.dto.js";
import { clientLeadRepository } from "./client-lead.repository.js";
import type { CreateClientLeadInput } from "./client-lead.validation.js";

/**
 * Pure persistence — no AI call here. Saves the visitor's contact details alongside
 * a snapshot of their edited requirement summary, feature list, and estimate, so a
 * future Admin Portal lead inbox can review the full context without the client
 * flow having to change.
 */
export class ClientLeadService {
  async create(input: CreateClientLeadInput): Promise<ClientLeadResponseDto> {
    try {
      const lead = await clientLeadRepository.create(input);
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
}

export const clientLeadService = new ClientLeadService();
