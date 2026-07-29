import { create } from "zustand";
import { formatAdjustedWeeks } from "@/client-portal/estimate/estimate-pricing";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_CONSULTATION_MODE,
  type ConsultationMode,
  type CostPreview,
  type FeatureComplexity,
  type FeaturePriority,
} from "@/types";

/**
 * Structure only for fields not yet backed by a real flow — no business logic here.
 * Field types are intentionally loose (e.g. `Record<string, unknown>` for estimate)
 * since no public-facing backend contract exists yet for those steps; they're
 * expected to be tightened once real logic is implemented, same as `conversation`
 * was tightened once the AI discovery backend landed.
 */

/**
 * The only storage key this store ever touches. Exported so the clearing logic
 * below (and any future consumer) references one constant instead of a literal.
 */
export const CLIENT_CONSULTATION_STORAGE_KEY = "asc-client-consultation";

/**
 * Persisted to **sessionStorage, not localStorage**, deliberately.
 *
 * A visitor mid-consultation must survive an accidental refresh, so the wizard
 * state has to be persisted somewhere. But it must NOT survive the browser being
 * closed: a public portal that resurrects last week's project on a fresh visit is
 * both wrong and a privacy leak on a shared machine. sessionStorage is exactly
 * that boundary — it outlives a reload, not the tab.
 *
 * On top of that, the key is removed outright when a consultation ends (lead
 * submitted) or a new one is started — see clearClientConsultation().
 *
 * Scoped strictly to this key: `asc-auth`, `asc-theme` and `asc-proposal-drafts`
 * are other features' data and are never touched here.
 */
const clientConsultationStorage = createJSONStorage(() => sessionStorage);

/**
 * Earlier builds persisted this same key to localStorage — that entry is why a
 * completed consultation came back after a browser restart. Drop the orphan once
 * on load so existing visitors get the fixed behaviour without clearing site
 * data, and so no stale copy lingers. One key only; never localStorage.clear().
 */
localStorage.removeItem(CLIENT_CONSULTATION_STORAGE_KEY);

export type ClientPreferredContactMethod = "EMAIL" | "PHONE" | "WHATSAPP";

export type ClientContactInfo = {
  name: string;
  email: string;
  company: string;
  phone: string;
  whatsapp: string;
  country: string;
  preferredContactMethod: ClientPreferredContactMethod;
  notes: string;
};

/** One turn of the AI discovery interview, mirroring the backend's conversation shape exactly. */
export type ClientConversationTurn = {
  role: "assistant" | "user";
  content: string;
};

/** `id` is client-generated (crypto.randomUUID) — there's no DB row to key off, unlike the admin's DetectedFeature. */
export type ClientFeature = {
  id: string;
  name: string;
  category: string;
  description: string;
  priority: FeaturePriority;
  complexity: FeatureComplexity;
};

export type ClientEstimateBreakdownItem = {
  category: string;
  hours: number;
};

/**
 * The AI's effort estimate (hours, weeks, team, complexity, breakdown). The
 * project cost is never part of this — it is priced separately by the Cost Engine
 * and kept in `pricing`, so the AI is never the source of a number the client pays.
 */
/** Present only for a MAINTENANCE engagement — see the estimate DTO on the backend. */
export type ClientMaintenancePlan = {
  engagementType: "ONE_TIME_FIX" | "MONTHLY_RETAINER" | "ONGOING_SUPPORT";
  supportHoursPerMonth: number;
  priorityLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  suggestedSla: string;
  supportScope: string[];
};

/** Present only for a MODERNIZATION engagement. */
export type ClientMigrationPlan = {
  phases: Array<{ name: string; description: string; hours: number }>;
  rollbackStrategy: string;
  downtimeEstimate: string;
};

/** Present only for a FEATURE_ENHANCEMENT engagement. */
export type ClientEnhancementImpact = {
  impactAnalysis: string[];
  dependencies: string[];
  affectedModules: string[];
};

