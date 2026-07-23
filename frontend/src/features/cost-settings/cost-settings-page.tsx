import { motion } from "framer-motion";
import { RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SectionError } from "@/components/shared/section-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ComplexityMultipliersSection,
  DiscountSection,
  HourlyRatesSection,
  PlatformMultipliersSection,
  RiskAndCurrencySection,
  TaxSection,
} from "@/features/cost-settings/components/cost-rules-sections";
import { PricingPreviewCard } from "@/features/cost-settings/components/pricing-preview-card";
import {
  useCostConfiguration,
  useSaveCostConfiguration,
} from "@/features/cost-settings/hooks/use-cost-settings";
import type {
  CostComplexityLevel,
  CostConfiguration,
  CostPlatform,
  CostSettings,
} from "@/types";
import { staggerContainer } from "@/utils/motion";

/** The preview's opening scenario — a mid-sized web project. */
const DEFAULT_SCENARIO = {
  estimatedHours: 320,
  complexityLevel: "MEDIUM" as CostComplexityLevel,
  platforms: ["WEB"] as CostPlatform[],
};

/**
 * Cost Management — the platform's pricing engine.
 *
 * Not a settings screen: these values are what turn the AI's effort estimate
 * into a project price, so every estimate reprices the moment they change. The
 * AI is never asked what something costs.
 *
 * The whole rate card is edited as one draft with one Save, because a
 * half-applied rate card would price live estimates from a mix of old and new
 * rules.
 */
export function CostSettingsPage() {
  const { data, isLoading, isError, refetch } = useCostConfiguration();
  const saveConfiguration = useSaveCostConfiguration();

  const [draft, setDraft] = useState<CostConfiguration | null>(null);
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  /** Which saved version the draft was seeded from. */
  const seededAt = useRef<string | null>(null);

  // Seeds once per saved version: a background refetch must not discard edits
  // in progress, but a successful save should adopt the server's response.
  useEffect(() => {
    if (!data) return;
    if (seededAt.current === data.settings.updatedAt) return;

    seededAt.current = data.settings.updatedAt;
    setDraft(structuredClone(data));
  }, [data]);

  const isDirty = useMemo(() => {
    if (!data || !draft) return false;
    return JSON.stringify(data) !== JSON.stringify(draft);
  }, [data, draft]);

  // Native guard against losing unsaved pricing rules on reload / tab close.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const patchSettings = (next: Partial<CostSettings>) =>
    setDraft((current) =>
      current ? { ...current, settings: { ...current.settings, ...next } } : current,
    );

  const save = () => {
    if (!draft) return;

    saveConfiguration.mutate({
      hourlyRates: draft.hourlyRates,
      complexityMultipliers: draft.complexityMultipliers,
      platformMultipliers: draft.platformMultipliers,
      settings: {
        riskBufferPercentage: draft.settings.riskBufferPercentage,
        defaultCurrency: draft.settings.defaultCurrency,
        taxEnabled: draft.settings.taxEnabled,
        taxType: draft.settings.taxType,
        taxPercentage: draft.settings.taxPercentage,
        discountType: draft.settings.discountType,
        discountValue: draft.settings.discountValue,
        maxDiscountPercentage: draft.settings.maxDiscountPercentage,
      },
    });
  };

  const reset = () => {
    if (data) setDraft(structuredClone(data));
  };

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Cost Management"
          description="The pricing rules every estimate is calculated from."
        />
        <SectionError message="Couldn't load your pricing rules." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading || !draft) {
    return (
      <div>
        <PageHeader
          title="Cost Management"
          description="The pricing rules every estimate is calculated from."
        />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <PageHeader
        title="Cost Management"
        description="Effort comes from the AI. Price comes from these rules — change them and every new estimate reprices, no deploy needed."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isDirty ? (
              <Badge variant="warning" size="sm" dot>
                Unsaved changes
              </Badge>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={!isDirty || saveConfiguration.isPending}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={save}
              isLoading={saveConfiguration.isPending}
              disabled={!isDirty}
            >
              <Save className="h-3.5 w-3.5" />
              Save pricing rules
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-5"
        >
          <HourlyRatesSection
            rates={draft.hourlyRates}
            currencySymbol={draft.settings.currencySymbol}
            onChange={(hourlyRates) =>
              setDraft((current) => (current ? { ...current, hourlyRates } : current))
            }
          />

          <ComplexityMultipliersSection
            multipliers={draft.complexityMultipliers}
            onChange={(complexityMultipliers) =>
              setDraft((current) =>
                current ? { ...current, complexityMultipliers } : current,
              )
            }
          />

          <PlatformMultipliersSection
            multipliers={draft.platformMultipliers}
            onChange={(platformMultipliers) =>
              setDraft((current) =>
                current ? { ...current, platformMultipliers } : current,
              )
            }
          />

          <RiskAndCurrencySection settings={draft.settings} onChange={patchSettings} />
          <TaxSection settings={draft.settings} onChange={patchSettings} />
          <DiscountSection
            settings={draft.settings}
            currencySymbol={draft.settings.currencySymbol}
            onChange={patchSettings}
          />
        </motion.div>

        {/*
          The preview reads the SAVED rates and multipliers, with the unsaved
          commercial values passed as overrides. It is therefore honest about
          what is live: change the risk buffer and it updates instantly; change a
          rate and it updates once saved.
        */}
        <div>
          <PricingPreviewCard
            scenario={scenario}
            onScenarioChange={(next) =>
              setScenario((current) => ({ ...current, ...next }))
            }
            overrides={{
              riskBufferPercentage: draft.settings.riskBufferPercentage,
              discountType: draft.settings.discountType,
              discountValue: draft.settings.discountValue,
              taxEnabled: draft.settings.taxEnabled,
              taxPercentage: draft.settings.taxPercentage,
            }}
            currency={draft.settings.defaultCurrency}
          />
        </div>
      </div>
    </div>
  );
}
