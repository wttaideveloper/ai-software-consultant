import { api } from "@/services/api";
import type {
  ApiSuccessResponse,
  CreateLeadProposalPayload,
  LeadProposal,
  LeadProposalDetail,
  LeadProposalEditSession,
  LeadProposalLeadRollup,
  LeadProposalStatus,
  LeadProposalVersions,
  ListLeadProposalsParams,
  Paginated,
  RegenerateLeadProposalPayload,
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

  /** Same endpoint and filters as list(), grouped by client instead of version. */
  async listByClient(
    params: ListLeadProposalsParams = {},
  ): Promise<Paginated<LeadProposalLeadRollup>> {
    const response = await api.get<
      ApiSuccessResponse<Paginated<LeadProposalLeadRollup>>
    >(LIBRARY_ENDPOINT, { params: { ...params, groupBy: "clients" } });
    return response.data.data;
  },

  /**
   * Asks the server to open a version for editing. Returns that version when it
   * is a draft, or a new draft forked from it when it is locked — the server
   * applies the rules, the client just follows the answer.
   */
  async openForEditing(proposalId: string): Promise<LeadProposalEditSession> {
    const response = await api.post<ApiSuccessResponse<LeadProposalEditSession>>(
      `${LIBRARY_ENDPOINT}/${proposalId}/edit`,
    );
    return response.data.data;
  },

  /** Never overwrites — stores the regenerated body as a new draft version. */
  async regenerate(
    proposalId: string,
    payload: RegenerateLeadProposalPayload,
  ): Promise<LeadProposalDetail> {
    const response = await api.post<ApiSuccessResponse<LeadProposalDetail>>(
      `${LIBRARY_ENDPOINT}/${proposalId}/regenerate`,
      payload,
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
