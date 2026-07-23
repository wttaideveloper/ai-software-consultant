import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  PageBreak,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type {
  DocBlock,
  ProposalDocument,
} from "@/features/proposal-editor/export/proposal-document.model";

/**
 * Builds the .docx equivalent of the same ProposalDocument the PDF renderer
 * consumes — same sections, same order, same numbering.
 *
 * Uses real Word constructs (HeadingLevel, native bullets, Table, footer field
 * codes for page numbers) rather than hand-formatted text, so the result stays
 * editable and re-flowable in Word instead of arriving as flat styled text.
 */

const INK = "1A1230";
const MUTED = "645585";
const ACCENT = "4F2BBF";
const RULE = "E4E0F0";

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "auto" } as const;

function paragraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: INK })],
    spacing: { after: 140, line: 276 },
  });
}

function noteParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: MUTED, italics: true })],
    spacing: { after: 140 },
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: INK })],
    // Word's built-in list style keeps the bullets native and re-orderable.
    bullet: { level: 0 },
    spacing: { after: 80, line: 276 },
  });
}

function headerCell(label: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: label.toUpperCase(),
            bold: true,
            size: 18,
            color: INK,
          }),
        ],
        spacing: { before: 80, after: 80 },
      }),
    ],
    borders: {
      top: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "C9BDE3" },
    },
  });
}

function bodyCell(children: Paragraph[]): TableCell {
  return new TableCell({
    children,
    borders: {
      top: NO_BORDER,
      left: NO_BORDER,
      right: NO_BORDER,
      bottom: { style: BorderStyle.SINGLE, size: 2, color: RULE },
    },
  });
}

function renderBlock(block: DocBlock): (Paragraph | Table)[] {
  switch (block.kind) {
    case "paragraph":
      return [paragraph(block.text)];

    case "note":
      return [noteParagraph(block.text)];

    case "bullets":
      return block.items.map(bulletParagraph);

    case "table":
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [4600, 1700, 1200, 1400],
          rows: [
            new TableRow({
              tableHeader: true,
              children: block.columns.map(headerCell),
            }),
            ...block.rows.map(
              (row) =>
                new TableRow({
                  children: row.map((cell, index) => {
                    if (index === 0) {
                      const [name, ...rest] = cell.split("\n");
                      return bodyCell([
                        new Paragraph({
                          children: [
                            new TextRun({
                              text: name ?? "",
                              bold: true,
                              size: 19,
                              color: INK,
                            }),
                          ],
                          spacing: { before: 80, after: rest.length > 0 ? 20 : 80 },
                        }),
                        ...(rest.length > 0
                          ? [
                              new Paragraph({
                                children: [
                                  new TextRun({
                                    text: rest.join(" "),
                                    size: 18,
                                    color: MUTED,
                                  }),
                                ],
                                spacing: { after: 80 },
                              }),
                            ]
                          : []),
                      ]);
                    }

                    return bodyCell([
                      new Paragraph({
                        children: [
                          new TextRun({ text: cell, size: 19, color: INK }),
                        ],
                        spacing: { before: 80, after: 80 },
                      }),
                    ]);
                  }),
                }),
            ),
          ],
        }),
        // Word collapses consecutive tables without a separating paragraph.
        new Paragraph({ text: "", spacing: { after: 160 } }),
      ];
  }
}

export function buildDocxDocument(doc: ProposalDocument): Document {
  const cover: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: "PROJECT PROPOSAL", size: 18, color: MUTED }),
      ],
      spacing: { before: 2400, after: 240 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: doc.cover.projectTitle,
          bold: true,
          size: 60,
          color: INK,
        }),
      ],
      spacing: { after: 200 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 12 },
      },
    }),
    new Paragraph({ text: "", spacing: { after: 400 } }),

    new Paragraph({
      children: [new TextRun({ text: "PREPARED FOR", size: 18, color: MUTED })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: doc.cover.clientName,
          bold: true,
          size: 24,
          color: INK,
        }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: doc.cover.company, size: 20, color: INK })],
      spacing: { after: 320 },
    }),

    new Paragraph({
      children: [new TextRun({ text: "PREPARED BY", size: 18, color: MUTED })],
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: doc.cover.preparedBy,
          bold: true,
          size: 24,
          color: INK,
        }),
      ],
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({ text: doc.cover.date, size: 20, color: INK })],
    }),

    new Paragraph({ children: [new PageBreak()] }),
  ];

  const body = doc.sections.flatMap((section, index) => [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: `${String(index + 1).padStart(2, "0")}  `,
          bold: true,
          size: 28,
          color: ACCENT,
        }),
        new TextRun({
          text: section.heading,
          bold: true,
          size: 28,
          color: INK,
        }),
      ],
      spacing: { before: index === 0 ? 0 : 360, after: 160 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 6 },
      },
    }),
    ...section.blocks.flatMap(renderBlock),
  ]);

  return new Document({
    creator: doc.cover.preparedBy,
    title: doc.cover.projectTitle,
    description: doc.footerText,
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20, color: INK } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1000, bottom: 1200, left: 1000, right: 1000 } },
        },
        footers: {
          // PageNumber.CURRENT / TOTAL_PAGES emit Word field codes, so numbering
          // stays correct after the client edits the document.
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({ text: doc.footerText, size: 16, color: MUTED }),
                  new TextRun({ text: "\t\t", size: 16 }),
                  new TextRun({ text: "Page ", size: 16, color: MUTED }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED }),
                  new TextRun({ text: " of ", size: 16, color: MUTED }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children: [...cover, ...body],
      },
    ],
  });
}
