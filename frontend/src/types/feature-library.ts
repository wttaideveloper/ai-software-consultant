import type { FeatureComplexity } from "./feature";

export type FeatureLibraryItem = {
  id: string;
  organizationId: string;
  name: string;
  category: string;
  description: string;
  defaultComplexity: FeatureComplexity;
  defaultEstimatedHours: number;
  tags: string[];
  technologies: string[];
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ListFeatureLibraryParams = {
  page?: number;
  pageSize?: number;
  name?: string;
  category?: string;
  tag?: string;
  isActive?: boolean;
};

export type CreateFeatureLibraryPayload = {
  name: string;
  category: string;
  description: string;
  defaultComplexity: FeatureComplexity;
  defaultEstimatedHours: number;
  tags: string[];
  technologies: string[];
  notes?: string | null;
  isActive?: boolean;
};

export type UpdateFeatureLibraryPayload = Partial<CreateFeatureLibraryPayload>;
