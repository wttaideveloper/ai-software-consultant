import { motion } from "framer-motion";
import { Paperclip, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { fadeIn } from "@/utils/motion";

type ChatInputProps = {
  onSend: (text: string) => void;
  disabled?: boolean;
};

const MAX_TEXTAREA_HEIGHT = 200;

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="border-t border-border bg-surface px-4 py-3 sm:px-6"
    >
      <div
        className={
          "flex items-end gap-2 rounded-xl border border-border bg-surface-muted p-2 " +
          "transition-colors duration-150 focus-within:border-accent focus-within:bg-surface focus-within:ring-2 focus-within:ring-accent/25"
        }
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled
          aria-label="Attach file (coming soon)"
          className="mb-0.5 shrink-0"
        >
          <Paperclip className="h-[18px] w-[18px]" />
        </Button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          rows={1}
          placeholder="Message the AI consultant…"
          disabled={disabled}
          className="max-h-[200px] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-foreground placeholder:text-muted focus:outline-none disabled:opacity-60"
        />

        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={disabled || value.trim().length === 0}
          aria-label="Send message"
          className="mb-0.5 shrink-0"
        >
          <Send className="h-[18px] w-[18px]" />
        </Button>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-muted">
        Press Enter to send, Shift+Enter for a new line.
      </p>
    </motion.div>
  );
}
