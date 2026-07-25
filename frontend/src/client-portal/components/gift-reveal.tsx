import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";
import {
  EASE_OUT_EXPO,
  SPRING_SNAPPY,
  staggerContainer,
  staggerItem,
} from "@/utils/motion";

type GiftRevealProps = {
  onContinue: () => void;
  onStartNew: () => void;
};

/* ── Decorative particle sets, computed once at module scope ────────────────
   Deterministic so a re-render can never re-scatter mid-flight pieces. */

const BURST_TONES = ["bg-warning", "bg-white", "bg-accent-mid"] as const;
const BURST_COUNT = 14;
const BURST_PIECES = Array.from({ length: BURST_COUNT }, (_, index) => {
  const angle = (index / BURST_COUNT) * Math.PI * 2;
  const distance = 74 + (index % 3) * 24;
  return {
    id: index,
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance - 12,
    delay: 0.55 + (index % 5) * 0.03,
    tone: BURST_TONES[index % BURST_TONES.length] ?? "bg-warning",
    tall: index % 4 === 0,
  };
});
const BURST_TIMES = [0, 0.35, 1];

/** Slow-drifting ambient sparkles behind the gift — golden/white, kept minimal. */
const AMBIENT = [
  { top: "14%", left: "12%", size: 5, delay: 0, dur: 3.4, tone: "bg-warning" },
  { top: "22%", left: "82%", size: 7, delay: 0.6, dur: 4.0, tone: "bg-white" },
  {
    top: "42%",
    left: "7%",
    size: 4,
    delay: 1.1,
    dur: 3.0,
    tone: "bg-accent-mid",
  },
  {
    top: "64%",
    left: "88%",
    size: 6,
    delay: 0.3,
    dur: 4.4,
    tone: "bg-warning",
  },
  { top: "78%", left: "18%", size: 5, delay: 0.9, dur: 3.6, tone: "bg-white" },
  {
    top: "10%",
    left: "52%",
    size: 4,
    delay: 1.4,
    dur: 3.2,
    tone: "bg-warning",
  },
  {
    top: "84%",
    left: "58%",
    size: 6,
    delay: 0.2,
    dur: 4.2,
    tone: "bg-accent-mid",
  },
  { top: "50%", left: "93%", size: 4, delay: 0.8, dur: 3.8, tone: "bg-white" },
  {
    top: "30%",
    left: "36%",
    size: 3,
    delay: 1.6,
    dur: 3.0,
    tone: "bg-warning",
  },
  { top: "70%", left: "42%", size: 4, delay: 0.5, dur: 4.0, tone: "bg-white" },
] as const;

/* ── Animated background: drifting blobs + glowing rings + ambient sparkles ── */
function GiftBackground({ reduce }: { reduce: boolean }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Soft gradient blobs. */}
      <motion.div
        className="asc-gradient-subtle absolute -top-16 left-1/2 h-80 w-136 -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        animate={
          reduce ? undefined : { scale: [1, 1.08, 1], opacity: [0.6, 0.8, 0.6] }
        }
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="asc-gradient-accent absolute -bottom-24 -left-16 h-72 w-72 rounded-full opacity-10 blur-3xl"
        animate={reduce ? undefined : { y: [0, -20, 0], x: [0, 14, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="asc-gradient-accent absolute -right-20 top-20 h-64 w-64 rounded-full opacity-10 blur-3xl"
        animate={reduce ? undefined : { y: [0, 18, 0] }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1.5,
        }}
      />

      {/* Ambient sparkles — decoration only, dropped under reduced motion. */}
      {reduce
        ? null
        : AMBIENT.map((s, index) => (
            <motion.span
              key={index}
              className={cn("absolute rounded-full", s.tone)}
              style={{
                top: s.top,
                left: s.left,
                height: s.size,
                width: s.size,
              }}
              animate={{
                opacity: [0, 1, 0],
                y: [0, -12, 0],
                scale: [0.7, 1, 0.7],
              }}
              transition={{
                duration: s.dur,
                delay: s.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
    </div>
  );
}

/* ── The stylised gift box (CSS transforms only) ──────────────────────────── */
function GiftBox({ reduce }: { reduce: boolean }) {
  return (
    <div className="relative h-32 w-32">
      {/* Glow — deepens on hover of the group wrapper. */}
      <div
        aria-hidden
        className="asc-gradient-accent absolute inset-2 -z-10 rounded-full opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-95"
      />

      {/* Box body. */}
      <div className="absolute bottom-1 left-1/2 h-20 w-28 -translate-x-1/2 rounded-xl asc-gradient-accent shadow-2xl ring-1 ring-white/15 transition-shadow duration-500 group-hover:asc-shadow-accent">
        <div className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-white/25" />
      </div>

      {/* Lid — tilts open a little on load ("ribbon opens slightly"). */}
      <motion.div
        className="absolute left-1/2 top-6 h-7 w-32 -translate-x-1/2 rounded-lg asc-gradient-accent shadow-lg ring-1 ring-white/15 origin-[50%_100%]"
        initial={reduce ? false : { rotateX: 0 }}
        animate={reduce ? undefined : { rotateX: [0, -22, -9] }}
        transition={{ duration: 1, delay: 0.7, ease: EASE_OUT_EXPO }}
      >
        <div className="absolute inset-y-0 left-1/2 w-5 -translate-x-1/2 bg-white/30" />
      </motion.div>

      {/* Bow. */}
      <div className="absolute left-1/2 top-1 flex -translate-x-1/2 items-center">
        <span className="h-5 w-5 rotate-[-22deg] rounded-full border-[3px] border-white/70" />
        <span className="-ml-1.5 h-5 w-5 rotate-22 rounded-full border-[3px] border-white/70" />
      </div>
    </div>
  );
}

/* ── One-shot golden burst on load ────────────────────────────────────────── */
function GiftBurst() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 grid place-items-center"
    >
      {BURST_PIECES.map((piece) => (
        <motion.span
          key={piece.id}
          className={cn(
            "col-start-1 row-start-1 w-1.5 rounded-full",
            piece.tall ? "h-2.5" : "h-1.5",
            piece.tone,
          )}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0.4, 1, 0.8],
            x: [0, piece.x * 0.7, piece.x],
            y: [0, piece.y, piece.y + 34],
          }}
          transition={{
            duration: 1.1,
            delay: piece.delay,
            ease: EASE_OUT_EXPO,
            times: BURST_TIMES,
          }}
        />
      ))}
    </div>
  );
}

