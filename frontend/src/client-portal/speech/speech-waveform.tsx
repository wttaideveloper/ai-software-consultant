import { motion, useReducedMotion } from "framer-motion";

/**
 * Decorative "we're hearing you" equalizer. Purely presentational and
 * `aria-hidden` — the state it illustrates is announced by the live region in
 * <SpeechInput>. Bars animate `scaleY` only, so the whole thing stays on the
 * compositor and never triggers layout.
 */

/** Peak height per bar — uneven on purpose, so it reads as speech, not a metronome. */
const BAR_PEAKS = [0.45, 0.85, 1, 0.7, 0.5];

export function SpeechWaveform() {
  const reduce = useReducedMotion();

  return (
    <span aria-hidden className="flex h-5 items-center gap-[3px]">
      {BAR_PEAKS.map((peak, index) => (
        <motion.span
          key={index}
          className="h-5 w-[3px] origin-center rounded-full bg-accent"
          initial={false}
          animate={reduce ? { scaleY: 0.4 } : { scaleY: [0.22, peak, 0.22] }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: 0.85 + index * 0.11,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.07,
                }
          }
        />
      ))}
    </span>
  );
}
