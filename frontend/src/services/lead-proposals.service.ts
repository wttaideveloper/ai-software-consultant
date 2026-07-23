import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  CreateLeadProposalPayload,
  LeadProposal,
  LeadProposalDetail,
  LeadProposalStatus,
  LeadProposalVersions,
  ListLeadProposalsParams,
  Paginated,
  UpdateLeadProposalPayload,
} from "@/types";

const LIBRARY_ENDPOINT = "/api/lead-proposals";
const versionsEndpoint = (leadId: string) =>
  `/api/client-leads/${leadId}/proposals`;

export const leadProposalsService = {
  /** Every version of one lead, plus the total/latest/active roll-up. */
  async listByLead(leadId: string): Promise<LeadProposalVersions> {
    const response = await api.get<ApiSuccessResponse<LeadProposalVersions>>(
      versionsEndpoint(leadId),
    );
    return response.data.data;
  },

  /** Proposal library — every version across every lead. */
  async list(
    params: ListLeadProposalsParams = {},
  ): Promise<Paginated<LeadProposal>> {
    const response = await api.get<ApiSuccessResponse<Paginated<LeadProposal>>>(
      LIBRARY_ENDPOINT,
      { params },
    );
    return response.data.data;
  },

  async getById(proposalId: string): Promise<LeadProposalDetail> {
    const response = await api.get<ApiSuccessResponse<LeadProposalDetail>>(
      `${LIBRARY_ENDPOINT}/${proposalId}`,
    );
    return response.data.data;
  },

  async create(
    leadId: string,
    payload: CreateLeadProposalPayload,
  ): Promise<LeadProposalDetail> {
    const response = await api.post<ApiSuccessResponse<LeadProposalDetail>>(
      versionsEndpoint(leadId),
      payload,
    );
    return response.data.data;
  },

  async update(
    proposalId: string,
    payload: UpdateLeadProposalPayload,
  ): Promise<LeadProposalDetail> {
    const response = await api.patch<ApiSuccessResponse<LeadProposalDetail>>(
      `${LIBRARY_ENDPOINT}/${proposalId}`,
      payload,
    );
    return response.data.data;
  },

  /** Backs Mark Ready / Sent / Accepted / Rejected and Archive. */
  async updateStatus(
    proposalId: string,
    status: LeadProposalStatus,
  ): Promise<LeadProposalDetail> {
    const response = await api.patch<ApiSuccessResponse<LeadProposalDetail>>(
      `${LIBRARY_ENDPOINT}/${proposalId}/status`,
      { status },
    );
    return response.data.data;
  },

  /** Drafts only — the server rejects anything further along. */
  async remove(proposalId: string): Promise<void> {
    await api.delete(`${LIBRARY_ENDPOINT}/${proposalId}`);
  },
};
