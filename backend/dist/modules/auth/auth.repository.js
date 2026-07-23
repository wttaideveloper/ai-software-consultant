"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepository = exports.AuthRepository = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const index_js_1 = require("../../db/index.js");
const index_js_2 = require("../../db/schema/index.js");
class AuthRepository {
    async runInTransaction(callback) {
        return index_js_1.db.transaction(async (tx) => callback(tx));
    }
    async findUserByEmail(email, executor = index_js_1.db) {
        const [user] = await executor
            .select()
            .from(index_js_2.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.users.email, email.toLowerCase()), (0, drizzle_orm_1.isNull)(index_js_2.users.deletedAt)))
            .limit(1);
        return user ?? null;
    }
    async findUserById(userId, executor = index_js_1.db) {
        const [user] = await executor
            .select()
            .from(index_js_2.users)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.users.id, userId), (0, drizzle_orm_1.isNull)(index_js_2.users.deletedAt)))
            .limit(1);
        return user ?? null;
    }
    async findUserWithOrganizationById(userId, executor = index_js_1.db) {
        const [row] = await executor
            .select({
            user: index_js_2.users,
            organization: index_js_2.organizations,
        })
            .from(index_js_2.users)
            .innerJoin(index_js_2.organizations, (0, drizzle_orm_1.eq)(index_js_2.users.organizationId, index_js_2.organizations.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.users.id, userId), (0, drizzle_orm_1.isNull)(index_js_2.users.deletedAt), (0, drizzle_orm_1.isNull)(index_js_2.organizations.deletedAt)))
            .limit(1);
        return row ?? null;
    }
    async findRolesByUserId(userId, executor = index_js_1.db) {
        return executor
            .select({
            id: index_js_2.roles.id,
            organizationId: index_js_2.roles.organizationId,
            name: index_js_2.roles.name,
            slug: index_js_2.roles.slug,
            description: index_js_2.roles.description,
            isSystem: index_js_2.roles.isSystem,
            createdAt: index_js_2.roles.createdAt,
        })
            .from(index_js_2.userRoles)
            .innerJoin(index_js_2.roles, (0, drizzle_orm_1.eq)(index_js_2.userRoles.roleId, index_js_2.roles.id))
            .where((0, drizzle_orm_1.eq)(index_js_2.userRoles.userId, userId));
    }
    async findPermissionCodesByRoleIds(roleIds, executor = index_js_1.db) {
        if (roleIds.length === 0) {
            return [];
        }
        const rows = await executor
            .selectDistinct({ code: index_js_2.permissions.code })
            .from(index_js_2.rolePermissions)
            .innerJoin(index_js_2.permissions, (0, drizzle_orm_1.eq)(index_js_2.rolePermissions.permissionId, index_js_2.permissions.id))
            .where((0, drizzle_orm_1.inArray)(index_js_2.rolePermissions.roleId, roleIds));
        return rows.map((row) => row.code);
    }
    async findOrganizationBySlug(slug, executor = index_js_1.db) {
        const [organization] = await executor
            .select()
            .from(index_js_2.organizations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.organizations.slug, slug), (0, drizzle_orm_1.isNull)(index_js_2.organizations.deletedAt)))
            .limit(1);
        return organization ?? null;
    }
    async findOrganizationById(organizationId, executor = index_js_1.db) {
        const [organization] = await executor
            .select()
            .from(index_js_2.organizations)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(index_js_2.organizations.id, organizationId), (0, drizzle_orm_1.isNull)(index_js_2.organizations.deletedAt)))
            .limit(1);
        return organization ?? null;
    }
    async updateLastLoginAt(userId, lastLoginAt, executor = index_js_1.db) {
        const [user] = await executor
            .update(index_js_2.users)
            .set({ lastLoginAt })
            .where((0, drizzle_orm_1.eq)(index_js_2.users.id, userId))
            .returning();
        if (!user) {
            throw new Error("Failed to update last login timestamp");
        }
        return user;
    }
    async deleteRefreshTokensByUserId(userId, executor = index_js_1.db) {
        await executor
            .delete(index_js_2.refreshTokens)
            .where((0, drizzle_orm_1.eq)(index_js_2.refreshTokens.userId, userId));
    }
    /**
     * Looks a refresh token up by its SHA-256 hash — the raw token is never stored,
     * so this is the only way to confirm a presented token is the one still on
     * record. A miss means it was rotated away, superseded by a newer login, or
     * never issued here, all of which must be treated as "no longer valid".
     */
    async findRefreshTokenByHash(tokenHash, executor = index_js_1.db) {
        const [record] = await executor
            .select()
            .from(index_js_2.refreshTokens)
            .where((0, drizzle_orm_1.eq)(index_js_2.refreshTokens.tokenHash, tokenHash))
            .limit(1);
        return record ?? null;
    }
    async createOrganization(data, executor = index_js_1.db) {
        const [organization] = await executor
            .insert(index_js_2.organizations)
            .values({
            name: data.name,
            slug: data.slug,
            plan: data.plan,
            status: data.status,
            billingEmail: data.billingEmail,
            timezone: data.timezone,
        })
            .returning();
        if (!organization) {
            throw new Error("Failed to create organization");
        }
        return organization;
    }
    async createUser(data, executor = index_js_1.db) {
        const [user] = await executor
            .insert(index_js_2.users)
            .values({
            organizationId: data.organizationId,
            fullName: data.fullName,
            email: data.email.toLowerCase(),
            passwordHash: data.passwordHash,
            status: data.status,
        })
            .returning();
        if (!user) {
            throw new Error("Failed to create user");
        }
        return user;
    }
    async countOrganizationRoles(organizationId, executor = index_js_1.db) {
        const [result] = await executor
            .select({ value: (0, drizzle_orm_1.count)() })
            .from(index_js_2.roles)
            .where((0, drizzle_orm_1.eq)(index_js_2.roles.organizationId, organizationId));
        return Number(result?.value ?? 0);
    }
    async createRole(data, executor = index_js_1.db) {
        const [role] = await executor
            .insert(index_js_2.roles)
            .values({
            organizationId: data.organizationId,
            name: data.name,
            slug: data.slug,
            description: data.description,
            isSystem: data.isSystem,
        })
            .returning();
        if (!role) {
            throw new Error("Failed to create role");
        }
        return role;
    }
    async assignRoleToUser(userId, roleId, assignedBy, executor = index_js_1.db) {
        await executor.insert(index_js_2.userRoles).values({
            userId,
            roleId,
            assignedBy,
        });
    }
    async findAllPermissionIds(executor = index_js_1.db) {
        const rows = await executor
            .select({ id: index_js_2.permissions.id })
            .from(index_js_2.permissions);
        return rows.map((row) => row.id);
    }
    async assignPermissionsToRole(roleId, permissionIds, executor = index_js_1.db) {
        if (permissionIds.length === 0) {
            return;
        }
        await executor
            .insert(index_js_2.rolePermissions)
            .values(permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
        })))
            .onConflictDoNothing({
            target: [index_js_2.rolePermissions.roleId, index_js_2.rolePermissions.permissionId],
        });
    }
    async createOrganizationSetting(organizationId, data, executor = index_js_1.db) {
        await executor.insert(index_js_2.organizationSettings).values({
            organizationId,
            key: data.key,
            value: data.value,
        });
    }
    async createUserSetting(userId, data, executor = index_js_1.db) {
        await executor.insert(index_js_2.userSettings).values({
            userId,
            key: data.key,
            value: data.value,
        });
    }
    async createRefreshToken(data, executor = index_js_1.db) {
        await executor.insert(index_js_2.refreshTokens).values({
            userId: data.userId,
            tokenHash: data.tokenHash,
            expiresAt: data.expiresAt,
            userAgent: data.userAgent,
            ipAddress: data.ipAddress,
        });
    }
}
exports.AuthRepository = AuthRepository;
exports.authRepository = new AuthRepository();
