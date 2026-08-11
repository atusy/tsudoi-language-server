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
import { defaultWordPattern, type WordOptions, wordsIn } from "./words.ts";

/**
 * What counts as a word, and nothing about which lines are read.
 *
 * IT ADDS NO WINDOW, WHICH IS THE DIFFERENCE FROM `CompleteAroundOptions` RATHER
 * THAN AN OMISSION: there is no line to centre a window on, because the corpus is
 * every open document and the cursor's position decides nothing here.
 *
 * NOR IS THERE A BOUND ON HOW MANY DOCUMENTS ARE READ, and that is declined
 * rather than overlooked: a limit would have to pick WHICH documents to drop, and
 * every rule for that -- most recently opened, nearest the cursor's file, largest
 * first -- is a guess about the user's attention that this package cannot check.
 * The memo below is what keeps the cost off the keystroke instead. AN AUTHOR WHO
 * NEEDS A BOUND HAS `wordsIn` AND THE STORE: `context.tsudoi.documents.values()`
 * is theirs to filter before scanning.
 */
export type CompleteCorpusOptions = WordOptions;

/**
 * The words last read out of one open document, WITH EVERYTHING THAT WOULD MAKE
 * THEM THE WRONG ANSWER TODAY.
 *
 * THE FILTERS ARE PART OF THE KEY AND NOT DECORATION: nothing about a document
 * changes between two requests that pass different `minLength`s, so a memo
 * consulting the version alone answers the second request with the first one's
 * words. `pattern` is compared by SOURCE AND FLAGS because a `RegExp` is an
 * object -- an author's arrow that builds one per call would never hit a cache
 * keyed on identity, and a cache that ignored the pattern would hit it wrongly.
 */
interface Scan {
  readonly version: number;
  readonly minLength: number;
  readonly maxColumns: number;
  readonly patternSource: string;
  readonly patternFlags: string;
  readonly words: readonly string[];
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

/** The resolved filters one request scans under. */
interface Filters {
  readonly pattern: RegExp;
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
function wordsOf(document: DocumentView, filters: Filters): readonly string[] {
  const version = document.version;
  const cached = scans.get(document);
  if (
    cached !== undefined &&
    cached.version === version &&
    cached.minLength === filters.minLength &&
    cached.maxColumns === filters.maxColumns &&
    cached.patternSource === filters.pattern.source &&
    cached.patternFlags === filters.pattern.flags
  ) {
    return cached.words;
  }
  // SPLIT ON `\r?\n` AND NOT `\n`, the same reading its sibling takes: a CRLF
  // document otherwise leaves a `\r` at the end of every line, which the word
  // pattern does not match but which counts toward the column bound.
  const words = wordsIn(document.getText().split(/\r?\n/), filters);
  scans.set(document, {
    version,
    minLength: filters.minLength,
    maxColumns: filters.maxColumns,
    patternSource: filters.pattern.source,
    patternFlags: filters.pattern.flags,
    words,
  });
  return words;
}

/**
 * A `textDocument/completion` handler offering the words of every open document.
 *
 * THE SAME SHAPE AS `completeAround` AND `completePath`: `(context, params,
 * options)`, an async generator, options LAST and defaulted, so
 * `"textDocument/completion": completeCorpus` type-checks with no wrapper and an
 * author who wants options writes the arrow that supplies them.
 *
 * THE PARAMS ARE READ FOR NOTHING, WHICH IS DELIBERATE AND NOT DEAD WEIGHT. This
 * handler answers the same list wherever the cursor is, and it keeps the
 * parameter because the shape is what the row's type requires and what its
 * siblings take -- an author composing the two writes one call twice.
 *
 * SO A REQUEST NAMING A BUFFER THE STORE DOES NOT HOLD IS STILL ANSWERED, where
 * `completeAround` has nothing to say about one: the answer never depended on
 * that document, and every other open buffer is still there to offer.
 *
 * IT YIELDS ONCE, ON THE RULING ITS SIBLING RECORDS AND FOR THE SAME REASON,
 * WHICH THE LARGER READ DOES NOT CHANGE. Streaming exists for an answer that
 * ARRIVES OVER TIME; this one is CPU over buffers already in memory with no
 * `await` in it, so there is no moment at which a partial list has arrived and
 * the rest has not -- a yield per document would spend a `$/progress` per
 * document to say the same thing at the same time. STREAMING THE SCAN WAS ASKED
 * FOR AND IS REFUSED FOR A SECOND REASON: a handler that offered what it had
 * indexed so far would need to tell the client to ask again, and that is
 * `isIncomplete`, which tsudoi's completion row cannot express -- so the client
 * would take a partial list as final.
 *
 * THE ORDER IS THE STORE'S, first-seen: documents in the order the client opened
 * them, words in the order they appear. NOTHING IS SORTED and no `sortText` is
 * sent, so the client ranks the list -- a package-chosen order would be a guess
 * competing with the editor's own fuzzy score.
 *
 * NOTHING IS FILTERED AGAINST WHAT THE USER TYPED, on the ruling at
 * `completeAround`: the client narrows the list, and it knows about `filterText`,
 * fuzzy matching and case, none of which a handler can see.
 *
 * COMPLETENESS RULING: COMPLETE, and it follows from what this handler READS.
 * The specification treats a supplied `CompletionItem[]` as
 * `{ isIncomplete: false, items }` -- do not re-query, filter what you were
 * given -- and that is TRUE HERE because THIS HANDLER NEVER LOOKS AT WHAT WAS
 * TYPED: every word of every open document is offered whatever the prefix, so a
 * narrower one cannot produce a candidate this answer did not already carry.
 *
 * WHAT WOULD OVERTURN IT IS AN EDIT OR AN OPEN, AND NOT A KEYSTROKE: a
 * `didChange` or a `didOpen` really does change the corpus, and the client sends
 * one and asks again, which is the route every source is refreshed by. AND THE
 * MEMO IS NOT AN EXCEPTION TO THAT -- it is keyed on the version, so the next
 * request after an edit re-scans what the edit touched.
 */
export async function* completeCorpus(
  context: RequestContext,
  params: CompletionParams,
  options: CompleteCorpusOptions = {},
): AsyncGenerator<CompletionItem[], void, void> {
  const filters: Filters = {
    pattern: options.wordPattern ?? defaultWordPattern,
    minLength: options.minLength ?? 2,
    maxColumns: options.maxColumns ?? 200,
  };
  const found = new Set<string>();
  for (const document of context.tsudoi.documents.values()) {
    for (const word of wordsOf(document, filters)) {
      found.add(word);
    }
  }
  if (found.size === 0) {
    return;
  }
  yield [...found].map(
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