export type ClientEstimate = {
  estimatedHours: number;
  /**
   * Null for a MAINTENANCE engagement: a support arrangement has no delivery
   * date, so there is no number to show. Always present for the other modes.
   */
  estimatedWeeks: number | null;
  teamSize: number;
  complexity: FeatureComplexity;
  confidence: number;
  assumptions: string[];
  risks: string[];
  breakdown: ClientEstimateBreakdownItem[];
  maintenancePlan: ClientMaintenancePlan | null;
  migrationPlan: ClientMigrationPlan | null;
  enhancementImpact: ClientEnhancementImpact | null;
};

/** One row of the Estimate step's per-feature display. `hours` is the feature's share of the AI's total effort (split by complexity) and drives the live Project Cost as rows are toggled. */
export type ClientFeatureBreakdownItem = {
  featureId: string;
  name: string;
  category: string;
  complexity: FeatureComplexity;
  hours: number;
  included: boolean;
};

export type ClientConsultationState = {
  /**
   * The kind of engagement this consultation is — chosen on the mode selection
   * screen before the wizard starts, and sent with every AI request from here on.
   *
   * Not a display preference: it decides which questions get asked, which feature
   * categories come back, what the estimate contains, which proposal template is
   * used and whether concept screens are generated at all. A session persisted
   * before this field existed simply has no key for it, and Zustand's persist
   * merge keeps the initial value — so an in-progress visit resumes as
   * NEW_PROJECT, which is what it always was.
   */
  consultationMode: ConsultationMode;
  /**
   * Stable id for this consultation, minted once and kept for the whole visit.
   *
   * The portal is otherwise stateless server-side, so this is the only thing that
   * lets the backend recognise a returning visitor — it is the cache key for the
   * AI concept mockups, and what makes "generate once, never again on refresh"
   * possible without accounts. Cleared with the rest of the wizard, so a new
   * consultation gets a new key and its own mockups.
   */
  consultationKey: string;
  /** Id of the requirements-wizard step the visitor last viewed, so the flow can resume there. */
  currentStep: string | null;
  projectIdea: string;
  consultationTime: string | null;
  platforms: string[];
  otherPlatform: string;
  /** Full AI discovery transcript so far, alternating assistant/user turns. */
  conversation: ClientConversationTurn[];
  /** The question currently awaiting an answer — the last assistant turn's content, kept separately for convenience. */
  currentQuestion: string | null;
  isDiscoveryComplete: boolean;
  summary: string | null;
  /** The client's free-form "anything else" note from the Summary step, merged into `summary` as its "Additional Notes" section on continue. */
  additionalNotes: string;
  features: ClientFeature[];
  estimate: ClientEstimate | null;
  timeline: string | null;
  complexity: FeatureComplexity | null;
  recommendedTeam: number | null;
  /** AI-recommended technology stack; null until an estimate is generated, or when the AI returns none. */
  techStack: string[] | null;
  /** Final project cost from the Cost Engine (never the AI) at the AI's full hours; null until priced, or on a pricing failure. */
  pricing: CostPreview | null;
  /** Recurring monthly cost for a MAINTENANCE engagement; null for every other mode. */
  monthlyPricing: CostPreview | null;
  /**
   * The price after the client's feature toggles — exactly what the Estimate page
   * is showing. Persisted so later steps (the Proposal) can *present* the figure
   * the client already saw instead of asking the Cost Engine for it again. Null
   * when nothing is priced, or when every feature has been switched off.
   */
  currentPricing: CostPreview | null;
  featureBreakdown: ClientFeatureBreakdownItem[];
  contactInfo: ClientContactInfo;
};

