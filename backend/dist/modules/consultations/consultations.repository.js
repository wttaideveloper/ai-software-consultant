"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consultationsRepository = exports.ConsultationsRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_js_1 = require("../../db/index.js");
const index_js_2 = require("../../db/schema/index.js");
class ConsultationsRepository {
    async runInTransaction(callback) {
        return index_js_1.db.transaction(async (tx) => callback(tx));
    }
    buildListConditions(filters) {
        const conditions = [
            (0, drizzle_orm_1.eq)(index_js_2.consultations.organizationId, filters.organizationId),
            (0, drizzle_orm_1.isNull)(index_js_2.consultations.deletedAt),
        ];
        if (filters.search) {
            conditions.push((0, drizzle_orm_1.ilike)(index_js_2.consultations.title, `%${filters.search}%`));
        }
        if (filters.status) {
            conditions.push((0, drizzle_orm_1.eq)(index_js_2.consultations.status, filters.status));
        }
        if (filters.assignedTo) {
            conditions.push((0, drizzle_orm_1.eq)(index_js_2.consultations.assignedTo, filters.assignedTo));
        }
        return (0, drizzle_orm_1.and)(...conditions);
    }
    async countByOrganization(filters, executor = index_js_1.db) {
        const [result] = await executor
            .select({ value: (0, drizzle_orm_1.count)() })
            .from(index_js_2.consultations)
            .where(this.buildListConditions({ ...filters, page: 1, pageSize: 1 }));
        return Number(result?.value ?? 0);
    }
    async findManyByOrganization(filters, executor = index_js_1.db) {
        const offset = (filters.page - 1) * filters.pageSize;
        return executor
            .select()
            .from(index_js_2.consultations)
            .where(this.buildListConditions(filters))
            .orderBy((0, drizzle_orm_1.desc)(index_js_2.consultations.createdAt), (0, drizzle_orm_1.asc)(index_js_2.consultations.id))
            .limit(filters.pageSize)
            .offset(offset);
    }
    async findByIdAndOrganization(consultationId, organizationId, executor = index_js_1.db) {
        const [consultation] = await executor
            .select()
            .from(index_js_2.consultations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.consultations.id, consultationId), (0, drizzle_orm_1.eq)(index_js_2.consultations.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.consultations.deletedAt)))
            .limit(1);
        return consultation ?? null;
    }
    async create(data, executor = index_js_1.db) {
        const [consultation] = await executor
            .insert(index_js_2.consultations)
            .values({
            organizationId: data.organizationId,
            createdBy: data.createdBy,
            assignedTo: data.assignedTo,
            title: data.title,
            status: data.status,
            industry: data.industry,
            projectType: data.projectType,
            consultationMode: data.consultationMode,
            budgetRange: data.budgetRange,
            timeline: data.timeline,
        })
            .returning();
        if (!consultation) {
            throw new Error("Failed to create consultation");
        }
        return consultation;
    }
    async update(consultationId, organizationId, data, executor = index_js_1.db) {
        const [consultation] = await executor
            .update(index_js_2.consultations)
            .set(data)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.consultations.id, consultationId), (0, drizzle_orm_1.eq)(index_js_2.consultations.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.consultations.deletedAt)))
            .returning();
        if (!consultation) {
            throw new Error("Failed to update consultation");
        }
        return consultation;
    }
    async softDelete(consultationId, organizationId, executor = index_js_1.db) {
        const [consultation] = await executor
            .update(index_js_2.consultations)
            .set({ deletedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.consultations.id, consultationId), (0, drizzle_orm_1.eq)(index_js_2.consultations.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.consultations.deletedAt)))
            .returning();
        if (!consultation) {
            throw new Error("Failed to delete consultation");
        }
        return consultation;
    }
    async findActiveUserInOrganization(userId, organizationId, executor = index_js_1.db) {
        const [user] = await executor
            .select({ id: index_js_2.users.id })
            .from(index_js_2.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.users.id, userId), (0, drizzle_orm_1.eq)(index_js_2.users.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.users.deletedAt)))
            .limit(1);
        return user ?? null;
    }
}
exports.ConsultationsRepository = ConsultationsRepository;
exports.consultationsRepository = new ConsultationsRepository();
