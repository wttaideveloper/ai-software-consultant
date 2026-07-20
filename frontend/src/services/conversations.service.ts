import { api } from "@/services/api";
import type { ApiSuccessResponse, ConversationMessage } from "@/types";

export const conversationsService = {
  async listMessages(consultationId: string): Promise<ConversationMessage[]> {
    const response = await api.get<ApiSuccessResponse<ConversationMessage[]>>(
      `/api/consultations/${consultationId}/messages`,
    );
    return response.data.data;
  },
};
