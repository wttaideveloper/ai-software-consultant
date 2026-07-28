import { z } from "zod";
import { consultationModeSchema } from "../../shared/constants/consultation-mode.js";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../../shared/constants/app.js";

export const consultationStatuses = [
  "draft",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export const consultationIdParamsSchema = z.object({
  id: z.string().uuid("Consultation id must be a valid UUID"),
});

export const listConsultationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  search: z.string().trim().optional(),
  status: z.enum(consultationStatuses).optional(),
  assignedTo: z.string().uuid("assignedTo must be a valid UUID").optional(),
});

export const createConsultationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must be at most 255 characters"),
  industry: z.string().trim().max(128).nullish(),
  projectType: z.string().trim().max(128).nullish(),
  /** Engagement type. Defaulted, so a caller that omits it creates a new-build consultation exactly as before. */
  consultationMode: consultationModeSchema,
  budgetRange: z.string().trim().max(128).nullish(),
  timeline: z.string().trim().max(128).nullish(),
  assignedTo: z.string().uuid("assignedTo must be a valid UUID").nullish(),
});

export const updateConsultationSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(255, "Title must be at most 255 characters")
      .optional(),
    industry: z.string().trim().max(128).nullish(),
    projectType: z.string().trim().max(128).nullish(),
    // Optional on update (no default): omitting it must leave the stored mode
    // alone rather than silently resetting an engagement to NEW_PROJECT.
    consultationMode: consultationModeSchema.optional(),
    budgetRange: z.string().trim().max(128).nullish(),
    timeline: z.string().trim().max(128).nullish(),
    status: z.enum(consultationStatuses).optional(),
    assignedTo: z.string().uuid("assignedTo must be a valid UUID").nullish(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field must be provided",
  );

export type ListConsultationsQuery = z.infer<
  typeof listConsultationsQuerySchema
>;
export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type UpdateConsultationInput = z.infer<typeof updateConsultationSchema>;
