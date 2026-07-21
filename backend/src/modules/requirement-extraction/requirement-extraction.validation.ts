import { z } from "zod";

export const consultationIdParamsSchema = z.object({
  consultationId: z.string().uuid("Consultation id must be a valid UUID"),
});

const requirementFeatureSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
});

export const structuredRequirementSchema = z.object({
  project: z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    industry: z.string().nullable(),
    summary: z.string().min(1),
  }),
  businessGoals: z.array(z.string().min(1)).min(1),
  applications: z
    .array(
      z.object({
        name: z.string().min(1),
        platform: z.enum(["web", "ios", "android", "desktop", "api"]),
        description: z.string().min(1),
      }),
    )
    .min(1),
  targetUsers: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
      }),
    )
    .min(1),
  actors: z
    .array(
      z.object({
        name: z.string().min(1),
        responsibilities: z.array(z.string().min(1)),
      }),
    )
    .min(1),
  modules: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        features: z.array(z.string().min(1)),
      }),
    )
    .min(1),
  customerFeatures: z.array(requirementFeatureSchema),
  sellerFeatures: z.array(requirementFeatureSchema),
  adminFeatures: z.array(requirementFeatureSchema),
  integrations: z.array(
    z.object({
      name: z.string().min(1),
      purpose: z.string().min(1),
      required: z.boolean(),
    }),
  ),
  payment: z.object({
    methods: z.array(z.string().min(1)),
    providers: z.array(z.string().min(1)),
    notes: z.string(),
  }),
  notifications: z.object({
    channels: z.array(z.string().min(1)),
    triggers: z.array(z.string().min(1)),
  }),
  security: z.object({
    authMethods: z.array(z.string().min(1)),
    complianceRequirements: z.array(z.string().min(1)),
    notes: z.string(),
  }),
  scalability: z.object({
    expectedLoad: z.string().nullable(),
    notes: z.string(),
  }),
  deployment: z.object({
    targetEnvironment: z.array(z.string().min(1)),
    ciCdRequirements: z.array(z.string().min(1)),
    notes: z.string(),
  }),
  technicalRequirements: z.array(z.string().min(1)),
  businessRules: z.array(z.string().min(1)),
  assumptions: z.array(z.string().min(1)),
  risks: z.array(z.string().min(1)),
  futureScope: z.array(z.string().min(1)),
  openQuestions: z.array(z.string().min(1)),
});

export type StructuredRequirementInput = z.infer<
  typeof structuredRequirementSchema
>;
