import { motion } from "framer-motion";

export function ChatTypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-1 py-4" aria-label="AI is responding">
      <div className="asc-gradient-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm shadow-accent/20">
        <span className="flex gap-0.5">
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-white"
              animate={{ opacity: [0.35, 1, 0.35], y: [0, -2, 0] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: index * 0.15,
                ease: "easeInOut",
              }}
            />
          ))}
        </span>
      </div>
      <span className="text-xs text-muted">AI Consultant is thinking…</span>
    </div>
  );
}
