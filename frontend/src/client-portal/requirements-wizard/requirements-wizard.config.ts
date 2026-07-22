import type { WizardStepDefinition } from "@/client-portal/wizard/wizard-step.types";

/**
 * The requirements-gathering flow's step registry. Adding, removing, or reordering
 * steps here (e.g. AI Questions later splitting into several) is all that's needed —
 * the wizard shell, progress bar, and navigation all read this array, none of them
 * hardcode a step count.
 */
export const REQUIREMENTS_WIZARD_STEPS: WizardStepDefinition[] = [
  { id: "project-idea", path: "project-idea", label: "Project Idea" },
  { id: "consultation-time", path: "consultation-time", label: "Consultation Time" },
  { id: "platforms", path: "platforms", label: "Platforms" },
  { id: "questions", path: "questions", label: "AI Questions" },
];

export const REQUIREMENTS_WIZARD_BASE_PATH = "/requirements";

/** Where the wizard hands off to once its final step is completed. */
export const REQUIREMENTS_WIZARD_COMPLETE_PATH = "/summary";
