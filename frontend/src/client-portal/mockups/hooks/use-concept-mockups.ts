import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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
 * Drives the concept-mockup gallery.
 *
 * Two deliberate separations from the Estimate above it:
 *
 * 1. **It never blocks the estimate.** This is its own query with its own state;
 *    the estimate has already rendered by the time this mounts, and a failure here
 *    degrades to a retry panel rather than affecting anything upstream.
 * 2. **Reading is free, generating is not.** The GET is a pure read, so refreshes
 *    and polls cost nothing. Generation is kicked off exactly once per
 *    consultation key by the effect below, guarded by a ref so a remount cannot
 *    re-trigger a billable batch — the same "auto-generate on first visit only"
 *    rule the Summary, Features and Estimate steps use, but with real money
 *    behind it.
 */
export function useConceptMockups(input: {
  requirementSummary: string | null;
  features: GenerateMockupsPayload["features"];
  platforms: string[];
  techStack: string[];
  /** Gate: only start once the estimate exists, so we never spend on a half-finished funnel. */
  enabled: boolean;
}) {
  const consultationKey = useClientConsultationStore((state) => state.consultationKey);
  const queryClient = useQueryClient();
  const hasRequestedRef = useRef(false);

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

  useEffect(() => {
    // Only NONE authorises spending. READY / PENDING / FAILED / DISABLED all mean
    // "do not start a batch" — FAILED is user-retryable rather than automatic, so
    // a persistent backend fault can't bill in a loop.
    if (hasRequestedRef.current || !canGenerate || query.data?.status !== "NONE") {
      return;
    }

    hasRequestedRef.current = true;
    generate.mutate(buildPayload());
    // Intentionally keyed to the readiness signal only — see the ref guard above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canGenerate, query.data?.status]);

  return {
    set: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    isGenerating: generate.isPending || query.data?.status === "PENDING",
    isRegenerating: regenerate.isPending,
    canRegenerate:
      query.data !== undefined &&
      query.data.regenerationsUsed < query.data.regenerationsAllowed,
    regenerate: () => regenerate.mutate(buildPayload()),
    retry: () => {
      hasRequestedRef.current = true;
      generate.mutate(buildPayload());
    },
  };
}
