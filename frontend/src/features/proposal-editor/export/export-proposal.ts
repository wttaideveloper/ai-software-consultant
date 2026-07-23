import type { ProposalDocument } from "@/features/proposal-editor/export/proposal-document.model";

export type ExportFormat = "pdf" | "docx";

/**
 * Runs the actual export.
 *
 * pdfmake and docx are imported dynamically so neither reaches the main bundle:
 * they only download when an admin exports, which most page views never do.
 * pdfmake in particular ships embedded fonts and is by far the heaviest
 * dependency in the app.
 */

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking synchronously can cancel the download in some browsers; defer it.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

type PdfMakeModule = typeof import("pdfmake/build/pdfmake");

/**
 * `pdfmake/build/pdfmake` is a UMD bundle exporting a class instance
 * (`module.exports = new pdfmake()`), so Vite's CJS interop may surface it
 * either as the namespace or under `default`. Normalising both shapes here
 * keeps this working across dev (esbuild) and build (rolldown).
 */
function resolveInterop<T>(module: T): T {
  const candidate = (module as { default?: T }).default;
  return candidate ?? module;
}

async function exportPdf(doc: ProposalDocument): Promise<void> {
  const [{ buildPdfDefinition }, pdfMakeModule, vfsModule] = await Promise.all([
    import("@/features/proposal-editor/export/build-pdf-definition"),
    import("pdfmake/build/pdfmake"),
    import("pdfmake/build/vfs_fonts"),
  ]);

  const pdfMake = resolveInterop<PdfMakeModule>(pdfMakeModule);
  const vfs = resolveInterop<unknown>(vfsModule);

  // Registers the bundled Roboto family; without it pdfmake cannot lay out text.
  pdfMake.addVirtualFileSystem(
    vfs as Parameters<typeof pdfMake.addVirtualFileSystem>[0],
  );

  const blob = await pdfMake.createPdf(buildPdfDefinition(doc)).getBlob();
  triggerDownload(blob, `${doc.fileBaseName}.pdf`);
}

async function exportDocx(doc: ProposalDocument): Promise<void> {
  const [{ buildDocxDocument }, { Packer }] = await Promise.all([
    import("@/features/proposal-editor/export/build-docx-document"),
    import("docx"),
  ]);

  const blob = await Packer.toBlob(buildDocxDocument(doc));
  triggerDownload(blob, `${doc.fileBaseName}.docx`);
}

export async function exportProposal(
  doc: ProposalDocument,
  format: ExportFormat,
): Promise<void> {
  if (format === "pdf") {
    await exportPdf(doc);
    return;
  }
  await exportDocx(doc);
}
