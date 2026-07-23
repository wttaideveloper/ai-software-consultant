import {
  Coins,
  Gauge,
  Landmark,
  Layers,
  Percent,
  ShieldAlert,
} from "lucide-react";
import { WorkspaceSection } from "@/components/shared/workspace-section";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  COST_COMPLEXITY_HINTS,
  COST_COMPLEXITY_LABELS,
  COST_CURRENCY_LABELS,
  COST_DISCOUNT_TYPE_LABELS,
  COST_PLATFORM_LABELS,
  COST_ROLE_LABELS,
  COST_TAX_TYPE_LABELS,
} from "@/features/cost-settings/cost-settings.labels";
import {
  COST_CURRENCIES,
  COST_DISCOUNT_TYPES,
  COST_TAX_TYPES,
  type ComplexityMultiplier,
  type CostCurrency,
  type CostDiscountType,
  type CostSettings,
  type CostTaxType,
  type HourlyRate,
  type PlatformMultiplier,
} from "@/types";

/**
 * The editable rate-card sections.
 *
 * Validation messages mirror the server's rules (rate > 0, multiplier >= 1,
 * percentages 0–100) so an invalid value is caught before Save rather than
 * bouncing back as a 400 — the server still enforces them regardless.
 */

const rateError = (value: number) =>
  Number.isFinite(value) && value > 0 ? undefined : "Must be greater than 0";

const multiplierError = (value: number) =>
  Number.isFinite(value) && value >= 1 ? undefined : "Must be 1 or more";

const percentError = (value: number) =>
  Number.isFinite(value) && value >= 0 && value <= 100
    ? undefined
    : "Must be between 0 and 100";

export function HourlyRatesSection({
  rates,
  currencySymbol,
  onChange,
}: {
  rates: HourlyRate[];
  currencySymbol: string;
  onChange: (next: HourlyRate[]) => void;
}) {
  return (
    <WorkspaceSection
      id="hourly-rates"
      icon={Coins}
      title="Hourly Rates"
      description="What each delivery role costs per hour"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rates.map((rate) => (
          <Input
            key={rate.role}
            label={COST_ROLE_LABELS[rate.role]}
            type="number"
            min={0}
            step={50}
            hint={`${currencySymbol} per hour`}
            error={rateError(rate.hourlyRate)}
            value={rate.hourlyRate}
            onChange={(event) =>
              onChange(
                rates.map((item) =>
                  item.role === rate.role
                    ? { ...item, hourlyRate: Number(event.target.value) }
                    : item,
                ),
              )
            }
          />
        ))}
      </div>
    </WorkspaceSection>
  );
}

export function ComplexityMultipliersSection({
  multipliers,
  onChange,
}: {
  multipliers: ComplexityMultiplier[];
  onChange: (next: ComplexityMultiplier[]) => void;
}) {
  return (
    <WorkspaceSection
      id="complexity"
      icon={Gauge}
      title="Complexity Multipliers"
      description="How much harder work costs, by tier"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {multipliers.map((item) => (
          <Input
            key={item.level}
            label={COST_COMPLEXITY_LABELS[item.level]}
            type="number"
            min={1}
            step={0.1}
            hint={COST_COMPLEXITY_HINTS[item.level]}
            error={multiplierError(item.multiplier)}
            value={item.multiplier}
            onChange={(event) =>
              onChange(
                multipliers.map((row) =>
                  row.level === item.level
                    ? { ...row, multiplier: Number(event.target.value) }
                    : row,
                ),
              )
            }
          />
        ))}
      </div>
    </WorkspaceSection>
  );
}

export function PlatformMultipliersSection({
  multipliers,
  onChange,
}: {
  multipliers: PlatformMultiplier[];
  onChange: (next: PlatformMultiplier[]) => void;
}) {
  return (
    <WorkspaceSection
      id="platforms"
      icon={Layers}
      title="Platform Multipliers"
      description="Premium per target platform. 1.0 means no premium."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {multipliers.map((item) => (
          <Input
            key={item.platform}
            label={COST_PLATFORM_LABELS[item.platform]}
            type="number"
            min={1}
            step={0.1}
            error={multiplierError(item.multiplier)}
            value={item.multiplier}
            onChange={(event) =>
              onChange(
                multipliers.map((row) =>
                  row.platform === item.platform
                    ? { ...row, multiplier: Number(event.target.value) }
                    : row,
                ),
              )
            }
          />
        ))}
      </div>
    </WorkspaceSection>
  );
}

