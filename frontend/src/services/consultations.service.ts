import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  Consultation,
  ListConsultationsParams,
  Paginated,
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
};
