import { motion } from "framer-motion";
import { AlertCircle, Check, Copy, RefreshCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatMarkdown } from "@/features/consultations/components/chat/chat-markdown";
import type { OptimisticMessage } from "@/features/consultations/hooks/use-send-chat-message";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/utils/cn";
import { formatTime } from "@/utils/format";
import { fadeIn } from "@/utils/motion";

type ChatMessageBubbleProps = {
  message: OptimisticMessage;
  isLastAssistantMessage: boolean;
  onRetry: (message: OptimisticMessage) => void;
  onRegenerate: () => void;
  isMutating: boolean;
};

export function ChatMessageBubble({
  message,
  isLastAssistantMessage,
  onRetry,
  onRegenerate,
  isMutating,
}: ChatMessageBubbleProps) {
  const isUser = message.senderType === "user";
  const userName = useAuthStore((state) => state.user?.fullName ?? "You");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(message.message);
    setCopied(true);
    toast.success("Message copied.");
    window.setTimeout(() => setCopied(false), 1500);
  };

  const isSettled = message.status !== "sending" && message.status !== "failed";

  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="group flex gap-3 py-4">
      {isUser ? (
        <Avatar name={userName} size="sm" className="shrink-0" />
      ) : (
        <div className="asc-gradient-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white asc-shadow-accent">
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {isUser ? "You" : "AI Consultant"}
          </span>
          <span className="text-xs text-muted">{formatTime(message.createdAt)}</span>
          {message.status === "sending" ? (
            <span className="text-xs text-muted">Sending…</span>
          ) : null}
        </div>

        <div className={cn("mt-1 text-foreground", message.status === "sending" && "opacity-60")}>
          <ChatMarkdown content={message.message} tone={isUser ? "user" : "assistant"} />
        </div>

        {message.status === "failed" ? (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-danger">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Failed to send.</span>
            <button
              type="button"
              onClick={() => onRetry(message)}
              className="font-medium underline underline-offset-2 hover:text-danger/80"
            >
              Retry
            </button>
          </div>
        ) : null}

        {isSettled ? (
          // focus-within keeps these reachable by keyboard — hover-only would
          // leave them focusable but invisible.
          <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy
            </Button>
            {!isUser && isLastAssistantMessage ? (
              <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={isMutating}>
                <RefreshCcw className="h-3.5 w-3.5" />
                Regenerate
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
