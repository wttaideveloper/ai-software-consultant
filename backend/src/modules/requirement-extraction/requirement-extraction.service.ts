import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import type { StructuredRequirement } from "../../db/schema/structured-requirements.js";
import type { StructuredRequirementDto } from "./requirement-extraction.dto.js";
import {
  requirementExtractionRepository,
  type ConsultationRecord,
  type StructuredRequirementRecord,
} from "./requirement-extraction.repository.js";
import { structuredRequirementSchema } from "./requirement-extraction.validation.js";

function toDto(
  record: StructuredRequirementRecord,
): StructuredRequirementDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    consultationId: record.consultationId,
    structuredData: record.structuredData,
    version: record.version,
    status: record.status,
    generatedBy: record.generatedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Phase 1 / Step 1 placeholder: no AI call happens yet (aiOrchestrator is not
 * wired into this module). This builds a deterministic, schema-valid payload
 * so the repository/API contract can be exercised end-to-end. Replace with a
 * real aiOrchestrator.generateConversationReply({ promptType: PROMPT_TYPES.
 * REQUIREMENT_EXTRACTION, ... }) call in a later step.
 */
function buildMockStructuredRequirement(
  consultation: ConsultationRecord,
): StructuredRequirement {
  return {
    project: {
      name: consultation.title,
      type: consultation.projectType ?? "unspecified",
      industry: consultation.industry ?? null,
      summary: "Placeholder summary — AI extraction not yet implemented.",
    },
    businessGoals: ["Placeholder — populated once AI extraction is implemented."],
    applications: [
      {
        name: "Placeholder Application",
        platform: "web",
        description: "Placeholder — populated once AI extraction is implemented.",
      },
    ],
    targetUsers: [
      {
        name: "Placeholder User",
        description: "Placeholder — populated once AI extraction is implemented.",
      },
    ],
    actors: [
      {
        name: "Placeholder Actor",
        responsibilities: [],
      },
    ],
    modules: [
      {
        name: "Placeholder Module",
        description: "Placeholder — populated once AI extraction is implemented.",
        features: [],
      },
    ],
    customerFeatures: [],
    sellerFeatures: [],
    adminFeatures: [],
    integrations: [],
    payment: {
      methods: [],
      providers: [],
      notes: "",
    },
    notifications: {
      channels: [],
      triggers: [],
    },
    security: {
      authMethods: [],
      complianceRequirements: [],
      notes: "",
    },
    scalability: {
      expectedLoad: null,
      notes: "",
    },
    deployment: {
      targetEnvironment: [],
      ciCdRequirements: [],
      notes: "",
    },
    technicalRequirements: [],
    businessRules: [],
    assumptions: [],
    risks: [],
    futureScope: [],
    openQuestions: [],
  };
}

export class RequirementExtractionService {
  async get(
    organizationId: string,
    consultationId: string,
  ): Promise<StructuredRequirementDto> {
    const consultation =
      await requirementExtractionRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const record = await requirementExtractionRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    if (!record) {
      throw new AppError(
        "Structured requirement not found",
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return toDto(record);
  }

  async generate(
    organizationId: string,
    consultationId: string,
  ): Promise<StructuredRequirementDto> {
    const consultation =
      await requirementExtractionRepository.findConsultationByIdAndOrganization(
        consultationId,
        organizationId,
      );

    if (!consultation) {
      throw new AppError("Consultation not found", HTTP_STATUS.NOT_FOUND);
    }

    const organization =
      await requirementExtractionRepository.findOrganizationById(
        organizationId,
      );

    if (!organization) {
      throw new AppError("Organization not found", HTTP_STATUS.NOT_FOUND);
    }

    const existing = await requirementExtractionRepository.findByConsultationId(
      consultationId,
      organizationId,
    );

    const mockData = structuredRequirementSchema.parse(
      buildMockStructuredRequirement(consultation),
    );

    const record = existing
      ? await requirementExtractionRepository.update(existing.id, organizationId, {
          structuredData: mockData,
          version: existing.version + 1,
          status: "draft",
          generatedBy: "AI",
        })
      : await requirementExtractionRepository.create({
          organizationId,
          consultationId,
          structuredData: mockData,
          version: 1,
          status: "draft",
          generatedBy: "AI",
        });

    logger.info(
      `Structured requirement (mock) generated for consultation=${consultationId} version=${record.version}`,
    );

    return toDto(record);
  }
}

export const requirementExtractionService = new RequirementExtractionService();
