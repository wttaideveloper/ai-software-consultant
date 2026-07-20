import { api } from "@/services/api";
import type { ApiSuccessResponse, ChatResponse } from "@/types";

export const chatService = {
  async sendMessage(consultationId: string, message: string): Promise<ChatResponse> {
    const response = await api.post<ApiSuccessResponse<ChatResponse>>(
      `/api/consultations/${consultationId}/chat`,
      { message },
    );
    return response.data.data;
  },
};
