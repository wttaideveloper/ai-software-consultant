import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type ProcessingOverlayProps = {
  message: string;
};

/** In-panel AI-processing overlay — same visual treatment used across generate/detect actions. */
export function ProcessingOverlay({ message }: ProcessingOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      // aria-live so screen readers announce that generation started, since
      // the only other cue is visual.
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-surface/80 backdrop-blur-sm"
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        {/* Pulsing halo + rotating ring: reads as "AI is working", not just
            "network pending". Both animate transform/opacity only. */}
        <motion.span
          aria-hidden
          animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.15, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-accent/30 blur-md"
        />
        <motion.span
          aria-hidden
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-accent/25 border-t-accent"
        />
        <div className="asc-gradient-accent relative flex h-9 w-9 items-center justify-center rounded-full text-white">
          <Sparkles className="h-4 w-4" strokeWidth={2} />
        </div>
      </div>

      <p className="max-w-xs text-center text-sm font-medium text-foreground-soft text-pretty">
        {message}
      </p>
    </motion.div>
  );
}
