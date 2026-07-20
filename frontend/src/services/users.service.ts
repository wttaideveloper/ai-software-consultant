import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  CreateOrgUserPayload,
  ListOrgUsersParams,
  OrgUser,
  Paginated,
  UpdateOrgUserPayload,
} from "@/types";

const ENDPOINT = "/api/users";

export const usersService = {
  async list(params: ListOrgUsersParams = {}): Promise<Paginated<OrgUser>> {
    const response = await api.get<ApiSuccessResponse<Paginated<OrgUser>>>(ENDPOINT, { params });
    return response.data.data;
  },

  async create(payload: CreateOrgUserPayload): Promise<OrgUser> {
    const response = await api.post<ApiSuccessResponse<OrgUser>>(ENDPOINT, payload);
    return response.data.data;
  },

  async update(id: string, payload: UpdateOrgUserPayload): Promise<OrgUser> {
    const response = await api.patch<ApiSuccessResponse<OrgUser>>(`${ENDPOINT}/${id}`, payload);
    return response.data.data;
  },

  async remove(id: string): Promise<void> {
    await api.delete<ApiSuccessResponse<null>>(`${ENDPOINT}/${id}`);
  },
};
