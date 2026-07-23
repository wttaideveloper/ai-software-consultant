import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import { logger } from "../../shared/logger/logger.js";
import {
  AI_COMPLEXITY_TO_COST_LEVEL,
  CURRENCY_SYMBOLS,
  type CostComplexityLevel,
  type CostPlatform,
  type CostRole,
} from "./cost.constants.js";
import type {
  ComplexityMultiplierDto,
  CostConfigurationDto,
  CostPreviewDto,
  CostSettingsDto,
  HourlyRateDto,
  PlatformMultiplierDto,
} from "./cost.dto.js";
import {
  calculateCost,
  resolvePlatformKeys,
  resolvePlatformMultiplier,
  type CostDiscountInput,
} from "./cost.engine.js";
import {
  costSettingsRepository,
  type CostSettingsRecord,
} from "./cost.repository.js";
import type {
  PreviewCostQuery,
  UpdateComplexityMultipliersInput,
  UpdateCostSettingsInput,
  UpdateHourlyRatesInput,
  UpdatePlatformMultipliersInput,
} from "./cost.validation.js";

function toSettingsDto(record: CostSettingsRecord): CostSettingsDto {
  return {
    id: record.id,
    organizationId: record.organizationId,
    // numeric columns arrive as strings from the pg driver; converted once here
    // so nothing downstream has to remember to.
    riskBufferPercentage: Number(record.riskBufferPercentage),
    defaultCurrency: record.defaultCurrency,
    currencySymbol: record.currencySymbol,
    taxEnabled: record.taxEnabled,
    taxType: record.taxType,
    taxPercentage: Number(record.taxPercentage),
    discountType: record.discountType,
    discountValue: Number(record.discountValue),
    maxDiscountPercentage: Number(record.maxDiscountPercentage),
    updatedAt: record.updatedAt,
  };
}

/**
 * Turns effort into money.
 *
 * The AI is never asked what a project costs — it estimates hours, complexity
 * and platforms, and this service prices them from the organization's rate card.
 * That separation is the whole point of the module: pricing policy is data an
 * admin owns, not a number a model invents.
 */
