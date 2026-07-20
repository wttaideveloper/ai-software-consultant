import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  Consultation,
  CreateConsultationPayload,
  ListConsultationsParams,
  Paginated,
  UpdateConsultationPayload,
} from "@/types";

const CONSULTATIONS_ENDPOINT = "/api/consultations";

export const consultationsService = {
  async list(params: ListConsultationsParams = {}): Promise<Paginated<Consultation>> {
    const response = await api.get<ApiSuccessResponse<Paginated<Consultation>>>(
      CONSULTATIONS_ENDPOINT,
      { params },
    );
    return response.data.data;
  },

  async getById(id: string): Promise<Consultation> {
    const response = await api.get<ApiSuccessResponse<Consultation>>(
      `${CONSULTATIONS_ENDPOINT}/${id}`,
    );
    return response.data.data;
  },

  async create(payload: CreateConsultationPayload): Promise<Consultation> {
    const response = await api.post<ApiSuccessResponse<Consultation>>(
      CONSULTATIONS_ENDPOINT,
      payload,
    );
    return response.data.data;
  },

  async update(id: string, payload: UpdateConsultationPayload): Promise<Consultation> {
    const response = await api.patch<ApiSuccessResponse<Consultation>>(
      `${CONSULTATIONS_ENDPOINT}/${id}`,
      payload,
    );
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete<ApiSuccessResponse<null>>(`${CONSULTATIONS_ENDPOINT}/${id}`);
  },
};
