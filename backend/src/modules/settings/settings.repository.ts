import { and, eq } from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import { organizationSettings, userSettings } from "../../db/schema/index.js";

export type OrganizationSettingRecord = typeof organizationSettings.$inferSelect;
export type UserSettingRecord = typeof userSettings.$inferSelect;

export class SettingsRepository {
  async runInTransaction<T>(
    callback: (tx: DbExecutor) => Promise<T>,
  ): Promise<T> {
    return db.transaction(async (tx) => callback(tx));
  }

  async findOrganizationSetting(
    organizationId: string,
    key: string,
    executor: DbExecutor = db,
  ): Promise<OrganizationSettingRecord | null> {
    const [setting] = await executor
      .select()
      .from(organizationSettings)
      .where(
        and(
          eq(organizationSettings.organizationId, organizationId),
          eq(organizationSettings.key, key),
        ),
      )
      .limit(1);

    return setting ?? null;
  }

  async upsertOrganizationSetting(
    organizationId: string,
    key: string,
    value: Record<string, unknown>,
    executor: DbExecutor = db,
  ): Promise<OrganizationSettingRecord> {
    const [setting] = await executor
      .insert(organizationSettings)
      .values({ organizationId, key, value })
      .onConflictDoUpdate({
        target: [organizationSettings.organizationId, organizationSettings.key],
        set: { value, updatedAt: new Date() },
      })
      .returning();

    if (!setting) {
      throw new Error("Failed to save organization setting");
    }

    return setting;
  }

  async findUserSetting(
    userId: string,
    key: string,
    executor: DbExecutor = db,
  ): Promise<UserSettingRecord | null> {
    const [setting] = await executor
      .select()
      .from(userSettings)
      .where(and(eq(userSettings.userId, userId), eq(userSettings.key, key)))
      .limit(1);

    return setting ?? null;
  }

  async upsertUserSetting(
    userId: string,
    key: string,
    value: Record<string, unknown>,
    executor: DbExecutor = db,
  ): Promise<UserSettingRecord> {
    const [setting] = await executor
      .insert(userSettings)
      .values({ userId, key, value })
      .onConflictDoUpdate({
        target: [userSettings.userId, userSettings.key],
        set: { value, updatedAt: new Date() },
      })
      .returning();

    if (!setting) {
      throw new Error("Failed to save user setting");
    }

    return setting;
  }
}

export const settingsRepository = new SettingsRepository();
