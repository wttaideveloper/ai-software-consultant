/**
 * Cost Management — the pricing engine's configuration.
 *
 * Every union mirrors a pgEnum exactly. The AI never returns a cost; it returns
 * effort, and these settings turn effort into a price.
 */

export const COST_ROLES = [
  "FRONTEND",
  "BACKEND",
  "UI_UX_DESIGN",
  "QA_TESTING",
  "DEVOPS",
  "PROJECT_MANAGEMENT",
  "AI_DEVELOPMENT",
] as const;
export type CostRole = (typeof COST_ROLES)[number];

export const COST_COMPLEXITY_LEVELS = [
  "SIMPLE",
  "MEDIUM",
  "COMPLEX",
  "ENTERPRISE",
] as const;
export type CostComplexityLevel = (typeof COST_COMPLEXITY_LEVELS)[number];

export const COST_PLATFORMS = [
  "WEB",
  "ANDROID",
  "IOS",
  "DESKTOP",
  "ADMIN_PANEL",
  "API",
  "AI_INTEGRATION",
] as const;
export type CostPlatform = (typeof COST_PLATFORMS)[number];

export const COST_CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
export type CostCurrency = (typeof COST_CURRENCIES)[number];

export const COST_TAX_TYPES = ["GST", "VAT", "SERVICE_TAX"] as const;
export type CostTaxType = (typeof COST_TAX_TYPES)[number];

export const COST_DISCOUNT_TYPES = ["PERCENTAGE", "FIXED"] as const;
export type CostDiscountType = (typeof COST_DISCOUNT_TYPES)[number];

export type CostSettings = {
  id: string;
  organizationId: string;
  riskBufferPercentage: number;
  defaultCurrency: CostCurrency;
  currencySymbol: string;
  taxEnabled: boolean;
  taxType: CostTaxType;
  taxPercentage: number;
  discountType: CostDiscountType;
  discountValue: number;
  maxDiscountPercentage: number;
  updatedAt: string;
};

export type HourlyRate = { role: CostRole; hourlyRate: number };
export type ComplexityMultiplier = {
  level: CostComplexityLevel;
  multiplier: number;
};
export type PlatformMultiplier = {
  platform: CostPlatform;
  multiplier: number;
};

/** Everything the Cost Settings page loads and saves, in one shape. */
export type CostConfiguration = {
  settings: CostSettings;
  hourlyRates: HourlyRate[];
  complexityMultipliers: ComplexityMultiplier[];
  platformMultipliers: PlatformMultiplier[];
};

/** Every intermediate figure, so a quote is auditable rather than a single total. */
export type CostBreakdown = {
  estimatedHours: number;
  hourlyRate: number;
  complexityMultiplier: number;
  platformMultiplier: number;
  baseCost: number;
  developmentCost: number;
  riskBufferPercentage: number;
  riskBufferAmount: number;
  subtotal: number;
  discountAmount: number;
  /** True when the requested discount hit the configured ceiling. */
  discountCapped: boolean;
  taxPercentage: number;
  taxAmount: number;
  finalPrice: number;
};

export type CostPreview = {
  currency: CostCurrency;
  currencySymbol: string;
  complexityLevel: CostComplexityLevel;
  platforms: CostPlatform[];
  /** Platform labels that aren't priced — surfaced, never silently dropped. */
  unpricedPlatforms: string[];
  rateBasis: "EXPLICIT" | "ROLE" | "BLENDED";
  breakdown: CostBreakdown;
};

export type UpdateCostSettingsPayload = Partial<{
  riskBufferPercentage: number;
  defaultCurrency: CostCurrency;
  taxEnabled: boolean;
  taxType: CostTaxType;
  taxPercentage: number;
  discountType: CostDiscountType;
  discountValue: number;
  maxDiscountPercentage: number;
}>;

export type PreviewCostParams = {
  estimatedHours: number;
  hourlyRate?: number;
  role?: CostRole;
  complexityLevel?: CostComplexityLevel;
  platforms?: CostPlatform[];
  riskBufferPercentage?: number;
  discountType?: CostDiscountType;
  discountValue?: number;
  taxEnabled?: boolean;
  taxPercentage?: number;
};
