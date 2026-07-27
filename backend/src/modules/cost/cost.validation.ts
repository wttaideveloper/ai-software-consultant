import { z } from "zod";
import {
  costComplexityLevelEnum,
  costCurrencyEnum,
  costDiscountTypeEnum,
  costPlatformEnum,
  costRoleEnum,
  costTaxTypeEnum,
} from "../../db/schema/enums.js";

/**
 * Validation mirrors the module's stated rules exactly:
 *   rate > 0, multiplier >= 1, risk 0–100, discount 0–100, tax 0–100.
 *
 * A multiplier below 1 is rejected rather than clamped: it would mean a
 * complexity tier or platform makes a project cheaper than baseline, which is
 * always a data-entry mistake and should be visible as one.
 */
const percentageSchema = z
  .number()
  .min(0, "Must be 0 or more")
  .max(100, "Must be 100 or less");

const multiplierSchema = z
  .number()
  .min(1, "Multiplier must be at least 1")
  .max(99, "Multiplier must be 99 or less");

const rateSchema = z
  .number()
  .positive("Hourly rate must be greater than 0")
  .max(9_999_999, "Hourly rate is unrealistically high");

export const updateCostSettingsSchema = z
  .object({
    riskBufferPercentage: percentageSchema.optional(),
    defaultCurrency: z.enum(costCurrencyEnum.enumValues).optional(),
    taxEnabled: z.boolean().optional(),
    taxType: z.enum(costTaxTypeEnum.enumValues).optional(),
    taxPercentage: percentageSchema.optional(),
    discountType: z.enum(costDiscountTypeEnum.enumValues).optional(),
    /** A fixed discount is an amount, so it is not bounded by 100. */
    discountValue: z.number().min(0, "Discount cannot be negative").optional(),
    maxDiscountPercentage: percentageSchema.optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided",
  )
  .refine(
    (value) =>
      value.discountType !== "PERCENTAGE" ||
      value.discountValue === undefined ||
      value.discountValue <= 100,
    {
      message: "A percentage discount cannot exceed 100",
      path: ["discountValue"],
    },
  );

export type UpdateCostSettingsInput = z.infer<typeof updateCostSettingsSchema>;

/**
 * Rates and multipliers are saved as a batch, not one row per request: the
 * Cost Settings page has one Save button, and a partial save would leave a rate
 * card half-applied to live quotes.
 */
export const updateHourlyRatesSchema = z.object({
  rates: z
    .array(
      z.object({
        role: z.enum(costRoleEnum.enumValues),
        hourlyRate: rateSchema,
      }),
    )
    .min(1, "At least one rate must be provided"),
});

export type UpdateHourlyRatesInput = z.infer<typeof updateHourlyRatesSchema>;

/**
 * @deprecated Complexity multipliers no longer affect any price — the engine
 * stopped reading them. Kept so the existing endpoint and stored rows continue
 * to work; delete together with the table when the data is no longer needed.
 */
export const updateComplexityMultipliersSchema = z.object({
  multipliers: z
    .array(
      z.object({
        level: z.enum(costComplexityLevelEnum.enumValues),
        multiplier: multiplierSchema,
      }),
    )
    .min(1, "At least one multiplier must be provided"),
});

export type UpdateComplexityMultipliersInput = z.infer<
  typeof updateComplexityMultipliersSchema
>;

export const updatePlatformMultipliersSchema = z.object({
  multipliers: z
    .array(
      z.object({
        platform: z.enum(costPlatformEnum.enumValues),
        multiplier: multiplierSchema,
      }),
    )
    .min(1, "At least one multiplier must be provided"),
});

export type UpdatePlatformMultipliersInput = z.infer<
  typeof updatePlatformMultipliersSchema
>;

/**
 * Live preview query. Everything is optional except the hours: the calculator
 * falls back to the saved rate card for anything the caller doesn't override,
 * so the preview shows what a real estimate would cost today.
 */
export const previewCostQuerySchema = z.object({
  estimatedHours: z.coerce.number().min(0, "Hours cannot be negative"),
  /** Explicit rate wins; otherwise the role's rate; otherwise a blended rate. */
  hourlyRate: z.coerce.number().positive().optional(),
  role: z.enum(costRoleEnum.enumValues).optional(),
  // No complexityLevel: complexity does not affect price, so the preview has
  // nothing to vary by and the control was removed from the UI.
  /**
   * Repeatable query param (?platforms=WEB&platforms=IOS). A single value
   * arrives as a string, so it is normalized to an array before validation.
   */
  platforms: z
    .preprocess(
      (value) =>
        value === undefined ? undefined : Array.isArray(value) ? value : [value],
      z.array(z.enum(costPlatformEnum.enumValues)),
    )
    .optional(),
  riskBufferPercentage: z.coerce.number().min(0).max(100).optional(),
  discountType: z.enum(costDiscountTypeEnum.enumValues).optional(),
  discountValue: z.coerce.number().min(0).optional(),
  taxEnabled: z
    .preprocess((value) => (value === undefined ? undefined : value === "true" || value === true), z.boolean())
    .optional(),
  taxPercentage: z.coerce.number().min(0).max(100).optional(),
});

export type PreviewCostQuery = z.infer<typeof previewCostQuerySchema>;
