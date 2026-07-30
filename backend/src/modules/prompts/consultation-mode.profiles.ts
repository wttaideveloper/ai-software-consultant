import {
  CONSULTATION_MODES,
  type ConsultationMode,
} from "../../shared/constants/consultation-mode.js";

/**
 * Everything that differs between the four engagement types, in one table.
 *
 * This file is the reason Consultation Mode is a platform feature and not a UI
 * toggle. Each pipeline stage reads exactly one slice of the profile:
 *
 *   discovery        -> context + discoveryFocus + discoveryDirective
 *   summary          -> summaryDirective
 *   feature detection-> featureCategories + featureDirective
 *   estimation       -> estimationDirective (+ the mode blocks in estimation.validation)
 *   tech stack       -> techStackDirective
 *   proposal         -> proposalTitle + proposalDirective
 *   concept mockups  -> mockupPolicy
 *
 * Keeping them together is deliberate: adding a fifth mode must be one entry
 * here plus one enum member, not a hunt through seven prompt strings. Equally,
 * nothing else in the codebase may branch on mode with its own `if` — if a stage
 * needs mode-specific behaviour, it belongs in this table.
 *
 * The strings are prompt fragments, interpolated into the templates in
 * prompt.builder.ts via `{{mode*}}` variables. They are written as instructions to
 * a model, not as UI copy.
 */

/** Whether a mode's engagement normally produces client-facing UI concepts. */
export const MOCKUP_POLICIES = {
  /** Always generate — the engagement is about screens the client does not have yet. */
  ALWAYS: "ALWAYS",
  /** Only when the gathered requirements actually mention UI/UX work. */
  CONDITIONAL: "CONDITIONAL",
} as const;

export type MockupPolicy = (typeof MOCKUP_POLICIES)[keyof typeof MOCKUP_POLICIES];

/**
 * How a mode's technology recommendation is composed.
 *
 * The deterministic greenfield baseline (React, Node, PostgreSQL, Docker…) is
 * only correct when there is nothing yet. Handing it to a client who already runs
 * a system reads as "replace everything you have", which is the opposite of what
 * an enhancement or a support engagement is. This is the switch that stops that.
 */
export const TECH_STACK_POLICIES = {
  /** Full recommended stack: deterministic baseline enriched by the AI. */
  BASELINE_PLUS_AI: "BASELINE_PLUS_AI",
  /** Only what the AI names for the new work — no greenfield baseline. */
  AI_ONLY: "AI_ONLY",
  /** No stack at all; the surface shows scope of service instead. */
  NONE: "NONE",
} as const;

export type TechStackPolicy =
  (typeof TECH_STACK_POLICIES)[keyof typeof TECH_STACK_POLICIES];

export type ConsultationModeProfile = {
  /** Human label, used in prompts and mirrored by the frontend registry. */
  label: string;
  /** One line establishing what the client already has. Leads every mode-aware prompt. */
  context: string;
  /** The topics discovery should cover for this mode, in priority order. */
  discoveryFocus: string;
  /** Extra rules the interviewer must follow for this mode. */
  discoveryDirective: string;
  /** How the requirement summary should be framed. */
  summaryDirective: string;
  /** The category vocabulary feature detection must use. */
  featureCategories: string;
  /** How to interpret "feature" for this mode. */
  featureDirective: string;
  /** What the estimate must and must not contain. */
  estimationDirective: string;
  /** What kind of technologies to recommend. */
  techStackDirective: string;
  /** The proposal document's name. */
  proposalTitle: string;
  /** How the proposal should be structured. */
  proposalDirective: string;
  /** How the technology recommendation is built for this engagement type. */
  techStackPolicy: TechStackPolicy;
  mockupPolicy: MockupPolicy;
  /**
   * Why a CONDITIONAL mode would still warrant mockups — used both as the
   * keyword source for the deterministic gate and to explain the decision.
   */
  mockupCondition: string;
};

export const CONSULTATION_MODE_PROFILES: Record<
  ConsultationMode,
  ConsultationModeProfile
