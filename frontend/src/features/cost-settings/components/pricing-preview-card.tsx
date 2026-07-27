import { Calculator, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  COST_PLATFORM_LABELS,
  formatMoney,
} from "@/features/cost-settings/cost-settings.labels";
import { useCostPreview } from "@/features/cost-settings/hooks/use-cost-settings";
import {
  COST_PLATFORMS,
  type CostCurrency,
  type CostPlatform,
  type PreviewCostParams,
} from "@/types";
import { cn } from "@/utils/cn";

type PricingPreviewCardProps = {
  /** Scenario inputs owned by the page, so the card stays presentational. */
  scenario: {
    estimatedHours: number;
    platforms: CostPlatform[];
    hourlyRate?: number;
  };
  onScenarioChange: (next: Partial<PricingPreviewCardProps["scenario"]>) => void;
  /** Unsaved edits, so the preview shows what Save would produce. */
  overrides: Pick<
    PreviewCostParams,
    | "riskBufferPercentage"
    | "discountType"
    | "discountValue"
    | "taxEnabled"
    | "taxPercentage"
  >;
  currency: CostCurrency;
};

function Line({
  label,
  value,
  hint,
  emphasis,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasis?: "total" | "muted";
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 py-2",
        emphasis === "total" && "border-t border-border pt-3",
      )}
    >
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm",
            emphasis === "total"
              ? "font-semibold text-foreground"
              : "text-foreground-soft",
          )}
        >
          {label}
        </p>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      <p
        className={cn(
          "asc-tabular shrink-0 whitespace-nowrap",
          emphasis === "total"
            ? "text-xl font-semibold text-foreground"
            : emphasis === "muted"
              ? "text-sm text-muted"
              : "text-sm font-medium text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * The live calculator.
 *
 * Every figure comes from the server's engine, not a copy of the formula in the
 * browser: the price an admin previews here is produced by the same code that
 * prices a real estimate, so the two can never disagree.
 *
 * Unsaved edits on the page are passed through as overrides, so the preview
 * answers "what will this cost once I save?" rather than showing stale figures.
 */
export function PricingPreviewCard({
  scenario,
  onScenarioChange,
  overrides,
  currency,
}: PricingPreviewCardProps) {
  const params: PreviewCostParams = {
    estimatedHours: scenario.estimatedHours,
    platforms: scenario.platforms,
    ...(scenario.hourlyRate ? { hourlyRate: scenario.hourlyRate } : {}),
    ...overrides,
  };

  const { data, isLoading, isError } = useCostPreview(
    params,
    scenario.estimatedHours >= 0,
  );

  const breakdown = data?.breakdown;
  const symbolCurrency = data?.currency ?? currency;

  const togglePlatform = (platform: CostPlatform) => {
    const next = scenario.platforms.includes(platform)
      ? scenario.platforms.filter((item) => item !== platform)
      : [...scenario.platforms, platform];
    onScenarioChange({ platforms: next });
  };

  return (
    <Card hover={false} className="xl:sticky xl:top-24">
      <div className="flex items-center gap-2">
        <div className="asc-gradient-subtle flex h-9 w-9 items-center justify-center rounded-lg text-accent-text">
          <Calculator className="h-4.5 w-4.5" strokeWidth={1.85} />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Pricing Preview
          </h2>
          <p className="text-xs text-muted">Live, using the rules on this page</p>
        </div>
      </div>

      {/*
        Hours is the only effort input. There is no complexity control: the AI
        already reflects complexity in the hours, so the price varies by hours,
        rates, platforms, risk, discount and tax — nothing else.
      */}
      <div className="mt-4">
        <Input
          label="Estimated hours"
          type="number"
          min={0}
          value={scenario.estimatedHours}
          onChange={(event) =>
            onScenarioChange({ estimatedHours: Number(event.target.value) })
          }
        />
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium text-foreground-soft">Platforms</p>
        <div className="flex flex-wrap gap-1.5">
          {COST_PLATFORMS.map((platform) => {
            const isSelected = scenario.platforms.includes(platform);
            return (
              <button
                key={platform}
                type="button"
                onClick={() => togglePlatform(platform)}
                aria-pressed={isSelected}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  isSelected
                    ? "border-accent/40 bg-accent-subtle text-accent-text"
                    : "border-border bg-canvas text-muted hover:border-border-strong hover:text-foreground",
                )}
              >
                {COST_PLATFORM_LABELS[platform]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-3">
        {isError ? (
          <p className="py-4 text-sm text-danger">
            Couldn't calculate a price with these settings.
          </p>
        ) : isLoading || !breakdown ? (
          <div className="flex flex-col gap-3 py-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-5 w-full" />
            ))}
          </div>
        ) : (
          <>
            <Line
              label="Hourly rate"
              hint={
                data.rateBasis === "BLENDED"
                  ? "Blended average of all role rates"
                  : data.rateBasis === "ROLE"
                    ? "From the selected role"
                    : "Manually entered"
              }
              value={formatMoney(breakdown.hourlyRate, symbolCurrency)}
              emphasis="muted"
            />
            <Line
              label="Base cost"
              hint={`${breakdown.estimatedHours} h × rate`}
              value={formatMoney(breakdown.baseCost, symbolCurrency)}
              emphasis="muted"
            />
            <Line
              label="Development cost"
              hint={`× ${breakdown.platformMultiplier} platform`}
              value={formatMoney(breakdown.developmentCost, symbolCurrency)}
            />
            <Line
              label="Risk buffer"
              hint={`${breakdown.riskBufferPercentage}% of development cost`}
              value={formatMoney(breakdown.riskBufferAmount, symbolCurrency)}
            />
            <Line
              label="Subtotal"
              value={formatMoney(breakdown.subtotal, symbolCurrency)}
              emphasis="muted"
            />
            {breakdown.discountAmount > 0 ? (
              <Line
                label="Discount"
                hint={breakdown.discountCapped ? "Capped by the maximum discount" : undefined}
                value={`− ${formatMoney(breakdown.discountAmount, symbolCurrency)}`}
                emphasis="muted"
              />
            ) : null}
            {breakdown.taxAmount > 0 ? (
              <Line
                label="Tax"
                hint={`${breakdown.taxPercentage}%`}
                value={formatMoney(breakdown.taxAmount, symbolCurrency)}
                emphasis="muted"
              />
            ) : null}
            <Line
              label="Final price"
              value={formatMoney(breakdown.finalPrice, symbolCurrency)}
              emphasis="total"
            />

            {data.platforms.length > 1 ? (
              <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.85} />
                Multiple platforms add their premiums together
                (1 + Σ of each multiplier − 1), so more platforms always cost more
                without compounding into an unusable figure.
              </p>
            ) : null}

            {data.unpricedPlatforms.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted">Not priced:</span>
                {data.unpricedPlatforms.map((label) => (
                  <Badge key={label} variant="warning" size="sm">
                    {label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Card>
  );
}
