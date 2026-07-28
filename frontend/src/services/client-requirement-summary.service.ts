import { api } from "@/services/api";
import type { ClientConversationTurn } from "@/store/client-consultation.store";
import type { ApiSuccessResponse, ConsultationMode } from "@/types";

export type GenerateClientSummaryPayload = {
  consultationMode: ConsultationMode;
  projectIdea: string;
  platforms: string[];
  otherPlatform?: string;
  conversation: ClientConversationTurn[];
};

export type GenerateClientSummaryResponse = {
  summaryMarkdown: string;
  structuredSummary: Record<string, unknown>;
};

/** Public, unauthenticated Client Portal endpoint — reuses the admin's REQUIREMENT_SUMMARY prompt server-side, not a duplicate summary implementation. */
export const clientRequirementSummaryService = {
  async generate(payload: GenerateClientSummaryPayload): Promise<GenerateClientSummaryResponse> {
    const response = await api.post<ApiSuccessResponse<GenerateClientSummaryResponse>>(
      "/api/client/summary/generate",
      payload,
    );
    return response.data.data;
  },
};
