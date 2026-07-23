import { and, asc, eq } from "drizzle-orm";
import { db, type DbExecutor } from "../../db/index.js";
import {
  costComplexityMultipliers,
  costHourlyRates,
  costPlatformMultipliers,
  costSettings,
} from "../../db/schema/index.js";
import {
  DEFAULT_COMPLEXITY_MULTIPLIERS,
  DEFAULT_HOURLY_RATES,
  DEFAULT_PLATFORM_MULTIPLIERS,
  type CostComplexityLevel,
  type CostPlatform,
  type CostRole,
} from "./cost.constants.js";

export type CostSettingsRecord = typeof costSettings.$inferSelect;
export type CostHourlyRateRecord = typeof costHourlyRates.$inferSelect;
export type CostComplexityRecord = typeof costComplexityMultipliers.$inferSelect;
export type CostPlatformRecord = typeof costPlatformMultipliers.$inferSelect;

export type UpdateCostSettingsData = Partial<{
  riskBufferPercentage: string;
  defaultCurrency: CostSettingsRecord["defaultCurrency"];
  currencySymbol: string;
  taxEnabled: boolean;
  taxType: CostSettingsRecord["taxType"];
  taxPercentage: string;
  discountType: CostSettingsRecord["discountType"];
  discountValue: string;
  maxDiscountPercentage: string;
}>;

export class CostSettingsRepository {
  async runInTransaction<T>(
    callback: (tx: DbExecutor) => Promise<T>,
  ): Promise<T> {
    return db.transaction(async (tx) => callback(tx));
  }

  async findSettings(
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<CostSettingsRecord | null> {
    const [row] = await executor
      .select()
      .from(costSettings)
      .where(eq(costSettings.organizationId, organizationId))
      .limit(1);

    return row ?? null;
  }

  /**
   * Provisioning is `onConflictDoNothing` on every table rather than a
   * "does it exist?" check followed by an insert: two requests arriving together
   * for a brand-new organization would both see "missing" and both insert. The
   * unique indexes decide, and the loser's rows are discarded silently.
   */
  async ensureDefaults(
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .insert(costSettings)
      .values({ organizationId })
      .onConflictDoNothing({ target: costSettings.organizationId });

    await executor
      .insert(costHourlyRates)
      .values(
        Object.entries(DEFAULT_HOURLY_RATES).map(([role, hourlyRate]) => ({
          organizationId,
          role: role as CostRole,
          hourlyRate,
        })),
      )
      .onConflictDoNothing({
        target: [costHourlyRates.organizationId, costHourlyRates.role],
      });

    await executor
      .insert(costComplexityMultipliers)
      .values(
        Object.entries(DEFAULT_COMPLEXITY_MULTIPLIERS).map(
          ([level, multiplier]) => ({
            organizationId,
            level: level as CostComplexityLevel,
            multiplier,
          }),
        ),
      )
      .onConflictDoNothing({
        target: [
          costComplexityMultipliers.organizationId,
          costComplexityMultipliers.level,
        ],
      });

    await executor
      .insert(costPlatformMultipliers)
      .values(
        Object.entries(DEFAULT_PLATFORM_MULTIPLIERS).map(
          ([platform, multiplier]) => ({
            organizationId,
            platform: platform as CostPlatform,
            multiplier,
          }),
        ),
      )
      .onConflictDoNothing({
        target: [
          costPlatformMultipliers.organizationId,
          costPlatformMultipliers.platform,
        ],
      });
  }

  async updateSettings(
    organizationId: string,
    data: UpdateCostSettingsData,
    executor: DbExecutor = db,
  ): Promise<CostSettingsRecord | null> {
    const [row] = await executor
      .update(costSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(costSettings.organizationId, organizationId))
      .returning();

    return row ?? null;
  }

  async findHourlyRates(
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<CostHourlyRateRecord[]> {
    return executor
      .select()
      .from(costHourlyRates)
      .where(eq(costHourlyRates.organizationId, organizationId))
      .orderBy(asc(costHourlyRates.role));
  }

  async findComplexityMultipliers(
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<CostComplexityRecord[]> {
    return executor
      .select()
      .from(costComplexityMultipliers)
      .where(eq(costComplexityMultipliers.organizationId, organizationId))
      .orderBy(asc(costComplexityMultipliers.level));
  }

  async findPlatformMultipliers(
    organizationId: string,
    executor: DbExecutor = db,
  ): Promise<CostPlatformRecord[]> {
    return executor
      .select()
      .from(costPlatformMultipliers)
      .where(eq(costPlatformMultipliers.organizationId, organizationId))
      .orderBy(asc(costPlatformMultipliers.platform));
  }

  /**
   * Upserts rather than updates: a rate row for a role added to the enum after
   * this organization was provisioned would not exist yet, and an admin saving
   * the form should create it rather than get a silent no-op.
   */
  async upsertHourlyRate(
    organizationId: string,
    role: CostRole,
    hourlyRate: string,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .insert(costHourlyRates)
      .values({ organizationId, role, hourlyRate })
      .onConflictDoUpdate({
        target: [costHourlyRates.organizationId, costHourlyRates.role],
        set: { hourlyRate, updatedAt: new Date() },
      });
  }

  async upsertComplexityMultiplier(
    organizationId: string,
    level: CostComplexityLevel,
    multiplier: string,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .insert(costComplexityMultipliers)
      .values({ organizationId, level, multiplier })
      .onConflictDoUpdate({
        target: [
          costComplexityMultipliers.organizationId,
          costComplexityMultipliers.level,
        ],
        set: { multiplier, updatedAt: new Date() },
      });
  }

  async upsertPlatformMultiplier(
    organizationId: string,
    platform: CostPlatform,
    multiplier: string,
    executor: DbExecutor = db,
  ): Promise<void> {
    await executor
      .insert(costPlatformMultipliers)
      .values({ organizationId, platform, multiplier })
      .onConflictDoUpdate({
        target: [
          costPlatformMultipliers.organizationId,
          costPlatformMultipliers.platform,
        ],
        set: { multiplier, updatedAt: new Date() },
      });
  }

  /** Single-row lookup used by the pricing path when a role rate is requested. */
  async findHourlyRate(
    organizationId: string,
    role: CostRole,
    executor: DbExecutor = db,
  ): Promise<CostHourlyRateRecord | null> {
    const [row] = await executor
      .select()
      .from(costHourlyRates)
      .where(
        and(
          eq(costHourlyRates.organizationId, organizationId),
          eq(costHourlyRates.role, role),
        ),
      )
      .limit(1);

    return row ?? null;
  }
}

export const costSettingsRepository = new CostSettingsRepository();
