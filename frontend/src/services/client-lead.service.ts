import { api } from "@/services/api";
import type {
  ClientEstimate,
  ClientFeature,
  ClientPreferredContactMethod,
} from "@/store/client-consultation.store";
import type { ApiSuccessResponse } from "@/types";

export type CreateClientLeadPayload = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  preferredContactMethod: ClientPreferredContactMethod;
  notes?: string;

  projectIdea: string;
  consultationTime: string;
  platforms: string[];
  otherPlatform?: string;

  requirementSummary: string;
  features: Array<Omit<ClientFeature, "id"> & { included: boolean }>;
  estimate: ClientEstimate;
};

export type CreateClientLeadResponse = {
  id: string;
  status: string;
  createdAt: string;
};

/** Public, unauthenticated Client Portal endpoint — pure persistence, no AI call. */
export const clientLeadService = {
  async create(payload: CreateClientLeadPayload): Promise<CreateClientLeadResponse> {
    const response = await api.post<ApiSuccessResponse<CreateClientLeadResponse>>(
      "/api/client/request-proposal",
      payload,
    );
    return response.data.data;
  },
};
