import { motion, useReducedMotion } from "framer-motion";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";
import {
  EASE_OUT_EXPO,
  SPRING_SNAPPY,
  staggerContainer,
  staggerItem,
} from "@/utils/motion";

const CONFETTI_TONES = [
  "bg-accent",
  "bg-accent-mid",
  "bg-success",
  "bg-warning",
  "bg-info",
] as const;

const CONFETTI_COUNT = 18;

/**
 * Computed once at module scope rather than per render: the burst is deterministic,
 * so a re-render can never re-scatter shards that are already mid-flight.
 */
const CONFETTI_PIECES = Array.from({ length: CONFETTI_COUNT }, (_, index) => {
  const angle = (index / CONFETTI_COUNT) * Math.PI * 2;
  const distance = 96 + (index % 4) * 28;

  return {
    id: index,
    x: Math.cos(angle) * distance,
    // Biased upward so shards arc over the gift before dropping away.
    y: Math.sin(angle) * distance - 28,
    rotate: (index % 2 === 0 ? 1 : -1) * (140 + index * 16),
    delay: 0.14 + (index % 6) * 0.04,
    tone: CONFETTI_TONES[index % CONFETTI_TONES.length] ?? "bg-accent",
    tall: index % 3 === 0,
  };
});

/** Shared across every keyframe track below, so all arrays must stay 3 stops long. */
const CONFETTI_TIMES = [0, 0.3, 1];

type GiftRevealProps = {
  onStartNew: () => void;
};

/**
 * The flow's reward beat, shown after the proposal request is confirmed.
 * Presentational only — there is no prize record behind it.
 */
export function GiftReveal({ onStartNew }: GiftRevealProps) {
  // MotionConfig already reduces per-animation motion globally, but the confetti
  // and the ambient halo are pure decoration: drop them outright rather than
  // leave an endless opacity pulse running for someone who asked for less motion.
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center py-8 text-center"
    >
      <div className="relative flex h-32 w-32 items-center justify-center">
        {prefersReducedMotion ? null : (
          <>
            <motion.span
              aria-hidden
              className="absolute h-16 w-16 rounded-full bg-accent-subtle"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{
                duration: 2,
                ease: EASE_OUT_EXPO,
                repeat: Infinity,
                repeatDelay: 0.4,
              }}
            />
            <motion.span
              aria-hidden
              className="absolute h-16 w-16 rounded-full bg-accent-subtle"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{
                duration: 2,
                ease: EASE_OUT_EXPO,
                repeat: Infinity,
                repeatDelay: 0.4,
                delay: 1.2,
              }}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              {CONFETTI_PIECES.map((piece) => (
                <motion.span
                  key={piece.id}
                  className={cn(
                    "col-start-1 row-start-1 w-1.5 rounded-full",
                    piece.tall ? "h-3" : "h-1.5",
                    piece.tone,
                  )}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.85],
                    x: [0, piece.x * 0.7, piece.x],
                    y: [0, piece.y, piece.y + 40],
                    rotate: [0, piece.rotate * 0.5, piece.rotate],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: piece.delay,
                    ease: EASE_OUT_EXPO,
                    times: CONFETTI_TIMES,
                  }}
                />
              ))}
            </div>
          </>
        )}

        <motion.div
          className="relative flex h-16 w-16 items-center justify-center rounded-full asc-gradient-accent asc-shadow-accent"
          initial={{ opacity: 0, scale: 0.4, rotate: -14 }}
          animate={{ opacity: 1, scale: 1, rotate: [-14, 10, -6, 3, 0] }}
          transition={{
            opacity: { duration: 0.2 },
            scale: SPRING_SNAPPY,
            rotate: { duration: 0.8, delay: 0.1, ease: EASE_OUT_EXPO },
          }}
        >
          <Gift className="h-8 w-8 text-white" strokeWidth={1.75} />
        </motion.div>
      </div>

      <motion.h1
        variants={staggerItem}
        className="mt-3 text-2xl font-semibold tracking-tight text-balance text-foreground"
      >
        You have won a gift!
      </motion.h1>

      <motion.p
        variants={staggerItem}
        className="mt-2 max-w-sm text-sm leading-relaxed text-pretty text-muted"
      >
        Please collect it from our representative.
      </motion.p>

      <motion.div variants={staggerItem} className="mt-8">
        <Button variant="secondary" onClick={onStartNew}>
          Start a new consultation
        </Button>
      </motion.div>
    </motion.div>
  );
}
