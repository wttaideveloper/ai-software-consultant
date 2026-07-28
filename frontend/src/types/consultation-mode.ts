/**
 * The client-side half of Consultation Mode.
 *
 * Mirrors `backend/src/shared/constants/consultation-mode.ts` (the vocabulary) and
 * the presentation half of `consultation-mode.profiles.ts` (labels, descriptions,
 * examples). The backend stays the source of truth for behaviour — every prompt
 * directive, estimate rule and mockup policy lives there and is never duplicated
 * here. What lives here is only what a browser needs to render the choice.
 *
 * Change the backend enum, change this list.
 */
export const CONSULTATION_MODES = {
  NEW_PROJECT: "NEW_PROJECT",
  FEATURE_ENHANCEMENT: "FEATURE_ENHANCEMENT",
  MAINTENANCE: "MAINTENANCE",
  MODERNIZATION: "MODERNIZATION",
} as const;

export type ConsultationMode =
  (typeof CONSULTATION_MODES)[keyof typeof CONSULTATION_MODES];

export const DEFAULT_CONSULTATION_MODE: ConsultationMode =
  CONSULTATION_MODES.NEW_PROJECT;

/** Tuple form, for `z.enum` — keeps the form schema typed as ConsultationMode. */
export const CONSULTATION_MODE_VALUES = Object.values(CONSULTATION_MODES) as [
  ConsultationMode,
  ...ConsultationMode[],
];

export type ConsultationModeOption = {
  mode: ConsultationMode;
  /** Rendered as text, not an icon component — these are the emoji the brief specifies. */
  emoji: string;
  label: string;
  description: string;
  examples: string[];
  /** Replaces the wizard's "describe your idea" prompt, which only fits a new build. */
  ideaStepTitle: string;
  ideaStepDescription: string;
  ideaPlaceholder: string;
};

export const CONSULTATION_MODE_OPTIONS: ConsultationModeOption[] = [
  {
    mode: CONSULTATION_MODES.NEW_PROJECT,
    emoji: "🆕",
    label: "Build a New Project",
    description: "Build a brand-new application from scratch.",
    examples: ["Food Delivery App", "CRM", "Hospital System", "E-commerce Website"],
    ideaStepTitle: "What do you want to build?",
    ideaStepDescription:
      "Describe your idea in a few sentences. The more detail you give, the sharper the estimate.",
    ideaPlaceholder:
      "e.g. A food delivery app where customers order from local restaurants and track their delivery in real time.",
  },
  {
    mode: CONSULTATION_MODES.FEATURE_ENHANCEMENT,
    emoji: "🚀",
    label: "Enhance an Existing Project",
    description:
      "You already have a working application and want to add new features to it.",
    examples: [
      "Add Subscription Module",
      "Add AI Chatbot",
      "Add Payment Gateway",
      "Add Mobile App",
      "Add Admin Dashboard",
    ],
    ideaStepTitle: "What do you want to add?",
    ideaStepDescription:
      "Tell us about your existing application and the new functionality you need. We'll ask about your current stack next.",
    ideaPlaceholder:
      "e.g. We run a React and Node.js booking platform and want to add a subscription module with recurring billing.",
  },
  {
    mode: CONSULTATION_MODES.MAINTENANCE,
    emoji: "🔧",
    label: "Maintenance & Support",
    description:
      "You need ongoing maintenance, bug fixing, upgrades, monitoring or optimisation.",
    examples: [
      "Bug Fixes",
      "Performance Optimisation",
      "Dependency Updates",
      "Security Updates",
      "Server Maintenance",
      "Database Optimisation",
      "Production Support",
    ],
    ideaStepTitle: "What system needs support?",
    ideaStepDescription:
      "Describe the system you're running and what's going wrong. We won't ask you for new project requirements.",
    ideaPlaceholder:
      "e.g. A Laravel e-commerce site on a single VPS. Checkout is slow at peak and we get intermittent 502s with no monitoring in place.",
  },
  {
    mode: CONSULTATION_MODES.MODERNIZATION,
    emoji: "🔄",
    label: "Modernization & Migration",
    description: "Upgrade or migrate an existing system to a newer stack or platform.",
    examples: [
      "Angular → React",
      "PHP → Node.js",
      "React → Next.js",
      "Native → Flutter",
      "On-Premise → AWS",
      "Legacy Database Migration",
    ],
    ideaStepTitle: "What are you migrating?",
    ideaStepDescription:
      "Tell us what you run today and what you want to move to. We'll cover data migration and downtime next.",
    ideaPlaceholder:
      "e.g. An AngularJS 1.x front end on a PHP 5 backend that we want moved to React and Node.js without losing our order history.",
  },
];

const OPTION_BY_MODE = new Map(
  CONSULTATION_MODE_OPTIONS.map((option) => [option.mode, option]),
);

export function isConsultationMode(value: unknown): value is ConsultationMode {
  return typeof value === "string" && OPTION_BY_MODE.has(value as ConsultationMode);
}

/**
 * Never throws. A persisted session from before this feature shipped, or a stale
 * value, resolves to the mode the platform has always behaved as — matching the
 * backend's normalizeConsultationMode exactly.
 */
export function normalizeConsultationMode(value: unknown): ConsultationMode {
  return isConsultationMode(value) ? value : DEFAULT_CONSULTATION_MODE;
}

export function getConsultationModeOption(
  mode: ConsultationMode,
): ConsultationModeOption {
  return OPTION_BY_MODE.get(mode) ?? CONSULTATION_MODE_OPTIONS[0]!;
}

export function getConsultationModeLabel(mode: ConsultationMode): string {
  return getConsultationModeOption(mode).label;
}
