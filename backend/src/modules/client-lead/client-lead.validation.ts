import { z } from "zod";

const featureInputSchema = z.object({
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  included: z.boolean(),
});

const estimateBreakdownItemSchema = z.object({
  category: z.string().trim().min(1),
  hours: z.number(),
});

const estimateInputSchema = z.object({
  estimatedHours: z.number(),
  estimatedWeeks: z.number(),
  teamSize: z.number(),
  complexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(0).max(1),
  assumptions: z.array(z.string()),
  risks: z.array(z.string()),
  breakdown: z.array(estimateBreakdownItemSchema),
});

export const createClientLeadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  country: z.string().trim().optional(),
  preferredContactMethod: z.enum(["EMAIL", "PHONE", "WHATSAPP"]).default("EMAIL"),
  notes: z.string().trim().optional(),

  projectIdea: z.string().trim().min(1, "Project idea is required"),
  consultationTime: z.string().trim().min(1, "Consultation time is required"),
  platforms: z.array(z.string()).min(1, "At least one platform is required"),
  otherPlatform: z.string().trim().optional(),

  requirementSummary: z.string().trim().min(1, "A requirement summary is required"),
  features: z.array(featureInputSchema).min(1, "At least one feature is required"),
  estimate: estimateInputSchema,
});

export type CreateClientLeadInput = z.infer<typeof createClientLeadSchema>;