> = {
  [CONSULTATION_MODES.NEW_PROJECT]: {
    label: "Build a New Project",
    context:
      "The client is building a brand-new application from scratch. Nothing exists yet, so there is no current system, codebase or stack to work around.",
    discoveryFocus:
      "the business idea and the problem being solved; target users and their roles; core features; platforms; integrations; authentication; payments; notifications; reports and dashboards; AI features; admin requirements; security; compliance; performance; scalability; future plans",
    discoveryDirective:
      "Never ask what the client's existing system or current technology stack is — there isn't one. Establish what should be built and for whom.",
    summaryDirective:
      "Frame the summary as the specification for a new build: what will be created, for whom, and what it must do.",
    featureCategories:
      "Core, User Management, Authentication, Payments, Notifications, Search, Reporting, Admin, Integrations, AI, Content, Infrastructure",
    featureDirective:
      "Each feature is a capability to be built from nothing.",
    estimationDirective:
      "Estimate a full build: total development effort, the number of calendar weeks that effort implies, and the team required.",
    techStackDirective:
      "Recommend a complete stack for a greenfield build — language, framework, database, and the key services the described features require.",
    proposalTitle: "Project Proposal",
    proposalDirective:
      "Write a new-build project proposal: scope of work covering everything to be created, phased deliverables, and the delivery timeline implied by the estimate.",
    techStackPolicy: TECH_STACK_POLICIES.BASELINE_PLUS_AI,
    mockupPolicy: MOCKUP_POLICIES.ALWAYS,
    mockupCondition: "A new build always needs concept screens.",
  },

  [CONSULTATION_MODES.FEATURE_ENHANCEMENT]: {
    label: "Enhance an Existing Project",
    context:
      "The client ALREADY HAS a working application in production. This engagement adds new functionality to that existing system. Assume the existing application exists and never propose rebuilding it.",
    discoveryFocus:
      "a description of the existing application; the technologies currently in use; the current database; which APIs already exist; the authentication system in use; the new functionality wanted; whether the new feature must integrate with existing modules; whether existing users need migrating; which parts of the system will be affected",
    discoveryDirective:
      "Establish the existing system BEFORE the new functionality — an enhancement cannot be scoped without knowing what it plugs into. Ask about the current stack, database, APIs and auth as concrete questions, one at a time.",
    summaryDirective:
      "Frame the summary as an addition to a live system: state what exists today, what is being added, and where the two meet.",
    featureCategories:
      "New Feature, Existing Module Change, Integration, Data Migration, API Extension, Authentication Change, Admin, Infrastructure Impact",
    featureDirective:
      "Each feature is an addition or change to an application that already runs. Say what it touches in the existing system.",
    estimationDirective:
      "Estimate the enhancement only, never the whole application. Include an impact analysis of the existing modules affected, the dependencies the work relies on, and the risks of changing a live system.",
    techStackDirective:
      "Recommend technologies that fit the client's CURRENT stack — the libraries and services needed for the new functionality plus anything required to integrate with what already exists. Never propose replacing the existing stack.",
    proposalTitle: "Feature Enhancement Proposal",
    proposalDirective:
      "Write a feature enhancement proposal: what is being added to the existing application, the impact on current modules, dependencies, and the rollout approach.",
    techStackPolicy: TECH_STACK_POLICIES.AI_ONLY,
    mockupPolicy: MOCKUP_POLICIES.ALWAYS,
    mockupCondition: "New functionality needs screens showing how it will look.",
  },

  [CONSULTATION_MODES.MAINTENANCE]: {
    label: "Maintenance & Support",
    context:
      "The client ALREADY HAS a system running in production and needs ongoing maintenance and support — bug fixing, performance, security, upgrades, monitoring, infrastructure. This is NOT a project to build anything new.",
    discoveryFocus:
      "a description of the current system; the problems being experienced; whether there are live production issues; how many users are affected; whether error logs exist; whether monitoring is already in place; which environments exist (development, staging, production); and which kinds of maintenance are needed (bug fixes, performance, security, infrastructure, database, DevOps, monitoring, long-term support)",
    discoveryDirective:
      "Do NOT ask for new project requirements — no business idea, no target users, no feature wish-list. This client has a running system with problems. Ask about the system as it is, what is going wrong, and what support they need.",
    summaryDirective:
      "Frame the summary as a support engagement: the current system, the problems observed, their operational impact, and the maintenance scope required. Do not describe a product to be built.",
    featureCategories:
      "Bug Fix, Performance, Security, Monitoring, Infrastructure, Database, DevOps, Production Support",
    featureDirective:
      "Each item is a maintenance work item, NOT a product feature. Never output product features such as Shopping Cart, Checkout or Orders — output the work to be done, such as a specific bug fix, a query optimisation, a dependency upgrade or a monitoring setup.",
    estimationDirective:
      "This is an ongoing support engagement, NOT a project. Do NOT produce a project timeline, project duration, launch timeline or delivery weeks — there is no delivery date. Instead recommend the engagement type (one-time fix, monthly retainer, or ongoing support), the support hours needed per month, a priority level, a suggested SLA, and the support team required. Effort is expressed as support capacity, not a countdown to a launch.",
    techStackDirective:
      "Recommend the technologies this support engagement needs: keep the client's existing technologies, and add monitoring, logging, security, DevOps and backup tooling appropriate to the problems described. Never propose a rewrite.",
    proposalTitle: "Maintenance & Support Agreement",
    proposalDirective:
      "Write a maintenance and support agreement, not a project proposal: scope of support, engagement model, response and resolution targets, monthly capacity and what is excluded. It must contain no delivery date and no launch plan.",
    techStackPolicy: TECH_STACK_POLICIES.NONE,
    mockupPolicy: MOCKUP_POLICIES.CONDITIONAL,
    mockupCondition:
      "Maintenance work is not visual, so concepts are generated only when the requirements explicitly ask for UI or UX improvement.",
  },

  [CONSULTATION_MODES.MODERNIZATION]: {
    label: "Modernization & Migration",
    context:
      "The client ALREADY HAS a working system built on older technology and wants it upgraded or migrated to a different stack or platform. The functionality largely exists; what changes is what it runs on.",
    discoveryFocus:
      "a description of the current system; the current technology stack; the target technology stack; the goals of the migration; data migration requirements; downtime tolerance; performance expectations; compatibility requirements; third-party integrations; and the deployment environment",
    discoveryDirective:
      "Establish both sides of the migration — what they run today and what they want to run instead. Downtime tolerance and data migration are first-class topics here, not afterthoughts.",
    summaryDirective:
      "Frame the summary as a migration: the current system, the target system, what must be preserved, and what must not break.",
    featureCategories:
      "Migration Phase, Data Migration, Compatibility, Refactor, Infrastructure, Integration, Testing, Rollback",
    featureDirective:
      "Each item is a migration work item — a component to port, data to move, or compatibility to preserve — not a new product feature.",
    estimationDirective:
      "Estimate a migration: break the work into ordered migration phases with effort per phase, and state the migration risks, the rollback strategy, and the expected downtime.",
    techStackDirective:
      "Recommend both sides plus the crossing: the current stack being migrated from, the target stack being migrated to, and the migration, compatibility and data-transfer tooling the move requires.",
    proposalTitle: "Migration Proposal",
    proposalDirective:
      "Write a migration proposal: current state, target state, phased migration plan, data migration approach, rollback strategy, downtime expectations and cut-over.",
    techStackPolicy: TECH_STACK_POLICIES.BASELINE_PLUS_AI,
    mockupPolicy: MOCKUP_POLICIES.CONDITIONAL,
    mockupCondition:
      "A migration usually preserves the existing interface, so concepts are generated only when the requirements say the migration includes a UI redesign.",
  },
};

export function getConsultationModeProfile(
  mode: ConsultationMode,
): ConsultationModeProfile {
  return CONSULTATION_MODE_PROFILES[mode];
}
