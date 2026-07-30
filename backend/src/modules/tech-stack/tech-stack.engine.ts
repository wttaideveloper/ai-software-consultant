import type { CostPlatform } from "../cost/cost.constants.js";
import {
  CAPABILITY_KEYWORDS,
  CAPABILITY_TECHNOLOGIES,
  CATEGORY_FALLBACK_KEYWORDS,
  CONDITIONAL_TECHNOLOGIES,
  CORE_TECHNOLOGIES,
  INDUSTRY_KEYWORDS,
  INDUSTRY_TECHNOLOGIES,
  PLATFORM_TECHNOLOGIES,
  PROJECT_SIZE_HOUR_THRESHOLDS,
  PROJECT_SIZE_TECHNOLOGIES,
  TECH_CATEGORY_OVERRIDES,
  TECH_NAME_ALIASES,
  TECH_PLATFORM_ALIASES,
  TECH_STACK_CATEGORY_LABELS,
  TECH_STACK_CATEGORY_ORDER,
  TECH_STACK_LIMITS,
  type CategoryTechnologies,
} from "./tech-stack.constants.js";
import {
  PROJECT_SIZES,
  TECH_CAPABILITIES,
  TECH_INDUSTRIES,
  TECH_STACK_CATEGORIES,
  type ProjectSize,
  type TechCapability,
  type TechIndustry,
  type TechStack,
  type TechStackAnalysis,
  type TechStackCategory,
  type TechStackContext,
  type TechStackGroup,
  type TechStackRecommendation,
} from "./tech-stack.types.js";

/**
 * The technology recommendation engine.
 *
 * Pure and dependency-free — no database, no AI, no clock — for the same reason
 * cost.engine.ts is: the baseline a client is shown, the baseline a proposal
 * freezes and the baseline a prompt is built from are then provably the same
 * calculation, and the whole thing is testable by calling one function.
 *
 * The division of labour is the point of the module:
 *
 *   deterministic baseline  →  what the project MUST include, from its platforms,
 *                              capabilities, industry and size
 *   AI enrichment           →  extra technologies the model suggests
 *
 * The merge is one-directional: the AI can only ever add. It cannot remove,
 * reorder or replace a baseline technology, so a selected platform can never be
 * dropped by a model having an off day.
 */

const CATEGORY_SET = new Set<string>(TECH_STACK_CATEGORY_ORDER);

