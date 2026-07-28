import { z } from "zod";
import { consultationModeSchema } from "../../shared/constants/consultation-mode.js";

export const generateClientFeaturesSchema = z.object({
  consultationMode: consultationModeSchema,
  summary: z.string().trim().min(1, "A requirement summary is required"),
});

export type GenerateClientFeaturesInput = z.infer<typeof generateClientFeaturesSchema>;