/**
 * The flow's reward beat, shown after the proposal request is confirmed.
 *
 * Presentational only — there is no prize record behind it. Built entirely from
 * CSS transforms, perspective and Framer Motion (no WebGL). The gift drops in,
 * bounces, glows, cracks its lid, releases a small golden burst, then floats and
 * responds to the pointer with a gentle parallax tilt. All of it collapses to a
 * calm static scene under prefers-reduced-motion.
 */
export function GiftReveal({ onContinue, onStartNew }: GiftRevealProps) {
  // `null` (no stated preference) means motion is fine — normalise to a boolean.
  const reduce = useReducedMotion() ?? false;

  // Pointer parallax → a subtle 3D tilt of the gift. Springs keep it fluid.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), {
    stiffness: 150,
    damping: 18,
  });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [12, -12]), {
    stiffness: 150,
    damping: 18,
  });

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width - 0.5);
    py.set((event.clientY - rect.top) / rect.height - 0.5);
  };
  const resetPointer = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className="relative flex flex-col items-center overflow-hidden rounded-3xl px-4 py-12 text-center"
    >
      <GiftBackground reduce={reduce} />

      {/* Gift stage. */}
      <div className="relative z-10 mb-2 perspective-distant">
        {reduce ? null : <GiftBurst />}
        <motion.div
          initial={reduce ? false : { y: -190, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
          transition={
            reduce
              ? undefined
              : { ...SPRING_SNAPPY, stiffness: 260, damping: 13, delay: 0.05 }
          }
        >
          <motion.div
            className="group transform-3d cursor-default"
            style={{
              rotateX: reduce ? 0 : rotateX,
              rotateY: reduce ? 0 : rotateY,
            }}
            animate={reduce ? undefined : { y: [0, -10, 0] }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.9,
            }}
            whileHover={reduce ? undefined : { scale: 1.06 }}
          >
            <GiftBox reduce={reduce} />
          </motion.div>
        </motion.div>
      </div>

      {/* Message + card + CTAs. */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex w-full flex-col items-center"
      >
        <motion.h1
          variants={staggerItem}
          className="mt-4 text-[clamp(1.75rem,1.4rem+1.6vw,2.5rem)] font-semibold tracking-tight text-foreground text-balance"
        >
          🎉 Congratulations!
        </motion.h1>
        <motion.p
          variants={staggerItem}
          className="mt-2 text-base font-medium text-foreground-soft"
        >
          You've won a complimentary gift!
        </motion.p>
        <motion.p
          variants={staggerItem}
          className="mt-3 max-w-md text-sm leading-relaxed text-muted text-pretty"
        >
          Please collect it from our representative during our discussion.
        </motion.p>

        <motion.div
          variants={staggerItem}
          className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-center"
        >
          <Button size="lg" onClick={onContinue} className="w-full sm:w-auto">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={onStartNew}
            className="w-full sm:w-auto"
          >
            Start New Consultation
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
