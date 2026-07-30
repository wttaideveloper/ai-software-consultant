/**
 * The technology stack as it arrives at the browser.
 *
 * Deliberately a *shape* mirror only — no catalogue, no category rules, no
 * canonical names. Deciding what belongs in a stack and where each technology
 * sits is the backend engine's job (`modules/tech-stack`), and duplicating any
 * of that here is how the two would drift into disagreeing about the same
 * project. The browser's only responsibility is rendering whatever it is given.
 */

export type TechStackGroup = {
  category: string;
  label: string;
  items: string[];
};

/**
 * Anything the system has ever stored or sent for a technology stack.
 *
 * Three shapes are live at once and all three must render: the grouped structure
 * the API returns today, the flat `string[]` frozen into leads and proposal
 * versions before the engine shipped, and `null` for a stack that was never
 * generated.
 */
export type TechStackValue = TechStackGroup[] | string[] | null | undefined;

/**
 * A legacy flat list has no category of its own, so it gets no label.
 *
 * Empty rather than "Technology Stack": every surface already titles the section
 * that, and stamping the same words on the single group inside it rendered the
 * heading twice. Consumers render a label only when there is one.
 */
const LEGACY_GROUP_LABEL = "";

function isGroup(value: unknown): value is { category?: unknown; label?: unknown; items: unknown } {
  return typeof value === "object" && value !== null && "items" in value;
}

/**
 * Coerces any stored or received stack into groups for rendering.
 *
 * A legacy flat list becomes a single unlabelled group rather than being
 * re-categorised: guessing categories in the browser would mean shipping a
 * second, weaker copy of the engine's catalogue, and an old proposal would then
 * render differently from the document that was actually sent to the client.
 * Showing it exactly as it was saved is the honest outcome.
 *
 * Never throws — a malformed stack yields an empty list, because a technology
 * list is descriptive and must never take down the estimate around it.
 */
export function toTechStackGroups(value: TechStackValue): TechStackGroup[] {
  if (!Array.isArray(value)) return [];

  const legacyItems: string[] = [];
  const groups: TechStackGroup[] = [];

  for (const entry of value) {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (name.length > 0) legacyItems.push(name);
      continue;
    }

    if (!isGroup(entry)) continue;

    const items = Array.isArray(entry.items)
      ? entry.items.filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : [];

    // Categories that ended up empty are dropped, not rendered as a bare heading.
    if (items.length === 0) continue;

    groups.push({
      category: typeof entry.category === "string" ? entry.category : "OTHER",
      label:
        typeof entry.label === "string" && entry.label.trim().length > 0
          ? entry.label
          : LEGACY_GROUP_LABEL,
      items,
    });
  }

  if (legacyItems.length > 0) {
    groups.push({
      category: "OTHER",
      label: LEGACY_GROUP_LABEL,
      items: legacyItems,
    });
  }

  return groups;
}

/**
 * The flat list, for the two places that need one: the concept-mockup prompt
 * (which sends the stack to an AI as a single line) and any legacy consumer.
 */
export function flattenTechStack(value: TechStackValue): string[] {
  return toTechStackGroups(value).flatMap((group) => group.items);
}

export function hasTechStack(value: TechStackValue): boolean {
  return toTechStackGroups(value).length > 0;
}

/**
 * True when the stack is a legacy flat list — one group carrying no category.
 *
 * Callers use this to drop the per-group chrome (a card, a heading) that only
 * makes sense once there is more than one category to tell apart.
 */
export function isUngroupedTechStack(groups: TechStackGroup[]): boolean {
  return groups.length === 1 && groups[0]!.label.length === 0;
}
