/**
 * Splits the AI's requirement-summary markdown into editable `##` sections.
 *
 * The stored summary must stay a single markdown string — it is submitted
 * verbatim as the lead's `requirementSummary`. So this parser records character
 * offsets rather than rebuilding the document from parsed parts: editing one
 * section splices only that range, leaving every other byte untouched. A
 * parse → serialise round-trip with no edits returns the identical string.
 */

export type SummarySection = {
  /** Stable within one parse of one source string. */
  id: string;
  /** Heading text without the `##` marker. */
  heading: string;
  /** Markdown between this heading and the next. */
  body: string;
  /** Offset of the `##` heading line itself, so a whole section can be removed. */
  headingStart: number;
  /** Offsets of `body` within the source, for exact splicing. */
  bodyStart: number;
  bodyEnd: number;
};

/**
 * Heading of the managed section that carries the client's free-form "anything
 * else" notes from the Summary step. Owned by the bottom notes box, so it is
 * hidden from the guided section list and kept in sync via upsertNamedSection().
 */
export const ADDITIONAL_NOTES_HEADING = "Additional Notes";

export type ParsedSummary = {
  /** Anything before the first `##` — usually the `#` title and a lead paragraph. */
  intro: string;
  introStart: number;
  introEnd: number;
  sections: SummarySection[];
};

/** `###` and deeper are left inside their parent's body — they are subsections. */
const H2_PATTERN = /^##[ \t]+(.+?)[ \t]*$/gm;

export function parseSummarySections(source: string): ParsedSummary {
  const matches = [...source.matchAll(H2_PATTERN)];

  if (matches.length === 0) {
    return {
      intro: source,
      introStart: 0,
      introEnd: source.length,
      sections: [],
    };
  }

  const firstHeadingIndex = matches[0]!.index;

  const sections: SummarySection[] = matches.map((match, index) => {
    const headingStart = match.index;
    const headingEnd = headingStart + match[0].length;

    // Body begins after the heading line's newline, so the heading itself is
    // never inside the editable range and cannot be accidentally deleted.
    const bodyStart = source[headingEnd] === "\n" ? headingEnd + 1 : headingEnd;
    const bodyEnd = matches[index + 1]?.index ?? source.length;

    return {
      id: `${index}-${match[1]!.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      heading: match[1]!,
      body: source.slice(bodyStart, bodyEnd),
      headingStart,
      bodyStart,
      bodyEnd,
    };
  });

  return {
    intro: source.slice(0, firstHeadingIndex),
    introStart: 0,
    introEnd: firstHeadingIndex,
    sections,
  };
}

/**
 * Replaces one range in the source. Offsets shift after any edit, so callers
 * must re-parse the new string before applying another change — the page does
 * this naturally by deriving sections from store state on each render.
 */
export function spliceRange(
  source: string,
  start: number,
  end: number,
  replacement: string,
): string {
  return source.slice(0, start) + replacement + source.slice(end);
}

/**
 * Normalises an edited body so sections stay visually separated when the
 * document is re-rendered, without disturbing the author's internal blank lines.
 */
export function normalizeSectionBody(body: string): string {
  return `${body.replace(/\s+$/, "")}\n\n`;
}

/**
 * Inserts, replaces, or removes a top-level `## <heading>` section within the
 * single summary string, matched case-insensitively by heading text:
 *
 * - existing section + non-empty body → replace just that section's body
 * - existing section + empty body     → drop the whole section (heading included)
 * - no section + non-empty body        → append a fresh section at the end
 * - no section + empty body            → leave the source untouched
 *
 * Lets the Summary step keep the client's free-form notes inside the same
 * markdown the rest of the pipeline already consumes, without the client having
 * to hand-edit markdown. Idempotent: calling it again with the same body is a
 * no-op, so repeated Continue clicks never stack duplicate sections.
 */
export function upsertNamedSection(source: string, heading: string, body: string): string {
  const normalizedHeading = heading.trim();
  const trimmedBody = body.trim();
  const { sections } = parseSummarySections(source);
  const existing = sections.find(
    (section) => section.heading.trim().toLowerCase() === normalizedHeading.toLowerCase(),
  );

  if (existing) {
    if (trimmedBody.length === 0) {
      const withoutSection = spliceRange(source, existing.headingStart, existing.bodyEnd, "");
      // Collapse the blank lines the removal leaves behind; keep one trailing newline.
      return `${withoutSection.replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "")}\n`;
    }
    return spliceRange(
      source,
      existing.bodyStart,
      existing.bodyEnd,
      normalizeSectionBody(trimmedBody),
    );
  }

  if (trimmedBody.length === 0) {
    return source;
  }

  const base = source.replace(/\s+$/, "");
  const separator = base.length === 0 ? "" : "\n\n";
  return `${base}${separator}## ${normalizedHeading}\n\n${normalizeSectionBody(trimmedBody)}`;
}
