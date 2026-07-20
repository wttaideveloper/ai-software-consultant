import { api } from "@/services/api";
import type { ApiSuccessResponse, Estimation, UpdateEstimationPayload } from "@/types";

// Backend mounts this module at ".../estimate", not ".../estimation" — verified in app.ts.
const basePath = (consultationId: string) => `/api/consultations/${consultationId}/estimate`;

export const estimationService = {
  async get(consultationId: string): Promise<Estimation> {
    const response = await api.get<ApiSuccessResponse<Estimation>>(basePath(consultationId));
    return response.data.data;
  },

  async generate(consultationId: string): Promise<Estimation> {
    const response = await api.post<ApiSuccessResponse<Estimation>>(
      `${basePath(consultationId)}/generate`,
    );
    return response.data.data;
  },

  async update(consultationId: string, payload: UpdateEstimationPayload): Promise<Estimation> {
    const response = await api.patch<ApiSuccessResponse<Estimation>>(
      basePath(consultationId),
      payload,
    );
    return response.data.data;
  },
};
