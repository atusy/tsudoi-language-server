/**
 * THE PROTOCOL NAMES THE PUBLISHED SUBPATH RE-EXPORTS, spelled here so a probe
 * that imports them cannot quietly agree with a src/types.ts that dropped one.
 *
 * WHY THESE AND NOT OTHERS is stated at src/types.ts, where a new one would be
 * added. What this list is for is the probes that import it. NAMED RATHER THAN
 * COUNTED, and it was not: this block said `a ninth` while the list already held
 * nine, and every probe describing itself by that number was reading a count
 * that had stopped being true.
 *
 * IT LEFT THE FILE THAT FIRST NEEDED IT the moment a SECOND probe needed the
 * same list, and that is not tidiness. A copy would agree with the original
 * only until someone edited one of them, and a list whose whole job is to
 * DISAGREE with a surface that moved is the last thing to keep in two places by
 * hand. Moved before the second probe was written, so no copy ever existed.
 */
export const publicProtocolNames = [
  "CompletionItem",
  "CompletionItemKind",
  "CompletionParams",
  "DiagnosticSeverity",
  "DocumentDiagnosticParams",
  "DocumentDiagnosticReport",
  "DocumentFormattingParams",
  "Hover",
  "HoverParams",
  "MarkupContent",
  "Position",
  "TextEdit",
  "WorkspaceFolder",
] as const;

/**
 * A probe source that IMPORTS each name and then USES it in a type position,
 * because an unused import is erased and proves nothing about the surface.
 *
 * `declare const` is the one form that fits EVERY name here, which is why it
 * has survived every arrival: most are interfaces or aliases, so `typeof` --
 * which needs a VALUE -- would fail on them for a reason that has nothing to do
 * with what ships. The two that ARE values also declare a type alias beside the
 * namespace, so they fit the same form rather than needing a second one.
 */
export function importsAndUses(names: readonly string[], from: string): string {
  const uses = names.map((name, index) => `declare const __use${String(index)}: ${name};\n`);
  return `import { ${names.join(", ")} } from "${from}";\n${uses.join("")}`;
}
