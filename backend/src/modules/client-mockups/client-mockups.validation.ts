import { z } from "zod";
import { featureComplexityEnum, featurePriorityEnum } from "../../db/schema/enums.js";

/**
 * The cache identity for one Client Portal visit. A UUID rather than free text so
 * a caller cannot mint unbounded distinct keys from guessable strings, and so it
 * maps straight onto the uuid column.
 */
export const consultationKeySchema = z.string().uuid("A valid consultation key is required");

const mockupFeatureSchema = z.object({
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().max(120).default(""),
  description: z.string().trim().max(2_000).default(""),
  priority: z.enum(featurePriorityEnum.enumValues),
  complexity: z.enum(featureComplexityEnum.enumValues),
});

export const generateMockupsSchema = z.object({
  consultationKey: consultationKeySchema,
  requirementSummary: z.string().trim().min(1, "A requirement summary is required").max(40_000),
  // Bounded so one request cannot inflate the planning prompt arbitrarily.
  features: z.array(mockupFeatureSchema).min(1, "At least one feature is required").max(60),
  platforms: z.array(z.string().trim().max(120)).max(20).default([]),
  techStack: z.array(z.string().trim().max(120)).max(40).default([]),
});

export const mockupSetParamsSchema = z.object({
  consultationKey: consultationKeySchema,
});

export const mockupImageParamsSchema = z.object({
  imageId: z.string().uuid("A valid image id is required"),
});

export type GenerateMockupsInput = z.infer<typeof generateMockupsSchema>;
export type MockupSetParams = z.infer<typeof mockupSetParamsSchema>;
export type MockupImageParams = z.infer<typeof mockupImageParamsSchema>;
export type MockupFeatureInput = z.infer<typeof mockupFeatureSchema>;

/** The planner's contract — mirrors the CONCEPT_SCREENS prompt's documented shape. */
export const aiConceptScreensPayloadSchema = z.object({
  screens: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        description: z.string().trim().min(1).max(500),
        imagePrompt: z.string().trim().min(1).max(4_000),
      }),
    )
    .min(1, "The planner returned no screens"),
});
