import type { ClientFeature } from "@/store/client-consultation.store";

export type ClientFeatureGroup = {
  category: string;
  features: ClientFeature[];
};

export function groupFeaturesByCategory(features: ClientFeature[]): ClientFeatureGroup[] {
  const groups = new Map<string, ClientFeature[]>();

  for (const feature of features) {
    const current = groups.get(feature.category) ?? [];
    current.push(feature);
    groups.set(feature.category, current);
  }

  return Array.from(groups.entries()).map(([category, items]) => ({ category, features: items }));
}
