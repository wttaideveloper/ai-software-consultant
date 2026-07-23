import { api, API_BASE_URL } from "@/services/api";
import type { ApiSuccessResponse, FeatureComplexity, FeaturePriority } from "@/types";

export type MockupFeatureInput = {
  name: string;
  category: string;
  description: string;
  priority: FeaturePriority;
  complexity: FeatureComplexity;
};

export type GenerateMockupsPayload = {
  consultationKey: string;
  requirementSummary: string;
  features: MockupFeatureInput[];
  platforms: string[];
  techStack: string[];
};

export type ClientMockupImage = {
  id: string;
  screenName: string;
  description: string;
  /** Server-relative path; resolved against the API origin, not the SPA's. */
  imageUrl: string;
};

/**
 * `NONE` = nothing generated yet and the only status that authorises starting a
 * (billable) batch; `PENDING` = one is running. `DISABLED` means the operator has
 * not switched image generation on, in which case the section renders nothing.
 */
export type ClientMockupSetStatus =
  | "NONE"
  | "PENDING"
  | "READY"
  | "FAILED"
  | "DISABLED";

export type ClientMockupSet = {
  status: ClientMockupSetStatus;
  images: ClientMockupImage[];
  stale: boolean;
  regenerationsUsed: number;
  regenerationsAllowed: number;
  generatedAt: string | null;
};

/** Images are served by the API, so they need the API origin rather than a relative path. */
export function resolveMockupImageUrl(imageUrl: string): string {
  return `${API_BASE_URL}${imageUrl}`;
}

/** Public, unauthenticated Client Portal endpoints — the GET never triggers generation. */
export const clientMockupsService = {
  async get(consultationKey: string): Promise<ClientMockupSet> {
    const response = await api.get<ApiSuccessResponse<ClientMockupSet>>(
      `/api/client/mockups/${consultationKey}`,
    );
    return response.data.data;
  },

  async generate(payload: GenerateMockupsPayload): Promise<ClientMockupSet> {
    const response = await api.post<ApiSuccessResponse<ClientMockupSet>>(
      "/api/client/mockups",
      payload,
    );
    return response.data.data;
  },

  async regenerate(payload: GenerateMockupsPayload): Promise<ClientMockupSet> {
    const response = await api.post<ApiSuccessResponse<ClientMockupSet>>(
      "/api/client/mockups/regenerate",
      payload,
    );
    return response.data.data;
  },
};
