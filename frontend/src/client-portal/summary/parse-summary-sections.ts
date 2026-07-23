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
  /** Offsets of `body` within the source, for exact splicing. */
  bodyStart: number;
  bodyEnd: number;
};

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
