import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { EASE_OUT_EXPO } from "@/utils/motion";

type CountUpProps = {
  value: number;
  /** Renders the (possibly fractional, mid-animation) number — e.g. currency formatting. */
  format: (value: number) => string;
  durationMs?: number;
};

/**
 * Animates a number from its previous value to the next one, so a changing figure
 * reads as an update rather than a silent swap. Every frame is passed back through
 * `format`, so the count-up shows properly grouped currency the whole way.
 *
 * Honours reduced-motion (the imperative `animate()` used here is not reached by
 * the global <MotionConfig reducedMotion>, so it is checked explicitly): the value
 * snaps to its target with no tween.
 */
export function CountUp({ value, format, durationMs = 600 }: CountUpProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reduceMotion || fromRef.current === value) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const controls = animate(fromRef.current, value, {
      duration: durationMs / 1000,
      ease: EASE_OUT_EXPO,
      onUpdate: (latest) => setDisplay(latest),
    });
    fromRef.current = value;

    return () => controls.stop();
  }, [value, reduceMotion, durationMs]);

  return <>{format(display)}</>;
}
