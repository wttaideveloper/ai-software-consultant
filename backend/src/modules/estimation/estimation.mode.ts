import {
  CONSULTATION_MODES,
  type ConsultationMode,
} from "../../shared/constants/consultation-mode.js";
import { HTTP_STATUS } from "../../shared/constants/http-status.js";
import { AppError } from "../../shared/errors/app-error.js";
import type { AiEstimationPayload } from "./estimation.validation.js";

/**
 * Reconciles a parsed AI estimate with the engagement type it was produced for.
 *
 * Pure — no DB, no AI, no clock — for the same reason cost.engine.ts is: the admin
 * pipeline and the Client Portal must provably apply the same rule, and the rule
 * is testable by calling one function.
 *
 * Zod alone cannot express this. `estimatedWeeks` has to be nullable in the schema
 * so a MAINTENANCE estimate can legitimately omit it, which means the schema can no
 * longer stop a *project* estimate from omitting it too. This function restores
 * that guarantee, and drops mode blocks the model filled in for the wrong
 * engagement type (a habit models fall into when four shapes are described in one
 * prompt). Everything it does is either dropping a value or rejecting — it never
 * invents a number the model did not produce.
 */
/**
 * `Omit` + re-declare rather than an intersection: `estimatedWeeks` is optional on
 * the parsed payload (Zod `.nullish()`), and intersecting an optional property
 * with a required one leaves `undefined` in the union, so callers would still have
 * to handle a third case this function has already eliminated.
 */
export type ModeNormalizedEstimate = Omit<
  AiEstimationPayload,
  "estimatedWeeks"
> & {
  estimatedWeeks: number | null;
};

export function normalizeEstimateForMode(
  payload: AiEstimationPayload,
  mode: ConsultationMode,
): ModeNormalizedEstimate {
  if (mode === CONSULTATION_MODES.MAINTENANCE) {
    if (!payload.maintenancePlan) {
      throw new AppError(
        "AI returned incomplete maintenance planning data",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      ...payload,
      // Forced, not merely trusted: a support engagement has no delivery date, and
      // models habitually fill a weeks field simply because it exists.
      estimatedWeeks: null,
      maintenancePlan: payload.maintenancePlan,
      migrationPlan: null,
      enhancementImpact: null,
    };
  }

  if (typeof payload.estimatedWeeks !== "number") {
    throw new AppError(
      "AI returned an estimate with no delivery timeline",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }

  if (mode === CONSULTATION_MODES.MODERNIZATION) {
    if (!payload.migrationPlan) {
      throw new AppError(
        "AI returned incomplete migration planning data",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      ...payload,
      estimatedWeeks: payload.estimatedWeeks,
      migrationPlan: payload.migrationPlan,
      maintenancePlan: null,
      enhancementImpact: null,
    };
  }

  if (mode === CONSULTATION_MODES.FEATURE_ENHANCEMENT) {
    if (!payload.enhancementImpact) {
      throw new AppError(
        "AI returned incomplete enhancement impact data",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      ...payload,
      estimatedWeeks: payload.estimatedWeeks,
      enhancementImpact: payload.enhancementImpact,
      maintenancePlan: null,
      migrationPlan: null,
    };
  }

  // NEW_PROJECT carries no engagement block at all.
  return {
    ...payload,
    estimatedWeeks: payload.estimatedWeeks,
    maintenancePlan: null,
    migrationPlan: null,
    enhancementImpact: null,
  };
}
