import { and, eq, isNull } from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import {
  consultations,
  organizations,
  structuredRequirements,
  type StructuredRequirement,
} from "../../db/schema/index.js";

export type ConsultationRecord = typeof consultations.$inferSelect;
export type OrganizationRecord = typeof organizations.$inferSelect;
export type StructuredRequirementRecord =
  typeof structuredRequirements.$inferSelect;

export type CreateStructuredRequirementData = {
  organizationId: string;
  consultationId: string;
  structuredData: StructuredRequirement;
  version: number;
  status: "draft" | "finalized";
  generatedBy: "AI" | "USER";
};

export type UpdateStructuredRequirementData = {
  structuredData?: StructuredRequirement;
  status?: "draft" | "finalized";
  generatedBy?: "AI" | "USER";
  version?: number;
};

export class RequirementExtractionRepository {
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

  async findByConsultationId(
    consultationId: string,
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<StructuredRequirementRecord | null> {
    const [record] = await executor
      .select()
      .from(structuredRequirements)
      .where(
        and(
          eq(structuredRequirements.consultationId, consultationId),
          eq(structuredRequirements.organizationId, organizationId),
          isNull(structuredRequirements.deletedAt),
        ),
      )
      .limit(1);

    return record ?? null;
  }

  async create(
    data: CreateStructuredRequirementData,
    executor: DbExecutor = db,
  ): Promise<StructuredRequirementRecord> {
    const [record] = await executor
      .insert(structuredRequirements)
      .values({
        organizationId: data.organizationId,
        consultationId: data.consultationId,
        structuredData: data.structuredData,
        version: data.version,
        status: data.status,
        generatedBy: data.generatedBy,
      })
      .returning();

    if (!record) {
      throw new Error("Failed to create structured requirement");
    }

    return record;
  }

  async update(
    structuredRequirementId: string,
    organizationId: string,
    data: UpdateStructuredRequirementData,
    executor: DbExecutor = db,
  ): Promise<StructuredRequirementRecord> {
    const [record] = await executor
      .update(structuredRequirements)
      .set(data)
      .where(
        and(
          eq(structuredRequirements.id, structuredRequirementId),
          eq(structuredRequirements.organizationId, organizationId),
          isNull(structuredRequirements.deletedAt),
        ),
      )
      .returning();

    if (!record) {
      throw new Error("Failed to update structured requirement");
    }

    return record;
  }
}

export const requirementExtractionRepository =
  new RequirementExtractionRepository();
