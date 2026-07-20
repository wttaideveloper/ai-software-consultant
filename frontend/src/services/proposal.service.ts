import { api } from "@/services/api";
import type { ApiSuccessResponse, Proposal, UpdateProposalPayload } from "@/types";

const basePath = (consultationId: string) => `/api/consultations/${consultationId}/proposal`;

export const proposalService = {
  async get(consultationId: string): Promise<Proposal> {
    const response = await api.get<ApiSuccessResponse<Proposal>>(basePath(consultationId));
    return response.data.data;
  },

  async generate(consultationId: string): Promise<Proposal> {
    const response = await api.post<ApiSuccessResponse<Proposal>>(
      `${basePath(consultationId)}/generate`,
    );
    return response.data.data;
  },

  async update(consultationId: string, payload: UpdateProposalPayload): Promise<Proposal> {
    const response = await api.patch<ApiSuccessResponse<Proposal>>(
      basePath(consultationId),
      payload,
    );
    return response.data.data;
  },
};
