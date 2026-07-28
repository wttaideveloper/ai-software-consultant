import {
  CONSULTATION_MODES,
  type ConsultationMode,
} from "../../shared/constants/consultation-mode.js";
import {
  getConsultationModeProfile,
  MOCKUP_POLICIES,
} from "../prompts/consultation-mode.profiles.js";

/**
 * Decides whether an engagement warrants concept mockups.
 *
 * Pure and dependency-free, and deliberately evaluated BEFORE any AI call: this
 * is the only feature that spends money per anonymous page view, so "should we
 * generate?" must be answerable without generating. A wrong answer here is a
 * wrong charge.
 *
 * Two modes are unconditional (NEW_PROJECT, FEATURE_ENHANCEMENT — both produce
 * screens the client does not have yet). The other two are conditional, and the
 * condition is read from what the client actually described rather than assumed:
 * MAINTENANCE only when UI improvement was explicitly requested, MODERNIZATION
 * only when the migration includes a UI redesign. Keyword matching is a blunt
 * instrument, but it is deterministic, free, auditable and errs toward NOT
 * spending — an AI classifier here would cost a call to decide whether to make a
 * call.
 */

/**
 * Unambiguous requests for design work. Each of these only ever means "change how
 * this looks", so one occurrence is enough.
 */
const STRONG_UI_WORK_PATTERNS: readonly RegExp[] = [
  /\bredesign(ed|ing)?\b/i,
  /\bre-?skin(ned|ning)?\b/i,
  /\brevamp(ed|ing)?\b/i,
  /\brebrand(ed|ing)?\b/i,
  /\bfront[- ]?end (rewrite|rebuild|redesign|overhaul)\b/i,
  /\bnew (design|look|theme|interface|screens?)\b/i,
  /\bdesign (system|refresh|overhaul|update)\b/i,
  /\bmodern(ise|ize)d? (the )?(ui|ux|interface|design|look)\b/i,
  /\bvisual (refresh|overhaul|update|redesign)\b/i,
];

/**
 * Terms that *can* signal design work but routinely appear in engagements that
 * want none.
 *
 * This distinction was not theoretical: a maintenance interview asked whether
 * production issues were "impacting user experience", the phrase was echoed into
 * the requirement summary, and a flat keyword match on "user experience" started
 * a billable image batch for a client who had asked for bug fixes. A weak term
 * therefore only counts when an intent word sits near it — "improve the UI" is a
 * request, "impacting user experience" is a symptom.
 */
const WEAK_UI_TERMS =
  "ui|ux|user interface|user experience|styling|look and feel|accessibility|responsive (?:design|layout)";

/** Words that turn a weak term into an actual request for work. */
const UI_INTENT_WORDS =
  "redesign|revamp|improve|improvement|enhance|modernis|moderniz|refresh|overhaul|rebuild|rewrite|update|upgrade|new|better|fix";

/** Proximity window, in characters, in which an intent word still qualifies the term. */
const INTENT_WINDOW = 40;

const WEAK_UI_WORK_PATTERNS: readonly RegExp[] = [
  new RegExp(`(?:${UI_INTENT_WORDS})[\\w\\s,'-]{0,${INTENT_WINDOW}}?\\b(?:${WEAK_UI_TERMS})\\b`, "i"),
  new RegExp(`\\b(?:${WEAK_UI_TERMS})\\b[\\w\\s,'-]{0,${INTENT_WINDOW}}?(?:${UI_INTENT_WORDS})`, "i"),
];

export type MockupEligibilityInput = {
  consultationMode: ConsultationMode;
  requirementSummary?: string | null;
  /** Feature/work-item names and categories — a "UI" category is as strong a signal as prose. */
  featureLabels?: readonly string[];
};

export type MockupEligibility = {
  eligible: boolean;
  /** Client-facing explanation when not eligible; null when it is. */
  reason: string | null;
};

function mentionsUiWork(input: MockupEligibilityInput): boolean {
  const haystack = [input.requirementSummary ?? "", ...(input.featureLabels ?? [])]
    .join(" \n ")
    .trim();

  if (!haystack) {
    return false;
  }

  return (
    STRONG_UI_WORK_PATTERNS.some((pattern) => pattern.test(haystack)) ||
    WEAK_UI_WORK_PATTERNS.some((pattern) => pattern.test(haystack))
  );
}

export function evaluateMockupEligibility(
  input: MockupEligibilityInput,
): MockupEligibility {
  const profile = getConsultationModeProfile(input.consultationMode);

  if (profile.mockupPolicy === MOCKUP_POLICIES.ALWAYS) {
    return { eligible: true, reason: null };
  }

  if (mentionsUiWork(input)) {
    return { eligible: true, reason: null };
  }

  const detail =
    input.consultationMode === CONSULTATION_MODES.MAINTENANCE
      ? "Concept screens are skipped for maintenance and support engagements unless the requirements ask for UI or UX improvements."
      : "Concept screens are skipped for a migration that keeps its existing interface. They are generated when the requirements describe a UI redesign.";

  return { eligible: false, reason: detail };
}
