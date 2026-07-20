import type { FeatureComplexity, FeaturePriority } from "@/types";

type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger";

export const PRIORITY_META: Record<FeaturePriority, { label: string; variant: BadgeVariant }> = {
  HIGH: { label: "High Priority", variant: "danger" },
  MEDIUM: { label: "Medium Priority", variant: "warning" },
  LOW: { label: "Low Priority", variant: "default" },
};

export const COMPLEXITY_META: Record<FeatureComplexity, { label: string; variant: BadgeVariant }> = {
  HIGH: { label: "High Complexity", variant: "danger" },
  MEDIUM: { label: "Medium Complexity", variant: "warning" },
  LOW: { label: "Low Complexity", variant: "default" },
};

export const PRIORITY_OPTIONS: Array<{ label: string; value: FeaturePriority }> = [
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
];

export const COMPLEXITY_OPTIONS: Array<{ label: string; value: FeatureComplexity }> = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
];
