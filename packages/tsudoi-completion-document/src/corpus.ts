/**
 * Session-wide completion for a config author's own `textDocument/completion`
 * handler: the words already written in EVERY document the client has opened.
 *
 * WHAT IT IS FOR, said against its sibling because the two are installed
 * together: `completeAround` answers `what am I writing about here`, and this
 * answers `what do we call things in this project`. The second cannot be had from
 * a window, and the first is drowned by a corpus -- so they are two handlers
 * rather than one with a wider bound.
 *
 * IT STILL KNOWS NO LANGUAGE. Every word of every open buffer is a candidate,
 * with no notion of scope, definition or import; what makes that worth offering
 * is that a project's vocabulary repeats, and what makes it safe is that the
 * client filters and the items say where they came from.
 */
import type { CompletionItem, CompletionParams } from "@atusy/tsudoi-language-server/deps/protocol";
import type { DocumentView, RequestContext } from "@atusy/tsudoi-language-server/types";
import {
  applyFilters,
  defaultFilters,
  nonNegativeSafeInteger,
  validateMaxItems,
} from "./filters.ts";
import { defaultScanner, type Scanner } from "./scanners.ts";
import {
  type ScannedWord,
  type WordOptions,
  typedWord,
  scanWords,
  wordsExceptInput,
} from "./words.ts";

/**
 * What counts as a word, and nothing about which lines are read.
 *
 * IT ADDS NO WINDOW, WHICH IS THE DIFFERENCE FROM `CompleteAroundOptions` RATHER
 * THAN AN OMISSION: there is no line to centre a window on, because the corpus is
 * every open document and the cursor's position decides nothing here.
 *
 * NOR IS THERE A BOUND ON HOW MANY DOCUMENTS ARE READ, and that is still declined
 * rather than overlooked: a limit on DOCUMENTS would have to pick which to drop,
 * and every rule for that -- most recently opened, nearest the cursor's file,
 * largest first -- is a guess about the user's attention that this package cannot
 * check. WHAT BOUNDS THE ANSWER INSTEAD IS THE PIPELINE: `filters` decides what is
 * worth sending and `maxItems` caps what survives, and the memo keeps the scanning
 * off the keystroke. AN AUTHOR WHO REALLY WANTS FEWER DOCUMENTS HAS `wordsIn` AND
 * THE STORE: `context.tsudoi.documents.values()` is theirs to filter before
 * scanning.
 */
export type CompleteCorpusOptions = WordOptions;

/**
 * The words last read out of one open document, WITH EVERYTHING THAT WOULD MAKE
 * THEM THE WRONG ANSWER TODAY.
 *
 * THE SCAN OPTIONS ARE PART OF THE KEY AND NOT DECORATION: nothing about a
 * document changes between two requests that pass different `minLength`s, so a memo
 * consulting the version alone answers the second request with the first one's
 * words. `filters` AND `maxItems` ARE DELIBERATELY ABSENT FROM IT -- they run on
 * what was remembered rather than deciding it, so changing one re-reads nothing,
 * which is what lets the prefix change on every keystroke for free.
 *
 * THE SCANNER IS COMPARED BY IDENTITY BECAUSE IT IS A FUNCTION, AND THAT IS A
 * COST OF THE OPTION BEING A CALLBACK RATHER THAN A CHOICE MADE HERE. While it
 * was a `RegExp` this compared SOURCE AND FLAGS, so two equivalent patterns were
 * one key; two equivalent closures cannot be told apart by anything. SO AN AUTHOR
 * WHO BUILDS THEIR SCANNER INSIDE THE ARROW THAT CALLS THIS HANDLER GETS A NEW KEY
 * ON EVERY KEYSTROKE and every open document is rescanned every time -- correct
 * answers, no memo, and nothing anywhere to say so. `defaultScanner` is a
 * module-level value for exactly that reason, and the option's own documentation
 * is where an author is told to hoist theirs.
 */
interface Scan {
  readonly version: number;
  readonly minLength: number;
  readonly maxColumns: number;
  readonly scanner: Scanner;
  readonly words: readonly ScannedWord[];
}

/**
 * KEYED ON THE VIEW OBJECT AND NOT ON THE URI, WHICH IS A CORRECTNESS DECISION
 * AND NOT AN OPTIMISATION.
 *
 * A VERSION IS NOT A SESSION-WIDE CLOCK. tsudoi's `DocumentStore` says a document
 * reopened at a uri numbers from whatever the client sent at `didOpen`, so
 * `close`, an edit on disk, `didOpen` AT VERSION 1 AGAIN is an ordinary sequence
 * -- and a memo keyed on `uri` plus version would serve the OLD file's words for
 * the rest of the session, with nothing about the wrong answer to notice. tsudoi
 * builds a fresh view per open and keeps it across every `didChange`, so object
 * identity is exactly `the same buffer, still open`.
 *
 * A `WeakMap` SO A CLOSED DOCUMENT'S SCAN LEAVES WITH IT: the store drops the
 * entry on `didClose`, nothing else holds the view, and a `Map` on uris would
 * hold every buffer's words for the life of the process.
 *
 * MODULE-LEVEL AND NOT HANDED IN, AND THE ALTERNATIVE WAS THE FIRST SPELLING
 * ASKED FOR: a factory or a `useCorpusIndex()` handle an author threads through
 * their config. It is refused for the reason recorded at `completeAround` -- two
 * handler packages called two different ways -- and it is SAFE here because the
 * keys are view objects, which belong to one session's store: two sessions in one
 * process share no key, so there is nothing for them to read of each other's.
 *
 * MEASURED, THAT LAST CLAIM DEMONSTRATING ITSELF: rebuilt as a uri-keyed `Map`,
 * this table reddened six of this package's own corpus arms where one was
 * predicted, and the five extra were each an arm reading a document at a uri
 * another arm had already opened. Sharing a process is enough to share a uri; it
 * is not enough to share a view.
 */
