import type {
  DocumentDiagnosticReport,
  DocumentDiagnosticReportPartialResult,
  FullDocumentDiagnosticReport,
  UnchangedDocumentDiagnosticReport,
} from "vscode-languageserver-protocol";

type RelatedReport = FullDocumentDiagnosticReport | UnchangedDocumentDiagnosticReport;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Validate the report envelope; diagnostic contents remain the handler's responsibility. */
function isReport(value: unknown): value is RelatedReport {
  return (
    isRecord(value) &&
    (value.kind === "full"
      ? Array.isArray(value.items) &&
        (value.resultId === undefined || typeof value.resultId === "string")
      : value.kind === "unchanged" && typeof value.resultId === "string")
  );
}

function isRelatedDocuments(value: unknown): value is Record<string, RelatedReport> {
  return isRecord(value) && Object.values(value).every(isReport);
}

function isDocumentReport(value: unknown): value is DocumentDiagnosticReport {
  return (
    isReport(value) &&
    (!("relatedDocuments" in value) ||
      value.relatedDocuments === undefined ||
      isRelatedDocuments(value.relatedDocuments))
  );
}

function isPartial(value: unknown): value is DocumentDiagnosticReportPartialResult {
  return isRecord(value) && !("kind" in value) && isRelatedDocuments(value.relatedDocuments);
}

/** Diagnostic stream order and optional aggregation, independent of generator lifecycle. */
export class DiagnosticResults {
  #started = false;
  #report: DocumentDiagnosticReport | undefined;
  #related: Map<string, RelatedReport> | undefined;

  constructor(private readonly streaming: boolean) {}

  accept(value: unknown): void {
    if (!this.#started) {
      if (!isDocumentReport(value)) {
        throw new TypeError("textDocument/diagnostic must yield a document report first");
      }
      this.#started = true;
      if (!this.streaming) {
        this.#report = value;
        this.collect(value.relatedDocuments);
      }
      return;
    }
    if (!isPartial(value)) {
      throw new TypeError(
        "textDocument/diagnostic must yield related-document partials after its report",
      );
    }
    if (!this.streaming) {
      this.collect(value.relatedDocuments);
    }
  }

  finish(value: unknown): DocumentDiagnosticReport | null {
    if (!this.#started) {
      if (!isDocumentReport(value)) {
        throw new TypeError(
          "textDocument/diagnostic must return a document report when it yields nothing",
        );
      }
      return value;
    }
    if (value !== undefined) {
      throw new TypeError("textDocument/diagnostic must not return a result after yielding");
    }
    if (this.streaming) {
      return null;
    }
    // The initial report is retained only for aggregation. A map avoids copying
    // all earlier entries on every partial and keeps URI keys such as __proto__ safe.
    const report = this.#report!;
    return this.#related === undefined
      ? report
      : { ...report, relatedDocuments: Object.fromEntries(this.#related) };
  }

  private collect(related: Record<string, RelatedReport> | undefined): void {
    if (related === undefined) {
      return;
    }
    this.#related ??= new Map();
    for (const [uri, report] of Object.entries(related)) {
      this.#related.set(uri, report);
    }
  }
}
