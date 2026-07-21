"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementSummaryRepository = exports.RequirementSummaryRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_js_1 = require("../../db/index.js");
const index_js_2 = require("../../db/schema/index.js");
class RequirementSummaryRepository {
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
    async findMessagesByConsultation(consultationId, organizationId, executor = index_js_1.db) {
        return executor
            .select()
            .from(index_js_2.conversationMessages)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.conversationMessages.consultationId, consultationId), (0, drizzle_orm_1.eq)(index_js_2.conversationMessages.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.conversationMessages.deletedAt)))
            .orderBy((0, drizzle_orm_1.asc)(index_js_2.conversationMessages.createdAt), (0, drizzle_orm_1.asc)(index_js_2.conversationMessages.id));
    }
    async findByConsultationId(consultationId, organizationId, executor = index_js_1.db) {
        const [summary] = await executor
            .select()
            .from(index_js_2.requirementSummaries)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.requirementSummaries.consultationId, consultationId), (0, drizzle_orm_1.eq)(index_js_2.requirementSummaries.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.requirementSummaries.deletedAt)))
            .limit(1);
        return summary ?? null;
    }
    async create(data, executor = index_js_1.db) {
        const [summary] = await executor
            .insert(index_js_2.requirementSummaries)
            .values({
            organizationId: data.organizationId,
            consultationId: data.consultationId,
            summaryMarkdown: data.summaryMarkdown,
            structuredSummary: data.structuredSummary,
            version: data.version,
            status: data.status,
            generatedBy: data.generatedBy,
        })
            .returning();
        if (!summary) {
            throw new Error("Failed to create requirement summary");
        }
        return summary;
    }
    async update(summaryId, organizationId, data, executor = index_js_1.db) {
        const [summary] = await executor
            .update(index_js_2.requirementSummaries)
            .set(data)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.requirementSummaries.id, summaryId), (0, drizzle_orm_1.eq)(index_js_2.requirementSummaries.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.requirementSummaries.deletedAt)))
            .returning();
        if (!summary) {
            throw new Error("Failed to update requirement summary");
        }
        return summary;
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
exports.RequirementSummaryRepository = RequirementSummaryRepository;
exports.requirementSummaryRepository = new RequirementSummaryRepository();
