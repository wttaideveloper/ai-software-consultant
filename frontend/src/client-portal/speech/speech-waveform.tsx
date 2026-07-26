import { motion, useReducedMotion, useTransform, type MotionValue } from "framer-motion";

/**
 * Live input meter. Purely presentational and `aria-hidden` — the state it
 * illustrates is announced by the live region in <SpeechInput>.
 *
 * Bars are driven by the real microphone level through a `MotionValue`, so the
 * animation runs entirely outside React's render cycle: the panel re-renders
 * once per second for the timer, not sixty times a second for the bars. Only
 * `scaleY` is animated, which keeps the whole thing on the compositor.
 */

/** Per-bar weighting — uneven on purpose, so it reads as speech, not a meter. */
const BAR_WEIGHTS = [0.55, 0.85, 1, 0.75, 0.6];
/** Bars never collapse to nothing: a visible resting state still says "live". */
const MIN_SCALE = 0.18;

type SpeechWaveformProps = {
  /** Microphone level, 0–1. */
  level: MotionValue<number>;
};

export function SpeechWaveform({ level }: SpeechWaveformProps) {
  const reduce = useReducedMotion();

  return (
    <span aria-hidden className="flex h-5 items-center gap-[3px]">
      {BAR_WEIGHTS.map((weight, index) => (
        <WaveformBar key={index} level={level} weight={weight} reduce={reduce} />
      ))}
    </span>
  );
}

function WaveformBar({
  level,
  weight,
  reduce,
}: {
  level: MotionValue<number>;
  weight: number;
  reduce: boolean | null;
}) {
  const scaleY = useTransform(level, (current) =>
    Math.max(MIN_SCALE, Math.min(1, current * weight + MIN_SCALE)),
  );

  // Under reduced motion the bars hold a calm, static height rather than
  // tracking the signal — the panel's text already carries the same information.
  if (reduce) {
    return (
      <span
        className="w-[3px] rounded-full bg-accent"
        style={{ height: `${Math.round(weight * 60)}%` }}
      />
    );
  }

  return (
    <motion.span
      className="h-5 w-[3px] origin-center rounded-full bg-accent"
      style={{ scaleY }}
    />
  );
}
