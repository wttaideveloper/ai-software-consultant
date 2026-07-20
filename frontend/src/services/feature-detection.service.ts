import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  DetectedFeature,
  DetectedFeaturesResponse,
  UpdateFeaturePayload,
} from "@/types";

export const featureDetectionService = {
  async list(consultationId: string): Promise<DetectedFeaturesResponse> {
    const response = await api.get<ApiSuccessResponse<DetectedFeaturesResponse>>(
      `/api/consultations/${consultationId}/features`,
    );
    return response.data.data;
  },

  async detect(consultationId: string): Promise<DetectedFeaturesResponse> {
    const response = await api.post<ApiSuccessResponse<DetectedFeaturesResponse>>(
      `/api/consultations/${consultationId}/features/detect`,
    );
    return response.data.data;
  },

  async update(featureId: string, payload: UpdateFeaturePayload): Promise<DetectedFeature> {
    const response = await api.patch<ApiSuccessResponse<DetectedFeature>>(
      `/api/features/${featureId}`,
      payload,
    );
    return response.data.data;
  },

  async remove(featureId: string): Promise<void> {
    await api.delete<ApiSuccessResponse<null>>(`/api/features/${featureId}`);
  },
};
