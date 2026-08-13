export interface DictionaryFilterInput {
  readonly typed: string;
}

export type DictionaryFilter = (
  words: Iterable<string>,
  input: DictionaryFilterInput,
) => Iterable<string>;

export const dictionaryPrefixFilter: DictionaryFilter = function* (words, input) {
  if (input.typed === "") {
    yield* words;
    return;
  }
  const typed = input.typed.toLowerCase();
  for (const word of words) {
    if (word.trimStart().toLowerCase().startsWith(typed)) {
      yield word;
    }
  }
};

export const defaultDictionaryFilters: readonly DictionaryFilter[] = Object.freeze([
  dictionaryPrefixFilter,
]);

export function applyDictionaryFilters(
  words: Iterable<string>,
  filters: readonly DictionaryFilter[],
  input: DictionaryFilterInput,
  maxItems: number,
): string[] {
  let flowing = words;
  for (const filter of filters) {
    flowing = filter(flowing, input);
  }
  const kept: string[] = [];
  const seen = new Set<string>();
  for (const word of flowing) {
    if (seen.has(word)) {
      continue;
    }
    if (kept.length >= maxItems) {
      break;
    }
    seen.add(word);
    kept.push(word);
  }
  return kept;
}