const scans = new WeakMap<DocumentView, Scan>();

/** The resolved options one request SCANS under -- the pipeline is applied after,
 * and is deliberately not part of this or of the memo key. */
interface ScanFilters {
  readonly scanner: Scanner;
  readonly minLength: number;
  readonly maxColumns: number;
}

/**
 * This document's words under `filters`, scanning it only if the memo cannot
 * answer.
 *
 * VERSION IS READ BEFORE THE TEXT, and nothing in this package reddens if you
 * swap them: no `await` sits between them today, so no `didChange` can land
 * in the middle and the two readings are of one buffer. The order is what keeps
 * that true if one ever does -- text newer than the version it is stored under is
 * re-scanned a request later, where a version newer than the text it is stored
 * under is served as current for as long as the document sits still.
 */
function wordsOf(document: DocumentView, filters: ScanFilters): readonly ScannedWord[] {
  const version = document.version;
  const cached = scans.get(document);
  if (
    cached !== undefined &&
    cached.version === version &&
    cached.minLength === filters.minLength &&
    cached.maxColumns === filters.maxColumns &&
    cached.scanner === filters.scanner
  ) {
    return cached.words;
  }
  // SPLIT ON `\r?\n` AND NOT `\n`, the same reading its sibling takes: a CRLF
  // document otherwise leaves a `\r` at the end of every line, which the word
  // pattern matches but which counts toward the column bound.
  const words = scanWords(document.getText().split(/\r?\n/), filters);
  scans.set(document, {
    version,
    minLength: filters.minLength,
    maxColumns: filters.maxColumns,
    scanner: filters.scanner,
    words,
  });
  return words;
}

/**
 * Offers words from all open documents in one batch, in first-seen order.
 * Omits the word occurrence ending at the cursor, retaining occurrences elsewhere.
 * The cursor selects the prefix to filter by; it does not limit the scan.
 * If the requested document is missing, filtering uses an empty prefix.
 * Scans are cached by document version and scan options.
 *
 * The default prefix filter reduces the payload; fuzzy clients should customize
 * `filters` or disable them and set `maxItems`. The yielded array implies
 * isIncomplete: false; this handler does not request automatic re-querying.
 */
export async function* completeCorpus(
  context: RequestContext,
  params: CompletionParams,
  options: CompleteCorpusOptions = {},
): AsyncGenerator<CompletionItem[], void, void> {
  validateMaxItems(options.maxItems);
  const minQueryLength = nonNegativeSafeInteger(
    options.minQueryLength === undefined ? 0 : options.minQueryLength,
    "minQueryLength",
  );
  if (options.maxItems === 0) {
    return;
  }
  const scanFilters: ScanFilters = {
    scanner: options.scanner ?? defaultScanner,
    minLength: options.minLength ?? 2,
    maxColumns: options.maxColumns ?? 200,
  };
  // THE PREFIX COMES FROM THE ASKED DOCUMENT IF THE STORE HOLDS IT, and from
  // NOTHING if it does not -- which is the one place this handler's `answered even
  // for a buffer we were never sent` ruling costs something: with no line to read,
  // there is no word being typed, so the pipeline filters on `""` and the answer is
  // the whole corpus. That is the old unbounded answer, in the one case where a
  // better one is unavailable rather than unchosen.
  const asked = context.tsudoi.documents.get(params.textDocument.uri);
  const typed =
    asked === undefined
      ? ""
      : typedWord(
          scanFilters.scanner,
          // THE CURSOR'S LINE ALONE, AS A RANGE: reading the whole document again just
          // to look at one line would spend what the corpus memo is meant to save.
          asked.getText({
            start: { line: params.position.line, character: 0 },
            end: params.position,
          }),
        );
  if (typed.length < minQueryLength) {
    return;
  }
  const scanned: string[] = [];
  for (const document of context.tsudoi.documents.values()) {
    scanned.push(
      ...wordsExceptInput(
        wordsOf(document, scanFilters),
        document === asked ? params.position : undefined,
      ),
    );
  }
  const words = applyFilters(
    scanned,
    options.filters ?? defaultFilters,
    { typed },
    options.maxItems,
  );
  if (words.length === 0) {
    return;
  }
  yield words.map(
    (word) =>
      ({
        label: word,
        // `Text` AND NOT `Keyword` OR `Variable`: this package knows nothing
        // about the language and cannot tell one from the other, so any narrower
        // kind would be an icon in the user's popup asserting something nobody
        // checked.
        kind: 1,
        // WHERE IT CAME FROM, AND NOT `around`: a user whose popup is fed by both
        // of this package's handlers has no other way to tell a word from the
        // line above from one in a file they have not opened today.
        detail: "corpus",
      }) satisfies CompletionItem,
  );
}
