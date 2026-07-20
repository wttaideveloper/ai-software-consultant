import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MESSAGES_QUERY_KEY } from "@/features/consultations/hooks/use-messages";
import { chatService } from "@/services/chat.service";
import { useAuthStore } from "@/store/auth-store";
import type { ConversationMessage } from "@/types";
import { getApiErrorMessage } from "@/utils/api-error";

export type OptimisticMessage = ConversationMessage & {
  status?: "sending" | "failed";
};

type SendVariables = {
  text: string;
  /** id of an existing failed optimistic message being retried, reused instead of creating a new bubble. */
  retryMessageId?: string;
};

type MutationContext = {
  optimisticId: string;
};

/**
 * Optimistically appends the user's message immediately, then reconciles
 * with the server's authoritative user+assistant pair on success. On
 * failure the optimistic bubble is marked "failed" (not rolled back) so the
 * UI can offer a Retry action.
 */
export function useSendChatMessage(consultationId: string) {
  const queryClient = useQueryClient();
  const organizationId = useAuthStore((state) => state.organization?.id ?? "");
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const queryKey = [MESSAGES_QUERY_KEY, consultationId];

  return useMutation<
    Awaited<ReturnType<typeof chatService.sendMessage>>,
    unknown,
    SendVariables,
    MutationContext
  >({
    mutationFn: ({ text }) => chatService.sendMessage(consultationId, text),

    onMutate: async ({ text, retryMessageId }) => {
      await queryClient.cancelQueries({ queryKey });
      const current = queryClient.getQueryData<OptimisticMessage[]>(queryKey) ?? [];

      if (retryMessageId) {
        queryClient.setQueryData<OptimisticMessage[]>(
          queryKey,
          current.map((message) =>
            message.id === retryMessageId ? { ...message, status: "sending" as const } : message,
          ),
        );
        return { optimisticId: retryMessageId };
      }

      const optimisticMessage: OptimisticMessage = {
        id: `optimistic-${crypto.randomUUID()}`,
        consultationId,
        organizationId,
        senderType: "user",
        message: text,
        metadata: null,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        status: "sending",
      };

      queryClient.setQueryData<OptimisticMessage[]>(queryKey, [...current, optimisticMessage]);
      return { optimisticId: optimisticMessage.id };
    },

    onSuccess: (response, _variables, context) => {
      queryClient.setQueryData<OptimisticMessage[]>(queryKey, (existing = []) => {
        const withoutOptimistic = existing.filter((message) => message.id !== context.optimisticId);
        return [...withoutOptimistic, response.userMessage, response.assistantMessage];
      });
    },

    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData<OptimisticMessage[]>(queryKey, (existing = []) =>
          existing.map((message) =>
            message.id === context.optimisticId ? { ...message, status: "failed" as const } : message,
          ),
        );
      }
      toast.error(getApiErrorMessage(error, "The AI didn't respond. Please try again."));
    },
  });
}
