"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.featureLibraryRepository = exports.FeatureLibraryRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_js_1 = require("../../db/index.js");
const index_js_2 = require("../../db/schema/index.js");
function buildListConditions(filters) {
    const conditions = [
        (0, drizzle_orm_1.eq)(index_js_2.featureLibrary.organizationId, filters.organizationId),
        (0, drizzle_orm_1.isNull)(index_js_2.featureLibrary.deletedAt),
    ];
    if (filters.name) {
        conditions.push((0, drizzle_orm_1.ilike)(index_js_2.featureLibrary.name, `%${filters.name}%`));
    }
    if (filters.category) {
        conditions.push((0, drizzle_orm_1.ilike)(index_js_2.featureLibrary.category, `%${filters.category}%`));
    }
    if (filters.tag) {
        conditions.push((0, drizzle_orm_1.sql) `${index_js_2.featureLibrary.tags} @> ${JSON.stringify([filters.tag])}::jsonb`);
    }
    if (filters.isActive !== undefined) {
        conditions.push((0, drizzle_orm_1.eq)(index_js_2.featureLibrary.isActive, filters.isActive));
    }
    return conditions;
}
class FeatureLibraryRepository {
    async runInTransaction(callback) {
        return index_js_1.db.transaction(async (tx) => callback(tx));
    }
    async countByOrganization(filters, executor = index_js_1.db) {
        const conditions = buildListConditions({
            ...filters,
            page: 1,
            pageSize: 1,
        });
        const [result] = await executor
            .select({ value: (0, drizzle_orm_1.count)() })
            .from(index_js_2.featureLibrary)
            .where((0, drizzle_orm_1.and)(...conditions));
        return Number(result?.value ?? 0);
    }
    async findManyByOrganization(filters, executor = index_js_1.db) {
        const conditions = buildListConditions(filters);
        const offset = (filters.page - 1) * filters.pageSize;
        return executor
            .select()
            .from(index_js_2.featureLibrary)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.asc)(index_js_2.featureLibrary.category), (0, drizzle_orm_1.asc)(index_js_2.featureLibrary.name))
            .limit(filters.pageSize)
            .offset(offset);
    }
    async findActiveByOrganization(organizationId, executor = index_js_1.db) {
        return executor
            .select()
            .from(index_js_2.featureLibrary)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.featureLibrary.organizationId, organizationId), (0, drizzle_orm_1.eq)(index_js_2.featureLibrary.isActive, true), (0, drizzle_orm_1.isNull)(index_js_2.featureLibrary.deletedAt)))
            .orderBy((0, drizzle_orm_1.asc)(index_js_2.featureLibrary.category), (0, drizzle_orm_1.asc)(index_js_2.featureLibrary.name));
    }
    async findByIdAndOrganization(featureId, organizationId, executor = index_js_1.db) {
        const [feature] = await executor
            .select()
            .from(index_js_2.featureLibrary)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.featureLibrary.id, featureId), (0, drizzle_orm_1.eq)(index_js_2.featureLibrary.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.featureLibrary.deletedAt)))
            .limit(1);
        return feature ?? null;
    }
    async create(data, executor = index_js_1.db) {
        const [feature] = await executor
            .insert(index_js_2.featureLibrary)
            .values(data)
            .returning();
        if (!feature) {
            throw new Error("Failed to create feature library item");
        }
        return feature;
    }
    async update(featureId, organizationId, data, executor = index_js_1.db) {
        const [feature] = await executor
            .update(index_js_2.featureLibrary)
            .set(data)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.featureLibrary.id, featureId), (0, drizzle_orm_1.eq)(index_js_2.featureLibrary.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.featureLibrary.deletedAt)))
            .returning();
        if (!feature) {
            throw new Error("Failed to update feature library item");
        }
        return feature;
    }
    async softDelete(featureId, organizationId, executor = index_js_1.db) {
        const [feature] = await executor
            .update(index_js_2.featureLibrary)
            .set({ deletedAt: new Date(), isActive: false })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.featureLibrary.id, featureId), (0, drizzle_orm_1.eq)(index_js_2.featureLibrary.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.featureLibrary.deletedAt)))
            .returning();
        if (!feature) {
            throw new Error("Failed to delete feature library item");
        }
        return feature;
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
    async findDetectedFeaturesByConsultation(consultationId, organizationId, executor = index_js_1.db) {
        return executor
            .select()
            .from(index_js_2.detectedFeatures)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.detectedFeatures.consultationId, consultationId), (0, drizzle_orm_1.eq)(index_js_2.detectedFeatures.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.detectedFeatures.deletedAt)))
            .orderBy((0, drizzle_orm_1.asc)(index_js_2.detectedFeatures.featureCategory), (0, drizzle_orm_1.asc)(index_js_2.detectedFeatures.featureName));
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
exports.FeatureLibraryRepository = FeatureLibraryRepository;
exports.featureLibraryRepository = new FeatureLibraryRepository();
