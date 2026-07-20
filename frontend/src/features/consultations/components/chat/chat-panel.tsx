import { Skeleton } from "@/components/ui/skeleton";
import { SectionError } from "@/components/shared/section-error";
import { ChatEmptyState } from "@/features/consultations/components/chat/chat-empty-state";
import { ChatInput } from "@/features/consultations/components/chat/chat-input";
import { ChatMessageList } from "@/features/consultations/components/chat/chat-message-list";
import { useMessages } from "@/features/consultations/hooks/use-messages";
import {
  useSendChatMessage,
  type OptimisticMessage,
} from "@/features/consultations/hooks/use-send-chat-message";

type ChatPanelProps = {
  consultationId: string;
};

function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatPanel({ consultationId }: ChatPanelProps) {
  const { data, isLoading, isError, refetch } = useMessages(consultationId);
  const sendMessage = useSendChatMessage(consultationId);

  const messages = (data ?? []) as OptimisticMessage[];

  const handleSend = (text: string) => {
    sendMessage.mutate({ text });
  };

  const handleRetry = (message: OptimisticMessage) => {
    sendMessage.mutate({ text: message.message, retryMessageId: message.id });
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find((message) => message.senderType === "user");
    if (!lastUserMessage) return;
    sendMessage.mutate({ text: lastUserMessage.message });
  };

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <SectionError message="Couldn't load the conversation." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading) {
    return <ChatSkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {messages.length === 0 ? (
        <ChatEmptyState />
      ) : (
        <ChatMessageList
          messages={messages}
          isSending={sendMessage.isPending}
          onRetry={handleRetry}
          onRegenerate={handleRegenerate}
        />
      )}
      <ChatInput onSend={handleSend} disabled={sendMessage.isPending} />
    </div>
  );
}
