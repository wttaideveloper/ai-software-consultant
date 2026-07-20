import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  CreateFeatureLibraryPayload,
  FeatureLibraryItem,
  ListFeatureLibraryParams,
  Paginated,
  UpdateFeatureLibraryPayload,
} from "@/types";

const ENDPOINT = "/api/feature-library";

export const featureLibraryService = {
  async list(params: ListFeatureLibraryParams = {}): Promise<Paginated<FeatureLibraryItem>> {
    const response = await api.get<ApiSuccessResponse<Paginated<FeatureLibraryItem>>>(ENDPOINT, {
      params,
    });
    return response.data.data;
  },

  async create(payload: CreateFeatureLibraryPayload): Promise<FeatureLibraryItem> {
    const response = await api.post<ApiSuccessResponse<FeatureLibraryItem>>(ENDPOINT, payload);
    return response.data.data;
  },

  async update(id: string, payload: UpdateFeatureLibraryPayload): Promise<FeatureLibraryItem> {
    const response = await api.patch<ApiSuccessResponse<FeatureLibraryItem>>(
      `${ENDPOINT}/${id}`,
      payload,
    );
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete<ApiSuccessResponse<null>>(`${ENDPOINT}/${id}`);
  },
};
