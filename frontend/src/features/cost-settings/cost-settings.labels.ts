import type {
  CostComplexityLevel,
  CostCurrency,
  CostDiscountType,
  CostPlatform,
  CostRole,
  CostTaxType,
} from "@/types";

/**
 * Display names for the pricing enums — the single place a stored key becomes
 * something a human reads, so no component invents its own wording.
 */
export const COST_ROLE_LABELS: Record<CostRole, string> = {
  FRONTEND: "Frontend Development",
  BACKEND: "Backend Development",
  UI_UX_DESIGN: "UI/UX Design",
  QA_TESTING: "QA Testing",
  DEVOPS: "DevOps",
  PROJECT_MANAGEMENT: "Project Management",
  AI_DEVELOPMENT: "AI Development",
};

/**
 * Display names for the complexity tier reported on an estimate.
 *
 * Informational only — complexity does not affect price. The per-tier pricing
 * hints that used to sit beside this were removed with the multipliers, since
 * they described a pricing effect that no longer exists.
 */
export const COST_COMPLEXITY_LABELS: Record<CostComplexityLevel, string> = {
  SIMPLE: "Simple",
  MEDIUM: "Medium",
  COMPLEX: "Complex",
  ENTERPRISE: "Enterprise",
};

export const COST_PLATFORM_LABELS: Record<CostPlatform, string> = {
  WEB: "Web",
  ANDROID: "Android",
  IOS: "iOS",
  DESKTOP: "Desktop",
  ADMIN_PANEL: "Admin Panel",
  API: "API",
  AI_INTEGRATION: "AI Integration",
};

export const COST_CURRENCY_LABELS: Record<CostCurrency, string> = {
  INR: "Indian Rupee (₹)",
  USD: "US Dollar ($)",
  EUR: "Euro (€)",
  GBP: "British Pound (£)",
};

export const COST_TAX_TYPE_LABELS: Record<CostTaxType, string> = {
  GST: "GST",
  VAT: "VAT",
  SERVICE_TAX: "Service Tax",
};

export const COST_DISCOUNT_TYPE_LABELS: Record<CostDiscountType, string> = {
  PERCENTAGE: "Percentage of subtotal",
  FIXED: "Fixed amount",
};

/**
 * Formats money for display.
 *
 * Uses the locale that matches the currency (en-IN groups as 6,86,400 — the
 * lakh/crore convention the spec's examples use), falling back to en-US.
 */
export function formatMoney(amount: number, currency: string): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
