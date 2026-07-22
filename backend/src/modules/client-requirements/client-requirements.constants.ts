/**
 * Guidance text + a numeric ceiling per consultation-time bucket, both interpolated
 * into the prompt. The number is stated explicitly (rather than left for the model to
 * infer from a transcript) because LLMs self-count unreliably over a growing context —
 * an explicit "questionsAskedSoFar vs maxQuestions" comparison is far more reliable
 * than "aim for roughly N" alone, which drifted past the intended budget in testing.
 */
export const CONSULTATION_TIME_QUESTION_LIMITS: Record<
  string,
  { guidance: string; maxQuestions: number }
> = {
  "2": { guidance: "roughly 2 to 3 questions", maxQuestions: 3 },
  "5": { guidance: "roughly 4 to 6 questions", maxQuestions: 6 },
  "10": { guidance: "roughly 7 to 10 questions", maxQuestions: 10 },
};

export const DEFAULT_QUESTION_LIMIT = {
  guidance: "a small handful of questions",
  maxQuestions: 6,
};

/** Hard server-side ceiling regardless of what the AI decides, in case it never returns completed=true. */
export const MAX_QUESTIONS_HARD_CAP = 12;

export const PROMPT_VERSION = "1.0.0";
