import type { CostBreakdown } from "./cost.engine.js";
import type {
  CostComplexityLevel,
  CostCurrency,
  CostPlatform,
  CostRole,
} from "./cost.constants.js";

export type CostSettingsDto = {
  id: string;
  organizationId: string;
  riskBufferPercentage: number;
  defaultCurrency: CostCurrency;
  currencySymbol: string;
  taxEnabled: boolean;
  taxType: "GST" | "VAT" | "SERVICE_TAX";
  taxPercentage: number;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscountPercentage: number;
  updatedAt: Date;
};

export type HourlyRateDto = {
  role: CostRole;
  hourlyRate: number;
};

export type ComplexityMultiplierDto = {
  level: CostComplexityLevel;
  multiplier: number;
};

export type PlatformMultiplierDto = {
  platform: CostPlatform;
  multiplier: number;
};

/**
 * Everything the Cost Settings page needs in one response.
 *
 * One request rather than four: the page renders and previews as a unit, and a
 * partially-loaded rate card would compute a price from a mix of saved and
 * unsaved values.
 */
export type CostConfigurationDto = {
  settings: CostSettingsDto;
  hourlyRates: HourlyRateDto[];
  /**
   * @deprecated No longer used in pricing. Complexity multipliers double-counted
   * complexity (the AI already reflects it in the hours it returns), so the
   * engine stopped reading them. Still returned, and still stored, so existing
   * rows and any external reader keep working — remove once nothing consumes it.
   */
  complexityMultipliers: ComplexityMultiplierDto[];
  platformMultipliers: PlatformMultiplierDto[];
};

/**
 * A priced estimate. `breakdown` is every intermediate figure, so the estimate
 * screen, the proposal and the preview all show the same auditable maths rather
 * than a single opaque total.
 */
export type CostPreviewDto = {
  currency: CostCurrency;
  currencySymbol: string;
  /**
   * Informational only. Retained for display, reporting and the frozen lead
   * snapshot — it has no effect on any figure in `breakdown`.
   */
  complexityLevel: CostComplexityLevel;
  platforms: CostPlatform[];
  /** Platform labels the caller supplied that are not priced — never silently dropped. */
  unpricedPlatforms: string[];
  /** How the hourly rate was arrived at, since three sources are possible. */
  rateBasis: "EXPLICIT" | "ROLE" | "BLENDED";
  breakdown: CostBreakdown;
};
