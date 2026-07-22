import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FeatureComplexity, FeaturePriority } from "@/types";

/**
 * Structure only for fields not yet backed by a real flow — no business logic here.
 * Field types are intentionally loose (e.g. `Record<string, unknown>` for estimate)
 * since no public-facing backend contract exists yet for those steps; they're
 * expected to be tightened once real logic is implemented, same as `conversation`
 * was tightened once the AI discovery backend landed.
 */

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
 * Mirrors the admin's aiEstimationPayloadSchema exactly — no projectCost or
 * techStack fields exist because the reused, unmodified Estimation prompt doesn't
 * produce them (see client-estimate.service.ts backend-side); both are surfaced in
 * the UI as an honest "not available" state rather than fabricated.
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

/** One row of the Estimate step's per-feature display — `hours` is matched from the AI's breakdown by feature name where possible, null otherwise (never guessed). */
export type ClientFeatureBreakdownItem = {
  featureId: string;
  name: string;
  category: string;
  complexity: FeatureComplexity;
  hours: number | null;
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
  features: ClientFeature[];
  estimate: ClientEstimate | null;
  timeline: string | null;
  complexity: FeatureComplexity | null;
  recommendedTeam: number | null;
  /** Always null — the reused Estimation prompt has no tech-stack field. Kept as its own field per spec, not fabricated. */
  techStack: string[] | null;
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
  /** Bulk replace — used after generate/regenerate, ids already assigned by the caller. */
  setFeatures: (value: ClientFeature[]) => void;
  addFeature: (feature: Omit<ClientFeature, "id">) => void;
  updateFeature: (id: string, patch: Partial<Omit<ClientFeature, "id">>) => void;
  removeFeature: (id: string) => void;
  /** Bulk sets estimate + the derived timeline/complexity/recommendedTeam/featureBreakdown together, used after generate/regenerate. */
  applyEstimateResult: (input: {
    estimate: ClientEstimate;
    featureBreakdown: ClientFeatureBreakdownItem[];
  }) => void;
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
  features: [],
  estimate: null,
  timeline: null,
  complexity: null,
  recommendedTeam: null,
  techStack: null,
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
      applyEstimateResult: ({ estimate, featureBreakdown }) =>
        set({
          estimate,
          timeline: `${estimate.estimatedWeeks} week${estimate.estimatedWeeks === 1 ? "" : "s"}`,
          complexity: estimate.complexity,
          recommendedTeam: estimate.teamSize,
          featureBreakdown,
        }),
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
      name: "asc-client-consultation",
    },
  ),
);
