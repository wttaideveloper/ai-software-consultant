import { z } from "zod";
import {
  CONSULTATION_MODE_OPTIONS,
  CONSULTATION_MODE_VALUES,
  DEFAULT_CONSULTATION_MODE,
} from "@/types/consultation-mode";

/**
 * Built from the shared registry so the admin form can never offer a mode the
 * backend rejects. Label only — a native `<option>` renders no markup, so the
 * registry's icon has nowhere to go here.
 */
export const CONSULTATION_MODE_SELECT_OPTIONS = CONSULTATION_MODE_OPTIONS.map(
  (option) => ({ value: option.mode, label: option.label }),
);

export const consultationFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must be at most 255 characters"),
  industry: z.string().trim().max(128, "Keep it under 128 characters").optional(),
  projectType: z.string().trim().max(128, "Keep it under 128 characters").optional(),
  /** Drives the whole downstream AI pipeline for this consultation, not just a label. */
  /**
   * Required rather than `.default()`: a Zod default makes the resolver's input
   * type optional while its output stays required, which zodResolver rejects.
   * CONSULTATION_FORM_DEFAULTS supplies the initial value instead.
   */
  consultationMode: z.enum(CONSULTATION_MODE_VALUES),
  budgetRange: z.string().trim().max(128, "Keep it under 128 characters").optional(),
  timeline: z.string().trim().max(128, "Keep it under 128 characters").optional(),
  status: z.enum(["draft", "in_progress", "completed", "cancelled"]).optional(),
});

export type ConsultationFormValues = z.infer<typeof consultationFormSchema>;

export const CONSULTATION_FORM_DEFAULTS: ConsultationFormValues = {
  title: "",
  industry: "",
  projectType: "",
  consultationMode: DEFAULT_CONSULTATION_MODE,
  budgetRange: "",
  timeline: "",
  status: "draft",
};
