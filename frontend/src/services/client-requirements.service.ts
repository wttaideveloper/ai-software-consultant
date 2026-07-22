import { api } from "@/services/api";
import type { ClientConversationTurn } from "@/store/client-consultation.store";
import type { ApiSuccessResponse } from "@/types";

export type StartDiscoveryPayload = {
  projectIdea: string;
  consultationTime: string;
  platforms: string[];
  otherPlatform?: string;
};

export type NextDiscoveryPayload = StartDiscoveryPayload & {
  conversation: ClientConversationTurn[];
  currentAnswer: string;
};

export type DiscoveryQuestionResponse = {
  question: string | null;
  completed: boolean;
};

/** Public, unauthenticated Client Portal AI discovery endpoints — not part of the admin chat API. */
export const clientRequirementsService = {
  async start(payload: StartDiscoveryPayload): Promise<DiscoveryQuestionResponse> {
    const response = await api.post<ApiSuccessResponse<DiscoveryQuestionResponse>>(
      "/api/client/questions/start",
      payload,
    );
    return response.data.data;
  },

  async next(payload: NextDiscoveryPayload): Promise<DiscoveryQuestionResponse> {
    const response = await api.post<ApiSuccessResponse<DiscoveryQuestionResponse>>(
      "/api/client/questions/next",
      payload,
    );
    return response.data.data;
  },
};
