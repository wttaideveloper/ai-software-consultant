import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  ClientLead,
  ListClientLeadsParams,
  Paginated,
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
};
