import { z } from "zod";

/**
 * The type of engagement a consultation represents.
 *
 * This is the single most load-bearing piece of consultation context: it is not a
 * label, it changes what the AI asks, what features it detects, what an estimate
 * even *contains*, which proposal template is written, and whether concept mockups
 * are generated at all. Every stage of the pipeline reads it.
 *
 * Lives in `shared/` rather than a module because no single module owns it —
 * consultations, client leads, prompts, estimation, mockups and the Client Portal
 * all depend on the same vocabulary, and a module-local copy would drift.
 */
export const CONSULTATION_MODES = {
  /** Build a brand-new application from scratch. */
  NEW_PROJECT: "NEW_PROJECT",
  /** A working application exists; the client wants new functionality added to it. */
  FEATURE_ENHANCEMENT: "FEATURE_ENHANCEMENT",
  /** Ongoing bug fixing, performance, security, infrastructure and production support. */
  MAINTENANCE: "MAINTENANCE",
  /** Upgrade or migrate an existing system to a different stack or platform. */
  MODERNIZATION: "MODERNIZATION",
} as const;

export type ConsultationMode =
  (typeof CONSULTATION_MODES)[keyof typeof CONSULTATION_MODES];

export const CONSULTATION_MODE_VALUES = Object.values(
  CONSULTATION_MODES,
) as [ConsultationMode, ...ConsultationMode[]];

/**
 * What a consultation is assumed to be when nothing says otherwise.
 *
 * Every consultation created before this feature existed was, by definition, a
 * new-build consultation — that is the only thing the platform could express. So
 * NEW_PROJECT is not an arbitrary fallback, it is the historically accurate value,
 * which is what makes defaulting to it safe for existing rows and old clients.
 */
export const DEFAULT_CONSULTATION_MODE: ConsultationMode =
  CONSULTATION_MODES.NEW_PROJECT;

/**
 * The request-body schema for the mode, defined here beside the vocabulary rather
 * than repeated in each module's `*.validation.ts`. Seven modules accept this
 * field; seven copies of the same `z.enum` would be seven chances to drift.
 *
 * `.default()` rather than `.optional()` is the backwards-compatibility contract
 * in schema form: a client running JS from before this feature sends no mode and
 * is transparently treated as NEW_PROJECT, so no existing caller breaks.
 */
export const consultationModeSchema = z
  .enum(CONSULTATION_MODE_VALUES)
  .default(DEFAULT_CONSULTATION_MODE);

export function isConsultationMode(value: unknown): value is ConsultationMode {
  return (
    typeof value === "string" &&
    (CONSULTATION_MODE_VALUES as readonly string[]).includes(value)
  );
}

/**
 * Coerces anything that reached us — a legacy DB row, an older client's request
 * body, a persisted browser session from before the feature shipped — to a usable
 * mode. Never throws: an unrecognised mode degrades to a working consultation
 * rather than a 500, which is the whole backwards-compatibility contract.
 */
export function normalizeConsultationMode(value: unknown): ConsultationMode {
  return isConsultationMode(value) ? value : DEFAULT_CONSULTATION_MODE;
}