type ClientConsultationActions = {
  /** Also clears discovery: questions already asked belong to the previous mode. */
  setConsultationMode: (value: ConsultationMode) => void;
  setCurrentStep: (value: string | null) => void;
  setProjectIdea: (value: string) => void;
  setConsultationTime: (value: string | null) => void;
  setPlatforms: (value: string[]) => void;
  setOtherPlatform: (value: string) => void;
  /** Appends an assistant question to the transcript and marks it as the current question. */
  addAssistantQuestion: (question: string) => void;
  /** Appends the visitor's answer to the current question to the transcript. */
  addUserAnswer: (answer: string) => void;
  setDiscoveryComplete: (value: boolean) => void;
  resetDiscovery: () => void;
  setSummary: (value: string | null) => void;
  setAdditionalNotes: (value: string) => void;
  /** Bulk replace — used after generate/regenerate, ids already assigned by the caller. */
  setFeatures: (value: ClientFeature[]) => void;
  addFeature: (feature: Omit<ClientFeature, "id">) => void;
  updateFeature: (id: string, patch: Partial<Omit<ClientFeature, "id">>) => void;
  removeFeature: (id: string) => void;
  /** Bulk sets estimate + the derived timeline/complexity/recommendedTeam/techStack/pricing/featureBreakdown together, used after generate/regenerate. */
  applyEstimateResult: (input: {
    estimate: ClientEstimate;
    featureBreakdown: ClientFeatureBreakdownItem[];
    techStack: string[] | null;
    pricing: CostPreview | null;
    /** Recurring monthly cost of a support engagement; null for every other mode. */
    monthlyPricing: CostPreview | null;
  }) => void;
  /** Records the repriced figure the Estimate page is displaying, so every later step presents the same number. */
  setCurrentPricing: (value: CostPreview | null) => void;
  toggleFeatureIncluded: (featureId: string) => void;
  setContactInfo: (value: Partial<ClientContactInfo>) => void;
  reset: () => void;
};

/**
 * Must be a real UUID, not an ad-hoc random string: the backend validates the
 * consultation key as a uuid and stores it in a uuid column, so a `Date.now()`
 * style fallback would be rejected on older browsers rather than degrading.
 */
function createConsultationKey(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (uuid) return uuid;

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (char) => {
    const digit = Number(char);
    return (
      digit ^
      (globalThis.crypto?.getRandomValues?.(new Uint8Array(1))?.[0] ??
        Math.floor(Math.random() * 256)) &
        (15 >> (digit / 4))
    ).toString(16);
  });
}

const INITIAL_STATE: ClientConsultationState = {
  consultationMode: DEFAULT_CONSULTATION_MODE,
  consultationKey: createConsultationKey(),
  currentStep: null,
  projectIdea: "",
  consultationTime: null,
  platforms: [],
  otherPlatform: "",
  conversation: [],
  currentQuestion: null,
  isDiscoveryComplete: false,
  summary: null,
  additionalNotes: "",
  features: [],
  estimate: null,
  timeline: null,
  complexity: null,
  recommendedTeam: null,
  techStack: null,
  pricing: null,
  monthlyPricing: null,
  currentPricing: null,
  featureBreakdown: [],
  contactInfo: {
    name: "",
    email: "",
    company: "",
    phone: "",
    whatsapp: "",
    country: "",
    preferredContactMethod: "EMAIL",
    notes: "",
  },
};

export const useClientConsultationStore = create<
  ClientConsultationState & ClientConsultationActions