/** Lowercased, punctuation-flattened form used for keyword matching. */
function toHaystack(...parts: Array<string | null | undefined>): string {
  return parts
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Whole-word match, so "ai" hits "AI-powered assistant" but not "Chennai" and
 * "map" does not fire on "roadmap". Substring matching was tried first and
 * produced exactly those false positives.
 */
function containsKeyword(haystack: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRegExp(keyword)}\\b`).test(haystack);
}

function containsAnyKeyword(haystack: string, keywords: string[]): boolean {
  return keywords.some((keyword) => containsKeyword(haystack, keyword));
}

/** Canonical display name for a technology, so "react"/"ReactJS" collapse to one. */
export function normalizeTechnologyName(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (trimmed.length === 0) return "";

  const lookupKey = trimmed.toLowerCase().replace(/\s+/g, " ");
  return TECH_NAME_ALIASES[lookupKey] ?? trimmed;
}

/** Dedupe key — canonical names compared case- and punctuation-insensitively. */
function technologyKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Index of every technology the catalogue recommends → the category it belongs
 * to. Built once from the mapping tables themselves rather than restated, so a
 * technology can never be recommended under one category and re-categorised
 * under another when the AI happens to name it too.
 */
const CATALOGUE_CATEGORY_INDEX: Map<string, TechStackCategory> = (() => {
  const index = new Map<string, TechStackCategory>();

  const register = (bundle: CategoryTechnologies) => {
    for (const [category, items] of Object.entries(bundle)) {
      for (const item of items ?? []) {
        const key = technologyKey(normalizeTechnologyName(item));
        if (!index.has(key)) {
          index.set(key, category as TechStackCategory);
        }
      }
    }
  };

  register(CORE_TECHNOLOGIES);
  Object.values(PLATFORM_TECHNOLOGIES).forEach(register);
  Object.values(CAPABILITY_TECHNOLOGIES).forEach(register);
  Object.values(INDUSTRY_TECHNOLOGIES).forEach(register);
  Object.values(PROJECT_SIZE_TECHNOLOGIES).forEach(register);
  CONDITIONAL_TECHNOLOGIES.forEach((rule) => register(rule.technologies));

  for (const [name, category] of Object.entries(TECH_CATEGORY_OVERRIDES)) {
    index.set(technologyKey(normalizeTechnologyName(name)), category);
  }

  return index;
})();

/**
 * Where a technology belongs. Catalogue first, then the explicit overrides
 * (already folded into the index), then a keyword guess — anything still
 * unplaced goes to "Other" rather than being silently dropped.
 */
export function categorizeTechnology(name: string): TechStackCategory {
  const canonical = normalizeTechnologyName(name);
  const known = CATALOGUE_CATEGORY_INDEX.get(technologyKey(canonical));
  if (known) return known;

  const haystack = toHaystack(canonical);
  for (const { category, keywords } of CATEGORY_FALLBACK_KEYWORDS) {
    if (containsAnyKeyword(haystack, keywords)) {
      return category;
    }
  }

  return TECH_STACK_CATEGORIES.OTHER;
}

// ── project analysis ─────────────────────────────────────────────────────

function featuresToText(context: TechStackContext): string {
  return (context.features ?? [])
    .map((feature) =>
      [feature.name, feature.category, feature.description]
        .filter((part): part is string => Boolean(part))
        .join(" "),
    )
    .join(" ");
}

/** Everything the project says about itself, as one searchable blob. */
function buildContextHaystack(context: TechStackContext): string {
  return toHaystack(
    context.projectIdea,
    context.requirementSummary,
    featuresToText(context),
    context.industry,
    context.projectType,
  );
}

/**
 * Resolves the platforms a project targets.
 *
 * Explicit labels win — a client that ticked "iOS App" has said so and nothing
 * should second-guess it. Text detection then covers the flows that have no
 * platform picker at all (an admin consultation only has a project type), which
 * is what makes "every selected platform reaches the AI" true everywhere rather
 * than only in the Client Portal.
 */
export function detectPlatforms(context: TechStackContext): CostPlatform[] {
  const resolved: CostPlatform[] = [];

  const add = (platform: CostPlatform) => {
    if (!resolved.includes(platform)) resolved.push(platform);
  };

  for (const label of context.platformLabels ?? []) {
    const key = TECH_PLATFORM_ALIASES[label.trim().toLowerCase()];
    if (key) add(key);
  }

  const haystack = buildContextHaystack(context);
  for (const [label, platform] of Object.entries(TECH_PLATFORM_ALIASES)) {
    // Single-word aliases like "ai" or "admin" are far too eager against a long
    // requirement summary; only multi-word or unambiguous labels are inferred.
    if (label.length < 4) continue;
    if (containsKeyword(haystack, label)) add(platform);
  }

  return resolved;
}

export function detectCapabilities(context: TechStackContext): TechCapability[] {
  const haystack = buildContextHaystack(context);

  return Object.values(TECH_CAPABILITIES).filter((capability) =>
    containsAnyKeyword(haystack, CAPABILITY_KEYWORDS[capability]),
  );
}

/**
 * The single best-matching industry, by keyword hit count.
 *
 * One industry, not several: domain technologies are opinionated (FHIR, PCI DSS)
 * and stacking three industries' worth of them onto one proposal would read as
 * noise rather than expertise. An explicit industry field is weighted heavily so
 * an admin's own classification is not outvoted by incidental words in the text.
 */
export function detectIndustry(context: TechStackContext): TechIndustry | null {
  const explicit = toHaystack(context.industry, context.projectType);
  const inferred = toHaystack(
    context.projectIdea,
    context.requirementSummary,
    featuresToText(context),
  );

  let best: { industry: TechIndustry; score: number } | null = null;

  for (const industry of Object.values(TECH_INDUSTRIES)) {
    const keywords = INDUSTRY_KEYWORDS[industry];
    let score = 0;

    for (const keyword of keywords) {
      if (explicit.length > 0 && containsKeyword(explicit, keyword)) score += 10;
      if (containsKeyword(inferred, keyword)) score += 1;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { industry, score };
    }
  }

  return best?.industry ?? null;
}

export function resolveProjectSize(context: TechStackContext): ProjectSize {
  const hours = context.estimatedHours ?? null;

  if (hours !== null && Number.isFinite(hours)) {
    for (const { size, maxHours } of PROJECT_SIZE_HOUR_THRESHOLDS) {
      if (hours <= maxHours) return size;
    }
    return PROJECT_SIZES.LARGE;
  }

  // No effort figure yet (the baseline can be built before estimation runs) —
  // fall back to the AI's complexity signal.
  if (context.complexity === "HIGH") return PROJECT_SIZES.LARGE;
  if (context.complexity === "LOW") return PROJECT_SIZES.SMALL;
  return PROJECT_SIZES.MEDIUM;
}

export function analyzeProject(context: TechStackContext): TechStackAnalysis {
  return {
    platforms: detectPlatforms(context),
    capabilities: detectCapabilities(context),
    industry: detectIndustry(context),
    projectSize: resolveProjectSize(context),
  };
}

// ── baseline construction ────────────────────────────────────────────────

/** Accumulates technologies per category, preserving insertion order. */
class StackBuilder {
  private readonly groups = new Map<TechStackCategory, string[]>();

  add(category: TechStackCategory, technology: string): void {
    const canonical = normalizeTechnologyName(technology);
    if (canonical.length === 0) return;

    const existing = this.groups.get(category) ?? [];
    const key = technologyKey(canonical);

    if (!existing.some((item) => technologyKey(item) === key)) {
      existing.push(canonical);
      this.groups.set(category, existing);
    }
  }

  addBundle(bundle: CategoryTechnologies | undefined): void {
    if (!bundle) return;

    for (const [category, items] of Object.entries(bundle)) {
      for (const item of items ?? []) {
        this.add(category as TechStackCategory, item);
      }
    }
  }

  /**
   * Materialises the groups in presentation order, dropping a technology that
   * already appeared in an earlier category — "never contains duplicates" reads
   * across the whole stack, not just within one group, so TypeScript listed
   * under Frontend must not reappear under Backend.
   */
  build(): TechStack {
    const seen = new Set<string>();
    const stack: TechStack = [];

    for (const category of TECH_STACK_CATEGORY_ORDER) {
      const items = (this.groups.get(category) ?? []).filter((item) => {
        const key = technologyKey(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (items.length > 0) {
        stack.push({
          category,
          label: TECH_STACK_CATEGORY_LABELS[category],
          items,
        });
      }
    }

    return stack;
  }
}

/**
 * The guaranteed technologies for a project — the whole point of Phase 2.
 *
 * Built only from what the project actually is, with no AI involved, so the same
 * inputs always produce the same stack and every selected platform is present by
 * construction.
 */
export function buildBaselineTechStack(context: TechStackContext): TechStack {
  return buildBaselineFromAnalysis(analyzeProject(context));
}

export function buildBaselineFromAnalysis(analysis: TechStackAnalysis): TechStack {
  const builder = new StackBuilder();

  builder.addBundle(CORE_TECHNOLOGIES);

  for (const platform of analysis.platforms) {
    builder.addBundle(PLATFORM_TECHNOLOGIES[platform]);
  }

  for (const capability of analysis.capabilities) {
    builder.addBundle(CAPABILITY_TECHNOLOGIES[capability]);
  }

  if (analysis.industry) {
    builder.addBundle(INDUSTRY_TECHNOLOGIES[analysis.industry]);
  }

  for (const rule of CONDITIONAL_TECHNOLOGIES) {
    const platformMatch =
      !rule.platforms || rule.platforms.some((p) => analysis.platforms.includes(p));
    const capabilityMatch =
      !rule.capabilities || rule.capabilities.some((c) => analysis.capabilities.includes(c));
    const industryMatch =
      !rule.industries || (analysis.industry !== null && rule.industries.includes(analysis.industry));

    if (platformMatch && capabilityMatch && industryMatch) {
      builder.addBundle(rule.technologies);
    }
  }

  builder.addBundle(PROJECT_SIZE_TECHNOLOGIES[analysis.projectSize]);

  return builder.build();
}

// ── normalisation & merging ──────────────────────────────────────────────

type LooseTechnology = { name: string; category: TechStackCategory | null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads a technology stack out of anything the system has ever produced.
 *
 * Three shapes reach this function and all three must work: the legacy flat
 * `string[]` stored on older leads and proposal versions, the grouped structure,
 * and whatever loosely-typed JSON an AI returns. Anything unreadable degrades to
 * an empty list rather than throwing — a malformed stack must never break an
 * estimate.
 */
function readLooseTechnologies(value: unknown): LooseTechnology[] {
  if (!Array.isArray(value)) return [];

  const result: LooseTechnology[] = [];

  for (const entry of value) {
    // Legacy flat form: ["React.js", "Node.js", …]
    if (typeof entry === "string") {
      const name = normalizeTechnologyName(entry);
      if (name.length > 0 && name.length <= TECH_STACK_LIMITS.MAX_ITEM_LENGTH) {
        result.push({ name, category: null });
      }
      continue;
    }

    if (!isRecord(entry)) continue;

    // Grouped form: [{ category, label, items: [...] }]
    if (Array.isArray(entry.items)) {
      const rawCategory = typeof entry.category === "string" ? entry.category.toUpperCase() : "";
      const category = CATEGORY_SET.has(rawCategory)
        ? (rawCategory as TechStackCategory)
        : null;

      for (const item of entry.items) {
        if (typeof item !== "string") continue;
        const name = normalizeTechnologyName(item);
        if (name.length > 0 && name.length <= TECH_STACK_LIMITS.MAX_ITEM_LENGTH) {
          result.push({ name, category });
        }
      }
      continue;
    }

    // Tolerated single-technology object, e.g. { name, category } — some models
    // answer this way even when asked for the grouped shape.
    if (typeof entry.name === "string") {
      const rawCategory = typeof entry.category === "string" ? entry.category.toUpperCase() : "";
      const name = normalizeTechnologyName(entry.name);
      if (name.length > 0 && name.length <= TECH_STACK_LIMITS.MAX_ITEM_LENGTH) {
        result.push({
          name,
          category: CATEGORY_SET.has(rawCategory) ? (rawCategory as TechStackCategory) : null,
        });
      }
    }
  }

  return result;
}

/**
 * Merges AI suggestions into the deterministic baseline.
 *
 * Additive only. Every baseline technology survives in its original position;
 * AI additions are normalised, categorised, deduplicated against the baseline
 * and each other, then appended within their category and sorted alphabetically
 * so the enriched part of a group reads consistently.
 *
 * The limits apply to AI additions exclusively — a model that returns forty
 * technologies gets trimmed, and the guaranteed baseline never does.
 */
export function mergeTechStack(baseline: TechStack, aiValue: unknown): TechStack {
  const groups = new Map<TechStackCategory, { baseline: string[]; added: string[] }>();
  const seen = new Set<string>();
  let total = 0;

  for (const group of baseline) {
    const items = group.items.filter((item) => {
      const key = technologyKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (items.length > 0) {
      groups.set(group.category, { baseline: items, added: [] });
      total += items.length;
    }
  }

  for (const suggestion of readLooseTechnologies(aiValue)) {
    if (total >= TECH_STACK_LIMITS.MAX_TOTAL_ITEMS) break;

    const key = technologyKey(suggestion.name);
    if (seen.has(key)) continue;

    const category = suggestion.category ?? categorizeTechnology(suggestion.name);
    const group = groups.get(category) ?? { baseline: [], added: [] };

    if (group.baseline.length + group.added.length >= TECH_STACK_LIMITS.MAX_ITEMS_PER_GROUP) {
      continue;
    }

    group.added.push(suggestion.name);
    groups.set(category, group);
    seen.add(key);
    total += 1;
  }

  const merged: TechStack = [];

  for (const category of TECH_STACK_CATEGORY_ORDER) {
    const group = groups.get(category);
    if (!group) continue;

    const items = [...group.baseline, ...group.added.sort((a, b) => a.localeCompare(b))];
    if (items.length === 0) continue;

    merged.push({
      category,
      label: TECH_STACK_CATEGORY_LABELS[category],
      items,
    });
  }

  return merged;
}

/**
 * Turns any stored or received value into the grouped structure — the API
 * boundary normaliser that makes historical records render like new ones.
 *
 * A legacy flat `string[]` is categorised item by item, so a lead saved months
 * ago as ["React.js","Stripe"] comes back as Frontend / Payments without a
 * migration or a backfill.
 */
export function normalizeTechStack(value: unknown): TechStack {
  return mergeTechStack([], value);
}

/** The flat list, kept for the legacy `techStack: string[]` fields and prompts. */
export function flattenTechStack(stack: TechStack): string[] {
  return stack.flatMap((group) => group.items);
}

/** Human-readable one-liner per group — how the stack is fed back into a prompt. */
export function describeTechStack(stack: TechStack): string {
  if (stack.length === 0) return "Not specified";

  return stack
    .map((group) => `${group.label}: ${group.items.join(", ")}`)
    .join("; ");
}

/**
 * The enrichment contract handed to the AI, as one sentence-block for the
 * ESTIMATION prompt's `{{techStackBaseline}}` slot.
 *
 * This is the whole reason the model stopped inventing stacks from nothing. It
 * states the baseline as already decided and asks only for what is missing, so a
 * technology the client explicitly selected can never be argued away, and the
 * model's remaining job — spotting the domain-specific service the catalogue
 * does not know about — is the one it is actually good at.
 *
 * The prohibitions are written out individually because each one corresponds to
 * a failure that was observed: repeating a baseline entry, returning an alias of
 * one ("React" beside "React.js"), proposing a competing product for a slot that
 * is already filled, and padding the list with fashionable tooling the
 * requirements never asked for.
 *
 * Returns "" when there is no baseline, which leaves the surrounding prompt
 * reading as a plain instruction to recommend technologies — the pre-existing
 * behaviour, so a caller that supplies no context degrades instead of emitting a
 * dangling reference to a list that is not there.
 */
export function buildEnrichmentDirective(baseline: TechStack): string {
  if (baseline.length === 0) return "";

  return [
    "A deterministic technology baseline has ALREADY been selected for this project from its platforms, features, industry and size, and it is final.",
    `BASELINE — ${describeTechStack(baseline)}.`,
    "In `techStack` return ONLY technologies that this project genuinely needs and the baseline does not already cover.",
    "Never repeat a baseline entry or a differently-spelled variant of one (if the baseline lists React.js, do not return React).",
    "Never propose a competing alternative to something the baseline already provides (it already has a database, a payment provider and a hosting platform — do not offer substitutes for them).",
    "Never add a technology that the stated requirements do not actually call for; a shorter, justified list is always better than a longer, speculative one.",
    "Return an empty array if the baseline is already complete for this project.",
  ].join(" ");
}

/**
 * The whole Phase 2 pipeline in one call: analyse the project, build the
 * guaranteed baseline, then let the AI's suggestions enrich it.
 */
export function buildTechStackRecommendation(
  context: TechStackContext,
  aiValue?: unknown,
): TechStackRecommendation {
  const analysis = analyzeProject(context);
  const baseline = buildBaselineFromAnalysis(analysis);

  return {
    ...analysis,
    stack: aiValue === undefined ? baseline : mergeTechStack(baseline, aiValue),
  };
}

/** Category labels for a group that arrived without one (older snapshots). */
export function resolveCategoryLabel(category: TechStackCategory): string {
  return TECH_STACK_CATEGORY_LABELS[category] ?? TECH_STACK_CATEGORY_LABELS.OTHER;
}

export type { TechStackGroup };
