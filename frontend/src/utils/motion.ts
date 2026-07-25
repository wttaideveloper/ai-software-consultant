import type { Transition, Variants } from "framer-motion";

/**
 * Shared easing curves. Every animation in the app pulls from these rather
 * than inlining a bezier, so timing feels like one system.
 *
 * Reduced-motion is handled globally by <MotionConfig reducedMotion="user">
 * in providers.tsx (Framer writes inline styles, so the CSS media query in
 * globals.css cannot reach it) — variants here don't need to branch on it.
 */
export const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

/** Springs tuned for two distinct jobs: layout shifts vs. small UI accents. */
export const SPRING_LAYOUT: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 34,
};

export const SPRING_SNAPPY: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
};

export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE_OUT_EXPO },
  },
  exit: { opacity: 0, y: 4, transition: { duration: 0.16 } },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT_EXPO },
  },
  exit: { opacity: 0, y: -4, transition: { duration: 0.16 } },
};

/**
 * Client Portal wizard step entrance — a soft fade + slide + brief blur, so moving
 * between steps (Requirements → Summary → … → Proposal) resolves into focus rather
 * than hard-cutting. The blur is a one-shot on enter (never a continuous filter),
 * and `ClientLayout` swaps this for a static render under prefers-reduced-motion,
 * since Framer's reduced-motion handling doesn't strip `filter`. Client Portal only.
 */
export const clientPageEnter: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: EASE_OUT_EXPO },
  },
};

/** Scroll-triggered reveal. Pair with viewport={SCROLL_VIEWPORT}. */
export const scrollReveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
};

/** `once` avoids re-running on scroll-back, which is the main cost of reveals. */
export const SCROLL_VIEWPORT = { once: true, margin: "-80px" } as const;

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.14 } },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.24, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.14 },
  },
};

export const fieldError: Variants = {
  hidden: { opacity: 0, y: -4, height: 0 },
  visible: {
    opacity: 1,
    y: 0,
    height: "auto",
    transition: { duration: 0.18, ease: EASE_OUT_EXPO },
  },
  exit: { opacity: 0, y: -4, height: 0, transition: { duration: 0.12 } },
};

export const stepTransition: Variants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 24 : -24 }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.26, ease: EASE_OUT_EXPO },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -24 : 24,
    transition: { duration: 0.18 },
  }),
};

export const drawerPanel: Variants = {
  hidden: { x: "-100%" },
  visible: { x: 0, transition: SPRING_SNAPPY },
  exit: { x: "-100%", transition: { duration: 0.2 } },
};

/** Dropdown / popover menus anchored to a trigger. */
export const popover: Variants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.16, ease: EASE_OUT_EXPO },
  },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } },
};
