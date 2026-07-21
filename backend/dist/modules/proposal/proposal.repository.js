"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proposalRepository = exports.ProposalRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_js_1 = require("../../db/index.js");
const index_js_2 = require("../../db/schema/index.js");
class ProposalRepository {
    async runInTransaction(callback) {
        return index_js_1.db.transaction(async (tx) => callback(tx));
    }
    async findConsultationByIdAndOrganization(consultationId, organizationId, executor = index_js_1.db) {
        const [consultation] = await executor
            .select()
            .from(index_js_2.consultations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.consultations.id, consultationId), (0, drizzle_orm_1.eq)(index_js_2.consultations.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.consultations.deletedAt)))
            .limit(1);
        return consultation ?? null;
    }
    async findOrganizationById(organizationId, executor = index_js_1.db) {
        const [organization] = await executor
            .select()
            .from(index_js_2.organizations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.organizations.id, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.organizations.deletedAt)))
            .limit(1);
        return organization ?? null;
    }
    async findRequirementSummaryByConsultation(consultationId, organizationId, executor = index_js_1.db) {
        const [summary] = await executor
            .select()
            .from(index_js_2.requirementSummaries)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.requirementSummaries.consultationId, consultationId), (0, drizzle_orm_1.eq)(index_js_2.requirementSummaries.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.requirementSummaries.deletedAt)))
            .limit(1);
        return summary ?? null;
    }
    async findFeaturesByConsultation(consultationId, organizationId, executor = index_js_1.db) {
        return executor
            .select()
            .from(index_js_2.detectedFeatures)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.detectedFeatures.consultationId, consultationId), (0, drizzle_orm_1.eq)(index_js_2.detectedFeatures.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.detectedFeatures.deletedAt)))
            .orderBy((0, drizzle_orm_1.asc)(index_js_2.detectedFeatures.featureCategory), (0, drizzle_orm_1.asc)(index_js_2.detectedFeatures.featureName));
    }
    async findEstimationByConsultation(consultationId, organizationId, executor = index_js_1.db) {
        const [estimation] = await executor
            .select()
            .from(index_js_2.projectEstimations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.projectEstimations.consultationId, consultationId), (0, drizzle_orm_1.eq)(index_js_2.projectEstimations.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.projectEstimations.deletedAt)))
            .limit(1);
        return estimation ?? null;
    }
    async findByConsultationId(consultationId, organizationId, executor = index_js_1.db) {
        const [proposal] = await executor
            .select()
            .from(index_js_2.projectProposals)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.projectProposals.consultationId, consultationId), (0, drizzle_orm_1.eq)(index_js_2.projectProposals.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.projectProposals.deletedAt)))
            .limit(1);
        return proposal ?? null;
    }
    async create(data, executor = index_js_1.db) {
        const [proposal] = await executor
            .insert(index_js_2.projectProposals)
            .values(data)
            .returning();
        if (!proposal) {
            throw new Error("Failed to create project proposal");
        }
        return proposal;
    }
    async update(proposalId, organizationId, data, executor = index_js_1.db) {
        const [proposal] = await executor
            .update(index_js_2.projectProposals)
            .set(data)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.projectProposals.id, proposalId), (0, drizzle_orm_1.eq)(index_js_2.projectProposals.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.projectProposals.deletedAt)))
            .returning();
        if (!proposal) {
            throw new Error("Failed to update project proposal");
        }
        return proposal;
    }
    async createAiGeneration(data, executor = index_js_1.db) {
        await executor.insert(index_js_2.aiGenerations).values({
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
exports.ProposalRepository = ProposalRepository;
exports.proposalRepository = new ProposalRepository();
