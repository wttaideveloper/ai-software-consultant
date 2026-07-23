import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CostPreview, FeatureComplexity, FeaturePriority } from "@/types";

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
export type ClientEstimate = {
  estimatedHours: number;
  estimatedWeeks: number;
  teamSize: number;
  complexity: FeatureComplexity;
  confidence: number;
  assumptions: string[];
  risks: string[];
  breakdown: ClientEstimateBreakdownItem[];
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
  }) => void;
  /** Records the repriced figure the Estimate page is displaying, so every later step presents the same number. */
  setCurrentPricing: (value: CostPreview | null) => void;
  toggleFeatureIncluded: (featureId: string) => void;
  setContactInfo: (value: Partial<ClientContactInfo>) => void;
  reset: () => void;
};

const INITIAL_STATE: ClientConsultationState = {
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
      applyEstimateResult: ({ estimate, featureBreakdown, techStack, pricing }) =>
        set({
          estimate,
          timeline: `${estimate.estimatedWeeks} week${estimate.estimatedWeeks === 1 ? "" : "s"}`,
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
      reset: () => set(INITIAL_STATE),
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
