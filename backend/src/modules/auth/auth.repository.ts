import { and, count, eq, inArray, isNull } from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import {
  organizationSettings,
  organizations,
  permissions,
  refreshTokens,
  rolePermissions,
  roles,
  userRoles,
  userSettings,
  users,
} from "../../db/schema/index.js";

export type OrganizationRecord = typeof organizations.$inferSelect;
export type UserRecord = typeof users.$inferSelect;
export type RoleRecord = typeof roles.$inferSelect;
export type RefreshTokenRecord = typeof refreshTokens.$inferSelect;

export type CreateOrganizationData = {
  name: string;
  slug: string;
  plan: string;
  status: string;
  billingEmail: string;
  timezone: string;
};

export type CreateUserData = {
  organizationId: string;
  fullName: string;
  email: string;
  passwordHash: string;
  status: string;
};

export type CreateRoleData = {
  organizationId: string;
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
};

export type CreateRefreshTokenData = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
};

export type CreateSettingData = {
  key: string;
  value: Record<string, unknown>;
};

export class AuthRepository {
  async runInTransaction<T>(
    callback: (tx: DbExecutor) => Promise<T>,
  ): Promise<T> {
    return db.transaction(async (tx) => callback(tx));
  }

  async findUserByEmail(
    email: string,
    executor: DbExecutor = db,
  ): Promise<UserRecord | null> {
    const [user] = await executor
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  }

  async findUserById(
    userId: string,
    executor: DbExecutor = db,
  ): Promise<UserRecord | null> {
    const [user] = await executor
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    return user ?? null;
  }

  async findUserWithOrganizationById(
    userId: string,
    executor: DbExecutor = db,
  ): Promise<{ user: UserRecord; organization: OrganizationRecord } | null> {
    const [row] = await executor
      .select({
        user: users,
        organization: organizations,
      })
      .from(users)
      .innerJoin(
        organizations,
        eq(users.organizationId, organizations.id),
      )
      .where(
        and(
          eq(users.id, userId),
          isNull(users.deletedAt),
          isNull(organizations.deletedAt),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async findRolesByUserId(
    userId: string,
    executor: DbExecutor = db,
  ): Promise<RoleRecord[]> {
    return executor
      .select({
        id: roles.id,
        organizationId: roles.organizationId,
        name: roles.name,
        slug: roles.slug,
        description: roles.description,
        isSystem: roles.isSystem,
        createdAt: roles.createdAt,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
  }

  async findPermissionCodesByRoleIds(
    roleIds: string[],
    executor: DbExecutor = db,
  ): Promise<string[]> {
    if (roleIds.length === 0) {
      return [];
    }

    const rows = await executor
      .selectDistinct({ code: permissions.code })
      .from(rolePermissions)
      .innerJoin(
        permissions,
        eq(rolePermissions.permissionId, permissions.id),
      )
      .where(inArray(rolePermissions.roleId, roleIds));

    return rows.map((row) => row.code);
  }

  async findOrganizationBySlug(
    slug: string,
    executor: DbExecutor = db,
  ): Promise<OrganizationRecord | null> {
    const [organization] = await executor
      .select()
      .from(organizations)
      .where(
        and(eq(organizations.slug, slug), isNull(organizations.deletedAt)),
      )
      .limit(1);

    return organization ?? null;
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

  async updateLastLoginAt(
    userId: string,
    lastLoginAt: Date,
    executor: DbExecutor = db,
  ): Promise<UserRecord> {
    const [user] = await executor
      .update(users)
      .set({ lastLoginAt })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("Failed to update last login timestamp");
    }

    return user;
  }

  async deleteRefreshTokensByUserId(
    userId: string,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .delete(refreshTokens)
      .where(eq(refreshTokens.userId, userId));
  }

  /**
   * Looks a refresh token up by its SHA-256 hash — the raw token is never stored,
   * so this is the only way to confirm a presented token is the one still on
   * record. A miss means it was rotated away, superseded by a newer login, or
   * never issued here, all of which must be treated as "no longer valid".
   */
  async findRefreshTokenByHash(
    tokenHash: string,
    executor: DbExecutor = db,
  ): Promise<RefreshTokenRecord | null> {
    const [record] = await executor
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);

    return record ?? null;
  }

  async createOrganization(
    data: CreateOrganizationData,
    executor: DbExecutor = db,
  ): Promise<OrganizationRecord> {
    const [organization] = await executor
      .insert(organizations)
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

  async createUser(
    data: CreateUserData,
    executor: DbExecutor = db,
  ): Promise<UserRecord> {
    const [user] = await executor
      .insert(users)
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

  async countOrganizationRoles(
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<number> {
    const [result] = await executor
      .select({ value: count() })
      .from(roles)
      .where(eq(roles.organizationId, organizationId));

    return Number(result?.value ?? 0);
  }

  async createRole(
    data: CreateRoleData,
    executor: DbExecutor = db,
  ): Promise<RoleRecord> {
    const [role] = await executor
      .insert(roles)
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

  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor.insert(userRoles).values({
      userId,
      roleId,
      assignedBy,
    });
  }

  async findAllPermissionIds(executor: DbExecutor = db): Promise<string[]> {
    const rows = await executor
      .select({ id: permissions.id })
      .from(permissions);

    return rows.map((row) => row.id);
  }

  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
    executor: DbExecutor = db,
  ): Promise<void> {
    if (permissionIds.length === 0) {
      return;
    }

    await executor
      .insert(rolePermissions)
      .values(
        permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      )
      .onConflictDoNothing({
        target: [rolePermissions.roleId, rolePermissions.permissionId],
      });
  }

  async createOrganizationSetting(
    organizationId: string,
    data: CreateSettingData,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor.insert(organizationSettings).values({
      organizationId,
      key: data.key,
      value: data.value,
    });
  }

  async createUserSetting(
    userId: string,
    data: CreateSettingData,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor.insert(userSettings).values({
      userId,
      key: data.key,
      value: data.value,
    });
  }

  async createRefreshToken(
    data: CreateRefreshTokenData,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor.insert(refreshTokens).values({
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    });
  }
}

export const authRepository = new AuthRepository();
