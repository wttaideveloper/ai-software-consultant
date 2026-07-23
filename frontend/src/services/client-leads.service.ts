import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  ClientLead,
  ClientLeadDetail,
  ListClientLeadsParams,
  Paginated,
  UpdateClientLeadPayload,
} from "@/types";

const ENDPOINT = "/api/client-leads";

export const clientLeadsService = {
  async list(
    params: ListClientLeadsParams = {},
  ): Promise<Paginated<ClientLead>> {
    const response = await api.get<ApiSuccessResponse<Paginated<ClientLead>>>(
      ENDPOINT,
      { params },
    );
    return response.data.data;
  },

  async getById(id: string): Promise<ClientLeadDetail> {
    const response = await api.get<ApiSuccessResponse<ClientLeadDetail>>(
      `${ENDPOINT}/${id}`,
    );
    return response.data.data;
  },

  async update(
    id: string,
    payload: UpdateClientLeadPayload,
  ): Promise<ClientLeadDetail> {
    const response = await api.patch<ApiSuccessResponse<ClientLeadDetail>>(
      `${ENDPOINT}/${id}`,
      payload,
    );
    return response.data.data;
  },
};