export class CostSettingsService {
  /**
   * Reads the organization's rate card, provisioning defaults on first access.
   *
   * Lazy provisioning rather than a seed script: an organization created by
   * registration has no cost rows, and requiring an operator to run a seed
   * before the module works would make a fresh install look broken.
   */
  async getConfiguration(organizationId: string): Promise<CostConfigurationDto> {
    const existing = await costSettingsRepository.findSettings(organizationId);

    if (!existing) {
      await costSettingsRepository.runInTransaction((tx) =>
        costSettingsRepository.ensureDefaults(organizationId, tx),
      );
      logger.info(`Cost settings provisioned for organization ${organizationId}`);
    }

    const [settings, rates, complexity, platforms] = await Promise.all([
      costSettingsRepository.findSettings(organizationId),
      costSettingsRepository.findHourlyRates(organizationId),
      costSettingsRepository.findComplexityMultipliers(organizationId),
      costSettingsRepository.findPlatformMultipliers(organizationId),
    ]);

    if (!settings) {
      throw new AppError(
        "Cost settings could not be initialized.",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      settings: toSettingsDto(settings),
      hourlyRates: rates.map((rate) => ({
        role: rate.role,
        hourlyRate: Number(rate.hourlyRate),
      })),
      complexityMultipliers: complexity.map((row) => ({
        level: row.level,
        multiplier: Number(row.multiplier),
      })),
      platformMultipliers: platforms.map((row) => ({
        platform: row.platform,
        multiplier: Number(row.multiplier),
      })),
    };
  }

  async updateSettings(
    organizationId: string,
    input: UpdateCostSettingsInput,
  ): Promise<CostSettingsDto> {
    await this.getConfiguration(organizationId);

    const updated = await costSettingsRepository.updateSettings(organizationId, {
      ...(input.riskBufferPercentage !== undefined
        ? { riskBufferPercentage: String(input.riskBufferPercentage) }
        : {}),
      ...(input.defaultCurrency !== undefined
        ? {
            defaultCurrency: input.defaultCurrency,
            // Symbol is derived, never taken from the client — the two can then
            // never disagree about what "USD" renders as.
            currencySymbol: CURRENCY_SYMBOLS[input.defaultCurrency],
          }
        : {}),
      ...(input.taxEnabled !== undefined ? { taxEnabled: input.taxEnabled } : {}),
      ...(input.taxType !== undefined ? { taxType: input.taxType } : {}),
      ...(input.taxPercentage !== undefined
        ? { taxPercentage: String(input.taxPercentage) }
        : {}),
      ...(input.discountType !== undefined
        ? { discountType: input.discountType }
        : {}),
      ...(input.discountValue !== undefined
        ? { discountValue: String(input.discountValue) }
        : {}),
      ...(input.maxDiscountPercentage !== undefined
        ? { maxDiscountPercentage: String(input.maxDiscountPercentage) }
        : {}),
    });

    if (!updated) {
      throw new AppError("Cost settings not found.", HTTP_STATUS.NOT_FOUND);
    }

    logger.info(`Cost settings updated for organization ${organizationId}`);
    return toSettingsDto(updated);
  }

  /** Batch save — a rate card is applied whole or not at all. */
  async updateHourlyRates(
    organizationId: string,
    input: UpdateHourlyRatesInput,
  ): Promise<HourlyRateDto[]> {
    await this.getConfiguration(organizationId);

    await costSettingsRepository.runInTransaction(async (tx) => {
      for (const rate of input.rates) {
        await costSettingsRepository.upsertHourlyRate(
          organizationId,
          rate.role,
          rate.hourlyRate.toFixed(2),
          tx,
        );
      }
    });

    const rates = await costSettingsRepository.findHourlyRates(organizationId);
    return rates.map((rate) => ({
      role: rate.role,
      hourlyRate: Number(rate.hourlyRate),
    }));
  }

  async updateComplexityMultipliers(
    organizationId: string,
    input: UpdateComplexityMultipliersInput,
  ): Promise<ComplexityMultiplierDto[]> {
    await this.getConfiguration(organizationId);

    await costSettingsRepository.runInTransaction(async (tx) => {
      for (const item of input.multipliers) {
        await costSettingsRepository.upsertComplexityMultiplier(
          organizationId,
          item.level,
          item.multiplier.toFixed(3),
          tx,
        );
      }
    });

    const rows =
      await costSettingsRepository.findComplexityMultipliers(organizationId);
    return rows.map((row) => ({
      level: row.level,
      multiplier: Number(row.multiplier),
    }));
  }

  async updatePlatformMultipliers(
    organizationId: string,
    input: UpdatePlatformMultipliersInput,
  ): Promise<PlatformMultiplierDto[]> {
    await this.getConfiguration(organizationId);

    await costSettingsRepository.runInTransaction(async (tx) => {
      for (const item of input.multipliers) {
        await costSettingsRepository.upsertPlatformMultiplier(
          organizationId,
          item.platform,
          item.multiplier.toFixed(3),
          tx,
        );
      }
    });

    const rows =
      await costSettingsRepository.findPlatformMultipliers(organizationId);
    return rows.map((row) => ({
      platform: row.platform,
      multiplier: Number(row.multiplier),
    }));
  }

  /**
   * Prices an estimate.
   *
   * The single entry point for every caller — the live preview, the Estimation
   * module and anything added later — so a quote can never be produced by a
   * second, subtly different implementation.
   *
   * Rate resolution, in order: an explicit rate, else the named role's rate,
   * else a blended rate (the mean of the configured roles). Blended is the
   * honest default when effort has not been split by discipline: the AI returns
   * total hours, not hours per role.
   */
  async priceEstimate(
    organizationId: string,
    input: {
      estimatedHours: number;
      complexityLevel?: CostComplexityLevel;
      /** Enum keys, or free-text labels resolved via the alias table. */
      platforms?: CostPlatform[];
      platformLabels?: string[];
      hourlyRate?: number;
      role?: CostRole;
      riskBufferPercentage?: number;
      discount?: CostDiscountInput;
      taxEnabled?: boolean;
      taxPercentage?: number;
    },
  ): Promise<CostPreviewDto> {
    const config = await this.getConfiguration(organizationId);

    const complexityLevel = input.complexityLevel ?? "MEDIUM";
    const complexityMultiplier =
      config.complexityMultipliers.find((row) => row.level === complexityLevel)
        ?.multiplier ?? 1;

    const resolvedLabels = input.platformLabels
      ? resolvePlatformKeys(input.platformLabels)
      : { matched: [], unmatched: [] };

    const platforms = Array.from(
      new Set([...(input.platforms ?? []), ...resolvedLabels.matched]),
    );

    const platformMultiplier = resolvePlatformMultiplier(
      platforms.flatMap((platform) => {
        const match = config.platformMultipliers.find(
          (row) => row.platform === platform,
        );
        return match ? [match.multiplier] : [];
      }),
    );

    let hourlyRate = input.hourlyRate;
    let rateBasis: CostPreviewDto["rateBasis"] = "EXPLICIT";

    if (hourlyRate === undefined && input.role) {
      hourlyRate = config.hourlyRates.find((rate) => rate.role === input.role)
        ?.hourlyRate;
      rateBasis = "ROLE";
    }

    if (hourlyRate === undefined) {
      const rates = config.hourlyRates.map((rate) => rate.hourlyRate);
      // Rounded to 2dp: an unrounded mean (1257.142857…) is not a rate anyone
      // would quote, and it makes the breakdown's arithmetic impossible to check
      // by hand.
      hourlyRate =
        rates.length > 0
          ? Math.round((rates.reduce((sum, rate) => sum + rate, 0) / rates.length) * 100) / 100
          : 0;
      rateBasis = "BLENDED";
    }

    const discount: CostDiscountInput | undefined =
      input.discount ??
      (config.settings.discountValue > 0
        ? {
            type: config.settings.discountType,
            value: config.settings.discountValue,
          }
        : undefined);

    const breakdown = calculateCost({
      estimatedHours: input.estimatedHours,
      rateCard: {
        hourlyRate,
        complexityMultiplier,
        platformMultiplier,
        riskBufferPercentage:
          input.riskBufferPercentage ?? config.settings.riskBufferPercentage,
        taxEnabled: input.taxEnabled ?? config.settings.taxEnabled,
        taxPercentage: input.taxPercentage ?? config.settings.taxPercentage,
        maxDiscountPercentage: config.settings.maxDiscountPercentage,
      },
      discount,
    });

    return {
      currency: config.settings.defaultCurrency,
      currencySymbol: config.settings.currencySymbol,
      complexityLevel,
      platforms,
      unpricedPlatforms: resolvedLabels.unmatched,
      rateBasis,
      breakdown,
    };
  }

  /** Live calculator behind GET /api/cost-settings/preview. */
  async preview(
    organizationId: string,
    query: PreviewCostQuery,
  ): Promise<CostPreviewDto> {
    return this.priceEstimate(organizationId, {
      estimatedHours: query.estimatedHours,
      complexityLevel: query.complexityLevel,
      platforms: query.platforms,
      hourlyRate: query.hourlyRate,
      role: query.role,
      riskBufferPercentage: query.riskBufferPercentage,
      taxEnabled: query.taxEnabled,
      taxPercentage: query.taxPercentage,
      discount:
        query.discountValue !== undefined
          ? {
              type: query.discountType ?? "PERCENTAGE",
              value: query.discountValue,
            }
          : undefined,
    });
  }

  /**
   * Prices what the AI produced. The only translation point between the model's
   * LOW/MEDIUM/HIGH complexity and the four pricing tiers.
   */
  async priceAiEstimate(
    organizationId: string,
    input: {
      estimatedHours: number;
      complexity: "LOW" | "MEDIUM" | "HIGH";
      platformLabels?: string[];
    },
  ): Promise<CostPreviewDto> {
    return this.priceEstimate(organizationId, {
      estimatedHours: input.estimatedHours,
      complexityLevel: AI_COMPLEXITY_TO_COST_LEVEL[input.complexity],
      platformLabels: input.platformLabels,
    });
  }
}

export const costSettingsService = new CostSettingsService();
