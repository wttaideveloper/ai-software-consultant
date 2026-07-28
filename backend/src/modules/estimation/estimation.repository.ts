import { and, asc, eq, isNull } from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import {
  aiGenerations,
  consultations,
  detectedFeatures,
  organizations,
  projectEstimations,
  requirementSummaries,
  type EstimationBreakdownItem,
  type EstimationModePlan,
  type EstimationRisk,
} from "../../db/schema/index.js";

export type ConsultationRecord = typeof consultations.$inferSelect;
export type OrganizationRecord = typeof organizations.$inferSelect;
export type RequirementSummaryRecord =
  typeof requirementSummaries.$inferSelect;
export type DetectedFeatureRecord = typeof detectedFeatures.$inferSelect;
export type ProjectEstimationRecord = typeof projectEstimations.$inferSelect;

export type CreateEstimationData = {
  organizationId: string;
  consultationId: string;
  requirementSummaryId: string;
  estimatedHours: number;
  estimatedWeeks: number | null;
  modePlan: EstimationModePlan | null;
  estimatedTeamSize: number;
  complexity: "LOW" | "MEDIUM" | "HIGH";
  confidenceScore: string;
  assumptions: string;
  risks: EstimationRisk[];
  breakdown: EstimationBreakdownItem[];
  generatedBy: "AI" | "USER";
  version: number;
};

export type UpdateEstimationData = {
  requirementSummaryId?: string;
  estimatedHours?: number;
  estimatedWeeks?: number | null;
  modePlan?: EstimationModePlan | null;
  estimatedTeamSize?: number;
  complexity?: "LOW" | "MEDIUM" | "HIGH";
  confidenceScore?: string;
  assumptions?: string;
  risks?: EstimationRisk[];
  breakdown?: EstimationBreakdownItem[];
  generatedBy?: "AI" | "USER";
  version?: number;
};

export type CreateAiGenerationData = {
  organizationId: string;
  consultationId: string;
  conversationMessageId: string | null;
  provider: string;
  model: string;
  promptType: string;
  promptVersion: string;
  requestTokens: number;
  responseTokens: number;
  totalTokens: number;
  latencyMs: number;
  estimatedCost: string;
  status: "success" | "failed";
  errorMessage: string | null;
};

export class EstimationRepository {
  async runInTransaction<T>(
    callback: (tx: DbExecutor) => Promise<T>,
  ): Promise<T> {
    return db.transaction(async (tx) => callback(tx));
  }

  async findConsultationByIdAndOrganization(
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

  async findOrganizationById(
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<OrganizationRecord | null> {
    const [organization] = await executor
      .select()
      .from(organizations)
      .where(
        and(
          eq(organizations.id, organizationId),
          isNull(organizations.deletedAt),
        ),
      )
      .limit(1);

    return organization ?? null;
  }

  async findRequirementSummaryByConsultation(
    consultationId: string,
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<RequirementSummaryRecord | null> {
    const [summary] = await executor
      .select()
      .from(requirementSummaries)
      .where(
        and(
          eq(requirementSummaries.consultationId, consultationId),
          eq(requirementSummaries.organizationId, organizationId),
          isNull(requirementSummaries.deletedAt),
        ),
      )
      .limit(1);

    return summary ?? null;
  }

  async findFeaturesByConsultation(
    consultationId: string,
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<DetectedFeatureRecord[]> {
    return executor
      .select()
      .from(detectedFeatures)
      .where(
        and(
          eq(detectedFeatures.consultationId, consultationId),
          eq(detectedFeatures.organizationId, organizationId),
          isNull(detectedFeatures.deletedAt),
        ),
      )
      .orderBy(
        asc(detectedFeatures.featureCategory),
        asc(detectedFeatures.featureName),
      );
  }

  async findByConsultationId(
    consultationId: string,
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<ProjectEstimationRecord | null> {
    const [estimation] = await executor
      .select()
      .from(projectEstimations)
      .where(
        and(
          eq(projectEstimations.consultationId, consultationId),
          eq(projectEstimations.organizationId, organizationId),
          isNull(projectEstimations.deletedAt),
        ),
      )
      .limit(1);

    return estimation ?? null;
  }

  async create(
    data: CreateEstimationData,
    executor: DbExecutor = db,
  ): Promise<ProjectEstimationRecord> {
    const [estimation] = await executor
      .insert(projectEstimations)
      .values(data)
      .returning();

    if (!estimation) {
      throw new Error("Failed to create project estimation");
    }

    return estimation;
  }

  async update(
    estimationId: string,
    organizationId: string,
    data: UpdateEstimationData,
    executor: DbExecutor = db,
  ): Promise<ProjectEstimationRecord> {
    const [estimation] = await executor
      .update(projectEstimations)
      .set(data)
      .where(
        and(
          eq(projectEstimations.id, estimationId),
          eq(projectEstimations.organizationId, organizationId),
          isNull(projectEstimations.deletedAt),
        ),
      )
      .returning();

    if (!estimation) {
      throw new Error("Failed to update project estimation");
    }

    return estimation;
  }

  async createAiGeneration(
    data: CreateAiGenerationData,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor.insert(aiGenerations).values({
      organizationId: data.organizationId,
      consultationId: data.consultationId,
      conversationMessageId: data.conversationMessageId,
      provider: data.provider,
      model: data.model,
      promptType: data.promptType,
      promptVersion: data.promptVersion,
      requestTokens: data.requestTokens,
      responseTokens: data.responseTokens,
      totalTokens: data.totalTokens,
      latencyMs: data.latencyMs,
      estimatedCost: data.estimatedCost,
      status: data.status,
      errorMessage: data.errorMessage,
    });
  }
}

export const estimationRepository = new EstimationRepository();
