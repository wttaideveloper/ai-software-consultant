import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  clientMockupsService,
  type ClientMockupSet,
  type GenerateMockupsPayload,
} from "@/services/client-mockups.service";
import { useClientConsultationStore } from "@/store/client-consultation.store";
import { getApiErrorMessage } from "@/utils/api-error";

const MOCKUPS_QUERY_KEY = "client-mockups";
/** Images take ~30-90s in total, so a slow poll is plenty and keeps the API quiet. */
const POLL_INTERVAL_MS = 4_000;

/**
 * Drives the concept-mockup step (`/mockups`).
 *
 * Two deliberate properties:
 *
 * 1. **It never blocks the estimate.** This is its own query with its own state on
 *    its own route; the estimate is resolved and stored before this ever mounts, and
 *    a failure here degrades to a retry panel rather than affecting anything upstream.
 * 2. **Reading is free, generating is not — and generating is user-initiated.** The
 *    GET is a pure read, so mounting the page, refreshing and polling all cost
 *    nothing. A billable batch starts ONLY when the visitor clicks Generate, which
 *    calls `generate()` below. There is intentionally no auto-generation effect:
 *    mockups are optional, so no AI credits are spent until the client opts in.
 */
export function useConceptMockups(input: {
  requirementSummary: string | null;
  features: GenerateMockupsPayload["features"];
  platforms: string[];
  techStack: string[];
  /** Gate: only fetch/allow generation once the estimate exists. */
  enabled: boolean;
}) {
  const consultationKey = useClientConsultationStore((state) => state.consultationKey);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [MOCKUPS_QUERY_KEY, consultationKey],
    queryFn: () => clientMockupsService.get(consultationKey),
    enabled: input.enabled && Boolean(consultationKey),
    // Keep polling only while a batch is actually being produced.
    refetchInterval: (query) =>
      query.state.data?.status === "PENDING" ? POLL_INTERVAL_MS : false,
    staleTime: 0,
  });

  const buildPayload = (): GenerateMockupsPayload => ({
    consultationKey,
    requirementSummary: input.requirementSummary ?? "",
    features: input.features,
    platforms: input.platforms,
    techStack: input.techStack,
  });

  const applyResult = (data: ClientMockupSet) => {
    queryClient.setQueryData([MOCKUPS_QUERY_KEY, consultationKey], data);
  };

  const generate = useMutation({
    mutationFn: clientMockupsService.generate,
    onSuccess: applyResult,
    // Silent: an unavailable preview must not interrupt the estimate the visitor
    // actually came for. The panel shows its own inline state instead.
    onError: () => undefined,
  });

  const regenerate = useMutation({
    mutationFn: clientMockupsService.regenerate,
    onSuccess: applyResult,
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Couldn't regenerate the concept screens. Please try again."),
      );
    },
  });

  const canGenerate =
    input.enabled &&
    Boolean(consultationKey) &&
    Boolean(input.requirementSummary) &&
    input.features.length > 0;

  return {
    set: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    /**
     * A rejected kick-off counts as failed even though the row still reads NONE —
     * the mutation's error is silent, so without this the panel would sit on
     * "preparing" forever waiting for a batch that was never accepted.
     */
    isFailed: query.data?.status === "FAILED" || generate.isError,
    isGenerating: generate.isPending || query.data?.status === "PENDING",
    isRegenerating: regenerate.isPending,
    /** Only meaningful before a batch exists — the intro CTA guards on it. */
    canGenerate,
    canRegenerate:
      query.data !== undefined &&
      query.data.regenerationsUsed < query.data.regenerationsAllowed,
    /** User-initiated: called from the "Generate AI Mockups" button, never on mount. */
    generate: () => {
      if (!canGenerate) return;
      generate.mutate(buildPayload());
    },
    regenerate: () => regenerate.mutate(buildPayload()),
    retry: () => generate.mutate(buildPayload()),
  };
}
