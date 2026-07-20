import { z } from "zod";

export const consultationFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must be at most 255 characters"),
  industry: z.string().trim().max(128, "Keep it under 128 characters").optional(),
  projectType: z.string().trim().max(128, "Keep it under 128 characters").optional(),
  budgetRange: z.string().trim().max(128, "Keep it under 128 characters").optional(),
  timeline: z.string().trim().max(128, "Keep it under 128 characters").optional(),
  status: z.enum(["draft", "in_progress", "completed", "cancelled"]).optional(),
});

export type ConsultationFormValues = z.infer<typeof consultationFormSchema>;

export const CONSULTATION_FORM_DEFAULTS: ConsultationFormValues = {
  title: "",
  industry: "",
  projectType: "",
  budgetRange: "",
  timeline: "",
  status: "draft",
};
