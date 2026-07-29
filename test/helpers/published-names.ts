/**
 * THE PROTOCOL NAMES THE PUBLISHED SUBPATH RE-EXPORTS, spelled here so a probe
 * that imports them cannot quietly agree with a src/types.ts that dropped one.
 *
 * WHY THESE AND NOT OTHERS is stated at src/types.ts, where a ninth would be
 * added. What this list is for is the probes that import it.
 *
 * IT LEFT THE FILE THAT FIRST NEEDED IT the moment a SECOND probe needed the
 * same eight, and that is not tidiness. A copy would agree with the original
 * only until someone edited one of them, and a list whose whole job is to
 * DISAGREE with a surface that moved is the last thing to keep in two places by
 * hand. Moved before the second probe was written, so no copy ever existed.
 */
export const publicProtocolNames = [
  "CompletionItem",
  "CompletionItemKind",
  "CompletionParams",
  "Hover",
  "HoverParams",
  "MarkupContent",
  "Position",
  "WorkspaceFolder",
] as const;

/**
 * A probe source that IMPORTS each name and then USES it in a type position,
 * because an unused import is erased and proves nothing about the surface.
 *
 * `declare const` is the one form that fits all eight: seven are interfaces or
 * aliases, so `typeof` -- which needs a VALUE -- would fail on them for a reason
 * that has nothing to do with what ships.
 */
export function importsAndUses(names: readonly string[], from: string): string {
  const uses = names.map((name, index) => `declare const __use${String(index)}: ${name};\n`);
  return `import { ${names.join(", ")} } from "${from}";\n${uses.join("")}`;
}
