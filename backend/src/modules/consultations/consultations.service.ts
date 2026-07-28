import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import type {
  ConsultationDto,
  PaginatedConsultationsDto,
} from "./consultations.dto.js";
import {
  consultationsRepository,
  type ConsultationRecord,
} from "./consultations.repository.js";
import type {
  CreateConsultationInput,
  ListConsultationsQuery,
  UpdateConsultationInput,
} from "./consultations.validation.js";

function toConsultationDto(
  consultation: ConsultationRecord,
): ConsultationDto {
  return {
    id: consultation.id,
    organizationId: consultation.organizationId,
    createdBy: consultation.createdBy,
    assignedTo: consultation.assignedTo,
    title: consultation.title,
    status: consultation.status,
    industry: consultation.industry,
    projectType: consultation.projectType,
    consultationMode: consultation.consultationMode,
    budgetRange: consultation.budgetRange,
    timeline: consultation.timeline,
    startedAt: consultation.startedAt,
    completedAt: consultation.completedAt,
    createdAt: consultation.createdAt,
    updatedAt: consultation.updatedAt,
  };
}

export class ConsultationsService {
  private async assertAssigneeInOrganization(
    organizationId: string,
    assignedTo: string | null | undefined,
  ): Promise<void> {
    if (!assignedTo) {
      return;
    }

    const assignee =
      await consultationsRepository.findActiveUserInOrganization(
        assignedTo,
        organizationId,
      );

    if (!assignee) {
      throw new AppError(
        "Assigned user was not found in this organization",
        HTTP_STATUS.BAD_REQUEST,
      );
    }
  }

  async list(
    organizationId: string,
    query: ListConsultationsQuery,
  ): Promise<PaginatedConsultationsDto> {
    const filters = {
      organizationId,
      search: query.search,
      status: query.status,
      assignedTo: query.assignedTo,
      page: query.page,
      pageSize: query.pageSize,
    };

    const [total, items] = await Promise.all([
      consultationsRepository.countByOrganization(filters),
      consultationsRepository.findManyByOrganization(filters),
    ]);

    return {
      items: items.map(toConsultationDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.pageSize),
      },
    };
  }

  async getById(
    organizationId: string,
    consultationId: string,
  ): Promise<ConsultationDto> {
    const consultation =
      await consultationsRepository.findByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    return toConsultationDto(consultation);
  }

  async create(
    organizationId: string,
    createdBy: string,
    input: CreateConsultationInput,
  ): Promise<ConsultationDto> {
    await this.assertAssigneeInOrganization(
      organizationId,
      input.assignedTo,
    );

    const consultation = await consultationsRepository.create({
      organizationId,
      createdBy,
      assignedTo: input.assignedTo ?? null,
      title: input.title,
      status: "draft",
      industry: input.industry ?? null,
      projectType: input.projectType ?? null,
      consultationMode: input.consultationMode,
      budgetRange: input.budgetRange ?? null,
      timeline: input.timeline ?? null,
    });

    logger.info(`Consultation created: ${consultation.id}`);

    return toConsultationDto(consultation);
  }

  async update(
    organizationId: string,
    consultationId: string,
    input: UpdateConsultationInput,
  ): Promise<ConsultationDto> {
    const existing =
      await consultationsRepository.findByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!existing) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    if (existing.status === "completed") {
      throw new AppError(
        "Completed consultations cannot be edited",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    if (input.assignedTo !== undefined) {
      await this.assertAssigneeInOrganization(
        organizationId,
        input.assignedTo,
      );
    }

    const nextStatus = input.status ?? existing.status;
    const startedAt =
      nextStatus === "in_progress" && !existing.startedAt
        ? new Date()
        : undefined;
    const completedAt =
      nextStatus === "completed" && !existing.completedAt
        ? new Date()
        : undefined;

    const consultation = await consultationsRepository.update(
      consultationId,
      organizationId,
      {
        title: input.title,
        industry: input.industry,
        projectType: input.projectType,
        budgetRange: input.budgetRange,
        timeline: input.timeline,
        status: input.status,
        assignedTo: input.assignedTo,
        startedAt,
        completedAt,
      },
    );

    logger.info(`Consultation updated: ${consultation.id}`);

    return toConsultationDto(consultation);
  }

  async remove(
    organizationId: string,
    consultationId: string,
  ): Promise<void> {
    const existing =
      await consultationsRepository.findByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!existing) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    await consultationsRepository.softDelete(consultationId, organizationId);
    logger.info(`Consultation soft-deleted: ${consultationId}`);
  }
}

export const consultationsService = new ConsultationsService();
