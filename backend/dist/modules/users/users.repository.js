"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRepository = exports.UsersRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_js_1 = require("../../db/index.js");
const index_js_2 = require("../../db/schema/index.js");
class UsersRepository {
    async runInTransaction(callback) {
        return index_js_1.db.transaction(async (tx) => callback(tx));
    }
    async countByOrganization(filters, executor = index_js_1.db) {
        const conditions = [
            (0, drizzle_orm_1.eq)(index_js_2.users.organizationId, filters.organizationId),
            (0, drizzle_orm_1.isNull)(index_js_2.users.deletedAt),
        ];
        if (filters.search) {
            const term = `%${filters.search}%`;
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(index_js_2.users.fullName, term), (0, drizzle_orm_1.ilike)(index_js_2.users.email, term)));
        }
        const [result] = await executor
            .select({ value: (0, drizzle_orm_1.count)() })
            .from(index_js_2.users)
            .where((0, drizzle_orm_1.and)(...conditions));
        return Number(result?.value ?? 0);
    }
    async findManyByOrganization(filters, executor = index_js_1.db) {
        const conditions = [
            (0, drizzle_orm_1.eq)(index_js_2.users.organizationId, filters.organizationId),
            (0, drizzle_orm_1.isNull)(index_js_2.users.deletedAt),
        ];
        if (filters.search) {
            const term = `%${filters.search}%`;
            conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.ilike)(index_js_2.users.fullName, term), (0, drizzle_orm_1.ilike)(index_js_2.users.email, term)));
        }
        const offset = (filters.page - 1) * filters.pageSize;
        return executor
            .select()
            .from(index_js_2.users)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(index_js_2.users.createdAt), (0, drizzle_orm_1.asc)(index_js_2.users.id))
            .limit(filters.pageSize)
            .offset(offset);
    }
    async findByIdAndOrganization(userId, organizationId, executor = index_js_1.db) {
        const [user] = await executor
            .select()
            .from(index_js_2.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.users.id, userId), (0, drizzle_orm_1.eq)(index_js_2.users.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.users.deletedAt)))
            .limit(1);
        return user ?? null;
    }
    async findByEmail(email, executor = index_js_1.db) {
        const [user] = await executor
            .select()
            .from(index_js_2.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.users.email, email.toLowerCase()), (0, drizzle_orm_1.isNull)(index_js_2.users.deletedAt)))
            .limit(1);
        return user ?? null;
    }
    async create(data, executor = index_js_1.db) {
        const [user] = await executor
            .insert(index_js_2.users)
            .values({
            organizationId: data.organizationId,
            fullName: data.fullName,
            email: data.email.toLowerCase(),
            passwordHash: data.passwordHash,
            phone: data.phone,
            avatarUrl: data.avatarUrl,
            status: data.status,
        })
            .returning();
        if (!user) {
            throw new Error("Failed to create user");
        }
        return user;
    }
    async update(userId, organizationId, data, executor = index_js_1.db) {
        const [user] = await executor
            .update(index_js_2.users)
            .set(data)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.users.id, userId), (0, drizzle_orm_1.eq)(index_js_2.users.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.users.deletedAt)))
            .returning();
        if (!user) {
            throw new Error("Failed to update user");
        }
        return user;
    }
    async softDelete(userId, organizationId, executor = index_js_1.db) {
        const [user] = await executor
            .update(index_js_2.users)
            .set({ deletedAt: new Date(), status: "inactive" })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.users.id, userId), (0, drizzle_orm_1.eq)(index_js_2.users.organizationId, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.users.deletedAt)))
            .returning();
        if (!user) {
            throw new Error("Failed to delete user");
        }
        return user;
    }
    async findRolesByIdsAndOrganization(roleIds, organizationId, executor = index_js_1.db) {
        if (roleIds.length === 0) {
            return [];
        }
        return executor
            .select()
            .from(index_js_2.roles)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(index_js_2.roles.id, roleIds), (0, drizzle_orm_1.eq)(index_js_2.roles.organizationId, organizationId)));
    }
    async findRolesByUserIds(userIds, executor = index_js_1.db) {
        if (userIds.length === 0) {
            return [];
        }
        const rows = await executor
            .select({
            userId: index_js_2.userRoles.userId,
            role: index_js_2.roles,
        })
            .from(index_js_2.userRoles)
            .innerJoin(index_js_2.roles, (0, drizzle_orm_1.eq)(index_js_2.userRoles.roleId, index_js_2.roles.id))
            .where((0, drizzle_orm_1.inArray)(index_js_2.userRoles.userId, userIds));
        return rows;
    }
    async deleteUserRoles(userId, executor = index_js_1.db) {
        await executor.delete(index_js_2.userRoles).where((0, drizzle_orm_1.eq)(index_js_2.userRoles.userId, userId));
    }
    async assignRoles(userId, roleIds, assignedBy, executor = index_js_1.db) {
        if (roleIds.length === 0) {
            return;
        }
        await executor.insert(index_js_2.userRoles).values(roleIds.map((roleId) => ({
            userId,
            roleId,
            assignedBy,
        })));
    }
}
exports.UsersRepository = UsersRepository;
exports.usersRepository = new UsersRepository();
