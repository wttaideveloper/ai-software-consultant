import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  RequirementSummary,
  UpdateRequirementSummaryPayload,
} from "@/types";

export const requirementSummaryService = {
  async get(consultationId: string): Promise<RequirementSummary> {
    const response = await api.get<ApiSuccessResponse<RequirementSummary>>(
      `/api/consultations/${consultationId}/requirement-summary`,
    );
    return response.data.data;
  },

  async generate(consultationId: string): Promise<RequirementSummary> {
    const response = await api.post<ApiSuccessResponse<RequirementSummary>>(
      `/api/consultations/${consultationId}/requirement-summary/generate`,
    );
    return response.data.data;
  },

  async update(
    consultationId: string,
    payload: UpdateRequirementSummaryPayload,
  ): Promise<RequirementSummary> {
    const response = await api.patch<ApiSuccessResponse<RequirementSummary>>(
      `/api/consultations/${consultationId}/requirement-summary`,
      payload,
    );
    return response.data.data;
  },
};
