import { z } from "zod";

export const generateClientFeaturesSchema = z.object({
  summary: z.string().trim().min(1, "A requirement summary is required"),
});

export type GenerateClientFeaturesInput = z.infer<typeof generateClientFeaturesSchema>;
