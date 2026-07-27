/**
 * How many discovery questions each consultation-length option is worth.
 *
 * This is the single source of truth for interview length. It is used three ways,
 * and all three must agree or the client sees a progress bar that lies:
 *   1. interpolated into the discovery prompt as the interview's exact length,
 *   2. enforced server-side in client-requirements.service.ts as the stopping point,
 *   3. mirrored by the Client Portal (frontend question-plan.ts) as the denominator
 *      of "AI Question X of N" — update that file whenever these change.
 *
 * Stated as one exact figure per option rather than a range, deliberately. The
 * count is what the chosen duration actually buys the client, and a range would
 * make the "of N" in the progress indicator a guess. Roughly 20-45 seconds of
 * answering per question — generous of the stated minutes, since typing an answer
 * is quicker than talking one through with a human.
 *
 * The prompt alone was previously the only thing carrying these numbers, which is
 * why every interview ran to the global hard cap: an LLM treats "ask roughly 4 to 6
 * questions" as a suggestion, so the ceiling has to be enforced in code as well.
 */
export const CONSULTATION_TIME_QUESTION_COUNTS: Record<string, number> = {
  "2": 5,
  "5": 9,
  "10": 13,
};

/** Used when the consultation time isn't one of the known options — the middle option's length. */
export const DEFAULT_QUESTION_COUNT = 9;

/**
 * Absolute ceiling applied on top of the table above, independent of it: no
 * configuration change, and no AI response, can make a public unauthenticated
 * interview longer than this. Deliberately not derived from the table, so raising
 * a bucket past what a prospect will tolerate still gets clamped.
 */
export const MAX_QUESTIONS_HARD_CAP = 15;

export const PROMPT_VERSION = "1.2.0";
