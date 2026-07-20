import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { ChatMessageBubble } from "@/features/consultations/components/chat/chat-message-bubble";
import { ChatTypingIndicator } from "@/features/consultations/components/chat/chat-typing-indicator";
import type { OptimisticMessage } from "@/features/consultations/hooks/use-send-chat-message";

type ChatMessageListProps = {
  messages: OptimisticMessage[];
  isSending: boolean;
  onRetry: (message: OptimisticMessage) => void;
  onRegenerate: () => void;
};

export function ChatMessageList({ messages, isSending, onRetry, onRegenerate }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isSending]);

  const lastAssistantId = [...messages]
    .reverse()
    .find((message) => message.senderType === "assistant")?.id;

  return (
    <div className="flex-1 divide-y divide-border/60 overflow-y-auto px-4 sm:px-6">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <ChatMessageBubble
            key={message.id}
            message={message}
            isLastAssistantMessage={message.id === lastAssistantId}
            onRetry={onRetry}
            onRegenerate={onRegenerate}
            isMutating={isSending}
          />
        ))}
      </AnimatePresence>
      {isSending ? <ChatTypingIndicator /> : null}
      <div ref={bottomRef} />
    </div>
  );
}
