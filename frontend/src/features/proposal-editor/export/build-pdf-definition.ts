import type {
  Content,
  StyleDictionary,
  TDocumentDefinitions,
} from "pdfmake/interfaces";
import type {
  DocBlock,
  ProposalDocument,
} from "@/features/proposal-editor/export/proposal-document.model";

/**
 * Translates the neutral ProposalDocument into a pdfmake document definition.
 *
 * Kept separate from the renderer that loads pdfmake so this stays a pure
 * function — it can be exercised in Node against the same definition the
 * browser uses, with no bundler or font loading involved.
 */

/** Corporate neutral palette — deliberately restrained for a client-facing document. */
const INK = "#1A1230";
const MUTED = "#645585";
const ACCENT = "#4F2BBF";
const RULE = "#E4E0F0";

const styles: StyleDictionary = {
  coverTitle: { fontSize: 30, bold: true, color: INK, lineHeight: 1.2 },
  coverLabel: { fontSize: 9, color: MUTED, characterSpacing: 0.6 },
  coverValue: { fontSize: 12, color: INK, bold: true },
  sectionHeading: { fontSize: 15, bold: true, color: INK },
  sectionNumber: { fontSize: 15, bold: true, color: ACCENT },
  body: { fontSize: 10, color: INK, lineHeight: 1.35 },
  note: { fontSize: 10, color: MUTED, italics: true },
  tableHeader: { fontSize: 9, bold: true, color: INK, characterSpacing: 0.4 },
  tableCell: { fontSize: 9.5, color: INK },
  featureName: { fontSize: 9.5, bold: true, color: INK },
  featureDescription: { fontSize: 9, color: MUTED },
  footer: { fontSize: 8, color: MUTED },
};

function renderBlock(block: DocBlock): Content[] {
  switch (block.kind) {
    case "paragraph":
      return [{ text: block.text, style: "body", margin: [0, 0, 0, 8] }];

    case "note":
      return [{ text: block.text, style: "note", margin: [0, 0, 0, 8] }];

    case "bullets":
      return [
        {
          ul: block.items.map((item) => ({ text: item, style: "body" })),
          margin: [0, 0, 0, 10],
        },
      ];

    case "table":
      return [
        {
          table: {
            headerRows: 1,
            // Feature column takes the remaining width; the three metadata
            // columns are fixed so they never collapse on long feature names.
            widths: ["*", 90, 60, 70],
            body: [
              block.columns.map((column) => ({
                text: column.toUpperCase(),
                style: "tableHeader",
                margin: [0, 5, 0, 5],
              })),
              ...block.rows.map((row) =>
                row.map((cell, index) => {
                  if (index === 0) {
                    const [name, ...rest] = cell.split("\n");
                    return {
                      stack: [
                        { text: name ?? "", style: "featureName" },
                        ...(rest.length > 0
                          ? [
                              {
                                text: rest.join(" "),
                                style: "featureDescription",
                                margin: [0, 2, 0, 0] as [
                                  number,
                                  number,
                                  number,
                                  number,
                                ],
                              },
                            ]
                          : []),
                      ],
                      margin: [0, 5, 0, 5] as [number, number, number, number],
                    };
                  }
                  return {
                    text: cell,
                    style: "tableCell",
                    margin: [0, 5, 0, 5] as [number, number, number, number],
                  };
                }),
              ),
            ],
          },
          // Horizontal rules only: vertical lines make a document look like a
          // spreadsheet rather than a proposal.
          layout: {
            hLineWidth: (i: number) => (i === 0 || i === 1 ? 1 : 0.5),
            vLineWidth: () => 0,
            hLineColor: (i: number) => (i === 1 ? "#C9BDE3" : RULE),
            paddingLeft: () => 0,
            paddingRight: (i: number) => (i === 3 ? 0 : 10),
          },
          margin: [0, 2, 0, 12],
        },
      ];
  }
}

export function buildPdfDefinition(doc: ProposalDocument): TDocumentDefinitions {
  const cover: Content[] = [
    { text: "PROJECT PROPOSAL", style: "coverLabel", margin: [0, 120, 0, 14] },
    { text: doc.cover.projectTitle, style: "coverTitle" },
    {
      canvas: [
        { type: "line", x1: 0, y1: 0, x2: 120, y2: 0, lineWidth: 3, lineColor: ACCENT },
      ],
      margin: [0, 22, 0, 34],
    },
    {
      // Two columns of label/value pairs keeps the cover calm and scannable.
      columns: [
        {
          width: "50%",
          stack: [
            { text: "PREPARED FOR", style: "coverLabel", margin: [0, 0, 0, 4] },
            { text: doc.cover.clientName, style: "coverValue" },
            {
              text: doc.cover.company,
              style: "body",
              margin: [0, 2, 0, 0],
            },
          ],
        },
        {
          width: "50%",
          stack: [
            { text: "PREPARED BY", style: "coverLabel", margin: [0, 0, 0, 4] },
            { text: doc.cover.preparedBy, style: "coverValue" },
            { text: doc.cover.date, style: "body", margin: [0, 2, 0, 0] },
          ],
        },
      ],
    },
    { text: "", pageBreak: "after" },
  ];

  const body: Content[] = doc.sections.flatMap((section, index) => [
    {
      columns: [
        {
          width: 26,
          text: String(index + 1).padStart(2, "0"),
          style: "sectionNumber",
        },
        { width: "*", text: section.heading, style: "sectionHeading" },
      ],
      // Never leave a heading stranded at the foot of a page.
      headlineLevel: 1,
      margin: [0, index === 0 ? 0 : 16, 0, 4],
    },
    {
      canvas: [
        { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: RULE },
      ],
      margin: [0, 0, 0, 10],
    },
    ...section.blocks.flatMap(renderBlock),
  ]);

  return {
    pageSize: "A4",
    pageMargins: [40, 48, 40, 56],
    info: { title: doc.cover.projectTitle, author: doc.cover.preparedBy },
    content: [...cover, ...body],
    styles,
    defaultStyle: { font: "Roboto", fontSize: 10, color: INK },

    // Cover page carries no footer, so numbering starts on the first content
    // page — the usual convention for a client-facing document.
    footer: (currentPage: number, pageCount: number) => {
      if (currentPage === 1) return undefined;
      return {
        margin: [40, 16, 40, 0],
        columns: [
          { text: doc.footerText, style: "footer", width: "*" },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            style: "footer",
            width: "auto",
            alignment: "right",
          },
        ],
      };
    },
  };
}
