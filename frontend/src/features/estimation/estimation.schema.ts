import { z } from "zod";
import type { Estimation, UpdateEstimationPayload } from "@/types";

export const estimationEditSchema = z.object({
  estimatedHours: z.number().int().positive("Must be a positive number"),
  estimatedWeeks: z.number().int().positive("Must be a positive number"),
  estimatedTeamSize: z.number().int().positive("Must be a positive number"),
  assumptions: z.string().trim().min(1, "Assumptions are required"),
  /** One risk per line — split into an array on submit. */
  risks: z.string(),
  breakdown: z
    .array(
      z.object({
        category: z.string().trim().min(1, "Required"),
        hours: z.number().int().nonnegative("Must be 0 or more"),
      }),
    )
    .min(1, "Add at least one breakdown row"),
});

export type EstimationEditValues = z.infer<typeof estimationEditSchema>;

export function estimationToFormValues(estimation: Estimation): EstimationEditValues {
  return {
    estimatedHours: estimation.estimatedHours,
    estimatedWeeks: estimation.estimatedWeeks,
    estimatedTeamSize: estimation.estimatedTeamSize,
    assumptions: estimation.assumptions,
    risks: estimation.risks.join("\n"),
    breakdown:
      estimation.breakdown.length > 0 ? estimation.breakdown : [{ category: "", hours: 0 }],
  };
}

export function formValuesToEstimationPayload(
  values: EstimationEditValues,
): UpdateEstimationPayload {
  return {
    estimatedHours: values.estimatedHours,
    estimatedWeeks: values.estimatedWeeks,
    estimatedTeamSize: values.estimatedTeamSize,
    assumptions: values.assumptions,
    risks: values.risks
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    breakdown: values.breakdown,
  };
}