type SettingsPatch = (next: Partial<CostSettings>) => void;

export function RiskAndCurrencySection({
  settings,
  onChange,
}: {
  settings: CostSettings;
  onChange: SettingsPatch;
}) {
  return (
    <WorkspaceSection
      id="risk-currency"
      icon={ShieldAlert}
      title="Risk Buffer & Currency"
      description="Applied to every estimate automatically"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Risk buffer"
          type="number"
          min={0}
          max={100}
          step={1}
          hint="Percentage added to development cost"
          error={percentError(settings.riskBufferPercentage)}
          value={settings.riskBufferPercentage}
          onChange={(event) =>
            onChange({ riskBufferPercentage: Number(event.target.value) })
          }
        />
        <Select
          label="Currency"
          value={settings.defaultCurrency}
          onChange={(event) =>
            onChange({ defaultCurrency: event.target.value as CostCurrency })
          }
          hint="The symbol is stored alongside the code"
          options={COST_CURRENCIES.map((currency) => ({
            label: COST_CURRENCY_LABELS[currency],
            value: currency,
          }))}
        />
      </div>
    </WorkspaceSection>
  );
}

export function TaxSection({
  settings,
  onChange,
}: {
  settings: CostSettings;
  onChange: SettingsPatch;
}) {
  return (
    <WorkspaceSection
      id="tax"
      icon={Landmark}
      title="Tax Settings"
      description="Charged on the discounted subtotal"
    >
      <div className="flex flex-col gap-4">
        <Checkbox
          label="Apply tax to quoted prices"
          checked={settings.taxEnabled}
          onChange={(event) => onChange({ taxEnabled: event.target.checked })}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tax type"
            value={settings.taxType}
            onChange={(event) =>
              onChange({ taxType: event.target.value as CostTaxType })
            }
            options={COST_TAX_TYPES.map((type) => ({
              label: COST_TAX_TYPE_LABELS[type],
              value: type,
            }))}
          />
          <Input
            label="Tax percentage"
            type="number"
            min={0}
            max={100}
            step={0.5}
            error={percentError(settings.taxPercentage)}
            value={settings.taxPercentage}
            onChange={(event) =>
              onChange({ taxPercentage: Number(event.target.value) })
            }
          />
        </div>
      </div>
    </WorkspaceSection>
  );
}

export function DiscountSection({
  settings,
  currencySymbol,
  onChange,
}: {
  settings: CostSettings;
  currencySymbol: string;
  onChange: SettingsPatch;
}) {
  const isPercentage = settings.discountType === "PERCENTAGE";

  return (
    <WorkspaceSection
      id="discounts"
      icon={Percent}
      title="Discount Rules"
      description="The default discount and the ceiling no quote may exceed"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Discount type"
          value={settings.discountType}
          onChange={(event) =>
            onChange({ discountType: event.target.value as CostDiscountType })
          }
          options={COST_DISCOUNT_TYPES.map((type) => ({
            label: COST_DISCOUNT_TYPE_LABELS[type],
            value: type,
          }))}
        />
        <Input
          label="Default discount"
          type="number"
          min={0}
          max={isPercentage ? 100 : undefined}
          step={isPercentage ? 1 : 100}
          hint={isPercentage ? "% of subtotal" : `${currencySymbol} off the subtotal`}
          error={
            isPercentage
              ? percentError(settings.discountValue)
              : settings.discountValue >= 0
                ? undefined
                : "Cannot be negative"
          }
          value={settings.discountValue}
          onChange={(event) =>
            onChange({ discountValue: Number(event.target.value) })
          }
        />
        <Input
          label="Maximum discount"
          type="number"
          min={0}
          max={100}
          step={1}
          hint="% ceiling — a fixed discount is capped by it too"
          error={percentError(settings.maxDiscountPercentage)}
          value={settings.maxDiscountPercentage}
          onChange={(event) =>
            onChange({ maxDiscountPercentage: Number(event.target.value) })
          }
        />
      </div>
    </WorkspaceSection>
  );
}
