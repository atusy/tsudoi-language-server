import { isNpmViewE404, type NpmViewResult } from "./retry-npm-view.ts";

interface RetryContext {
  readonly expectedVersion: string;
  readonly requireProvenance: boolean;
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function alphaVersionParts(value: unknown): readonly [bigint, bigint, bigint, bigint] | null {
  if (typeof value !== "string") return null;
  const match = /^(\d+)\.(\d+)\.(\d+)-alpha\.(\d+)$/.exec(value);
  if (match === null) return null;
  return [
    BigInt(match[1] as string),
    BigInt(match[2] as string),
    BigInt(match[3] as string),
    BigInt(match[4] as string),
  ];
}

function isEarlierAlphaVersion(candidate: unknown, expected: string): boolean {
  const candidateParts = alphaVersionParts(candidate);
  const expectedParts = alphaVersionParts(expected);
  if (candidateParts === null || expectedParts === null) return false;
  for (const [index, part] of candidateParts.entries()) {
    const expectedPart = expectedParts[index] as bigint;
    if (part !== expectedPart) return part < expectedPart;
  }
  return false;
}

export function shouldRetryRegistryMetadata(result: NpmViewResult, context: RetryContext): boolean {
  if (isNpmViewE404(result)) return true;
  if (result.status !== 0) return false;

  let metadata: Record<string, unknown> | null;
  try {
    metadata = object(JSON.parse(result.stdout));
  } catch {
    return false;
  }
  if (metadata === null) return false;
  const tagsValue = metadata["dist-tags"];
  if (tagsValue === undefined) return true;
  const tags = object(tagsValue);
  if (tags === null) return false;
  if (tags.alpha === undefined) return true;
  if (isEarlierAlphaVersion(tags.alpha, context.expectedVersion)) return true;
  if (tags.alpha !== context.expectedVersion) return false;
  return context.requireProvenance && metadata["dist.attestations"] === undefined;
}