>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      // Switching mode invalidates the interview: the questions already asked
      // were generated for a different engagement type, and feeding them to the
      // new one would produce a transcript that contradicts itself.
      setConsultationMode: (value) =>
        set({
          consultationMode: value,
          conversation: [],
          currentQuestion: null,
          isDiscoveryComplete: false,
        }),
      setCurrentStep: (value) => set({ currentStep: value }),
      setProjectIdea: (value) => set({ projectIdea: value }),
      setConsultationTime: (value) => set({ consultationTime: value }),
      setPlatforms: (value) => set({ platforms: value }),
      setOtherPlatform: (value) => set({ otherPlatform: value }),
      addAssistantQuestion: (question) =>
        set((state) => ({
          conversation: [...state.conversation, { role: "assistant", content: question }],
          currentQuestion: question,
        })),
      addUserAnswer: (answer) =>
        set((state) => ({
          conversation: [...state.conversation, { role: "user", content: answer }],
        })),
      setDiscoveryComplete: (value) => set({ isDiscoveryComplete: value, currentQuestion: null }),
      resetDiscovery: () =>
        set({ conversation: [], currentQuestion: null, isDiscoveryComplete: false }),
      setSummary: (value) => set({ summary: value }),
      setAdditionalNotes: (value) => set({ additionalNotes: value }),
      setFeatures: (value) => set({ features: value }),
      addFeature: (feature) =>
        set((state) => ({
          features: [
            ...state.features,
            {
              ...feature,
              id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            },
          ],
        })),
      updateFeature: (id, patch) =>
        set((state) => ({
          features: state.features.map((feature) =>
            feature.id === id ? { ...feature, ...patch } : feature,
          ),
        })),
      removeFeature: (id) =>
        set((state) => ({ features: state.features.filter((feature) => feature.id !== id) })),
      applyEstimateResult: ({
        estimate,
        featureBreakdown,
        techStack,
        pricing,
        monthlyPricing,
      }) =>
        set({
          estimate,
          monthlyPricing,
          // A support engagement reports its recurring capacity instead of a
          // delivery window — there is no date to count down to.
          timeline:
            estimate.estimatedWeeks === null
              ? estimate.maintenancePlan
                ? `${estimate.maintenancePlan.supportHoursPerMonth} hrs / month`
                : null
              : formatAdjustedWeeks(estimate.estimatedWeeks),
          complexity: estimate.complexity,
          recommendedTeam: estimate.teamSize,
          techStack,
          pricing,
          // A fresh estimate starts with every feature included, so the current
          // price is the original one until the client toggles something.
          currentPricing: pricing,
          featureBreakdown,
        }),
      setCurrentPricing: (value) => set({ currentPricing: value }),
      toggleFeatureIncluded: (featureId) =>
        set((state) => ({
          featureBreakdown: state.featureBreakdown.map((item) =>
            item.featureId === featureId ? { ...item, included: !item.included } : item,
          ),
        })),
      setContactInfo: (value) =>
        set((state) => ({ contactInfo: { ...state.contactInfo, ...value } })),
      // A fresh key per consultation, so a new visit never inherits the previous
      // one's cached mockups (which were generated from different requirements).
      reset: () => set({ ...INITIAL_STATE, consultationKey: createConsultationKey() }),
    }),
    {
      name: CLIENT_CONSULTATION_STORAGE_KEY,
      storage: clientConsultationStorage,
    },
  ),
);

/**
 * Ends the current consultation: wipes the in-memory state *and* removes the
 * persisted key, so nothing is left to rehydrate from.
 *
 * `reset()` alone only writes INITIAL_STATE back through the persist middleware,
 * which leaves the key present — fine for the UI, but it keeps a (now empty)
 * record of the visit around. Removing the key is the honest end state.
 *
 * A plain function rather than a hook so it can be called from mutation
 * callbacks and other non-component code. For the common "clear and go to step
 * one" case, use useStartNewConsultation().
 */
export function clearClientConsultation() {
  useClientConsultationStore.getState().reset();
  useClientConsultationStore.persist.clearStorage();
}

/**
 * True when there is an in-progress consultation worth offering to resume.
 * Checks the fields a visitor can only have filled by actually starting the
 * flow — `currentStep` alone would be true after merely opening step one.
 */
export const selectHasConsultationProgress = (state: ClientConsultationState) =>
  state.projectIdea.trim().length > 0 ||
  state.conversation.length > 0 ||
  state.summary !== null ||
  state.features.length > 0;
