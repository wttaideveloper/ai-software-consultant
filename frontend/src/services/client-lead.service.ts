import { api } from "@/services/api";
import type {
  ClientEstimate,
  ClientFeature,
  ClientPreferredContactMethod,
} from "@/store/client-consultation.store";
import type { ApiSuccessResponse, ConsultationMode, CostPreview } from "@/types";

export type CreateClientLeadPayload = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  preferredContactMethod: ClientPreferredContactMethod;
  notes?: string;

  consultationMode: ConsultationMode;
  projectIdea: string;
  consultationTime: string;
  platforms: string[];
  otherPlatform?: string;

  requirementSummary: string;
  features: Array<Omit<ClientFeature, "id"> & { included: boolean }>;
  estimate: ClientEstimate;
  /**
   * Snapshot extras so the Admin can later see exactly what the client saw. These
   * are already-computed values carried straight from the wizard — no new pricing
   * or AI happens here; the client just hands over the figures it displayed.
   */
  techStack: string[];
  /** The repriced project cost the client was shown (after feature toggles), or null. */
  pricing: CostPreview | null;
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
