import { z } from "zod";
import type { CreateFeatureLibraryPayload, FeatureLibraryItem } from "@/types";

export const featureLibraryFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  category: z.string().trim().min(1, "Category is required").max(128),
  description: z.string().trim().min(1, "Description is required"),
  defaultComplexity: z.enum(["LOW", "MEDIUM", "HIGH"]),
  defaultEstimatedHours: z.number().int().positive("Must be a positive number"),
  /** One tag/technology per line — split into an array on submit. */
  tags: z.string(),
  technologies: z.string(),
  notes: z.string(),
  isActive: z.boolean(),
});

export type FeatureLibraryFormValues = z.infer<typeof featureLibraryFormSchema>;

export const FEATURE_LIBRARY_FORM_DEFAULTS: FeatureLibraryFormValues = {
  name: "",
  category: "",
  description: "",
  defaultComplexity: "MEDIUM",
  defaultEstimatedHours: 0,
  tags: "",
  technologies: "",
  notes: "",
  isActive: true,
};

function toLines(items: string[]): string {
  return items.join("\n");
}

function toItems(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function featureLibraryItemToFormValues(item: FeatureLibraryItem): FeatureLibraryFormValues {
  return {
    name: item.name,
    category: item.category,
    description: item.description,
    defaultComplexity: item.defaultComplexity,
    defaultEstimatedHours: item.defaultEstimatedHours,
    tags: toLines(item.tags),
    technologies: toLines(item.technologies),
    notes: item.notes ?? "",
    isActive: item.isActive,
  };
}

export function formValuesToPayload(values: FeatureLibraryFormValues): CreateFeatureLibraryPayload {
  return {
    name: values.name,
    category: values.category,
    description: values.description,
    defaultComplexity: values.defaultComplexity,
    defaultEstimatedHours: values.defaultEstimatedHours,
    tags: toItems(values.tags),
    technologies: toItems(values.technologies),
    notes: values.notes.trim() || null,
    isActive: values.isActive,
  };
}
