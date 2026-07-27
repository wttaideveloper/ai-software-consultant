/**
 * How many AI discovery questions each consultation-length option is worth.
 *
 * MIRROR of the backend's `client-requirements.constants.ts` — that file is the
 * source of truth (it is what the prompt is built from and what actually stops the
 * interview); this copy exists so the portal can show "AI Question 1 of N" on the
 * very first screen, before any question has been generated. Change one, change
 * both.
 *
 * A mirror rather than a value read off the API response, deliberately: the count
 * has to be on screen the moment the step opens — which is while the request for
 * question one is still in flight — and the discovery endpoints' response shape is
 * a fixed contract that this change does not touch.
 */
const CONSULTATION_TIME_QUESTION_COUNTS: Record<string, number> = {
  "2": 5,
  "5": 9,
  "10": 13,
};

/** Used when no/unknown consultation time is set — the middle option's length. */
const DEFAULT_QUESTION_COUNT = 9;

/** Absolute ceiling, matching the backend's own clamp. */
const MAX_QUESTIONS_HARD_CAP = 15;

/**
 * The exact number of questions this consultation will ask — i.e. the "N" in
 * "AI Question X of N". Never a hardcoded literal at the call site: the whole
 * point of the length options is that this number differs between them.
 */
export function resolveQuestionCount(consultationTime: string | null): number {
  const configured =
    CONSULTATION_TIME_QUESTION_COUNTS[consultationTime?.trim() ?? ""] ?? DEFAULT_QUESTION_COUNT;

  return Math.min(configured, MAX_QUESTIONS_HARD_CAP);
}
