import type { TsudoiConfigFactory } from "@atusy/tsudoi/types";
import { pathCompletion } from "./completion-path.ts";
import { trailingWhitespaceDiagnostics } from "./diagnostic-trailing-whitespace.ts";
import { removeTrailingWhitespace } from "./formatting-trailing-whitespace.ts";
import { hoverWordnet } from "./hover-wordnet.ts";
import { resolvePathStat } from "./resolve-path-stat.ts";

// ANNOTATED, AND THE ANNOTATION IS THE POINT RATHER THAN THE STYLE: it binds
// this file to the factory type tsudoi declares, so the day that type changes
// shape THIS FILE is a compile error rather than a config that quietly receives
// something it does not expect. A config written without the annotation is not
// wrong -- nothing type-checks an author's own file against it -- but it is
// undefended, which is why the documented route carries it.
//
// It also PAYS FOR ITSELF twice over: the return type and every handler's
// `context` and `params` are supplied by it, so annotating here is what lets
// them be annotated nowhere.
const config: TsudoiConfigFactory = () => {
  return Promise.resolve({
    methods: {
      // COMPLETENESS RULING: NOT COMPLETE, AND THE CLAIM THIS CONFIG MAKES ON
      // THE WIRE IS STILL WRONG. The specification says a supplied
      // `CompletionItem[]` is identical to `{ isIncomplete: false, items }` --
      // so a bare array is a POSITIVE ASSERTION that the candidate set is final
      // and the client need not ask again. This config made that assertion from
      // the day it was written and nobody chose it. For ONE SPRINT it did not:
      // Sprint 42 let the delegate answer a `CompletionList` carrying
      // `isIncomplete: true`, and Sprint 43 withdrew the shape that carried it.
      //
      // WHY IT IS FALSE: the delegate lists ONE DIRECTORY filtered by the
      // trailing name of the fragment under the cursor. The next keystroke
      // changes the filter, and often changes the DIRECTORY -- typing `/` moves
      // to a different listing entirely. A client told the set is final shows
      // the user candidates for a prefix they have already left behind, which
      // is the exact failure this PBI's user story names.
      //
      // AND IT CANNOT BE FIXED HERE, WHICH IS WHY THE RULING STAYS RATHER THAN
      // BEING QUIETLY REVISED TO MATCH WHAT SHIPS. A completion handler yields
      // `CompletionItem[]` and nothing else, so there is no value this config
      // or its delegate could produce that says anything other than COMPLETE --
      // the wrongness is in the published type, and the edit that removes it is
      // at `MethodMap` in src/types.ts, not in this file. Relabelling this
      // COMPLETE would make the tree consistent and leave nothing at all
      // recording that a working capability was given up.
      //
      // AND THE SECOND WRONG CLAIM IS THE ONE JUST BELOW, worth separating
      // because a re-type would have papered over both: this arm fires when the
      // document is NOT IN THE STORE, which means `this server cannot see the
      // buffer yet`. It used to `return []`, which goes out as `the candidate
      // set is complete and empty` -- a different statement, and the one thing
      // this server is sure it cannot say. YIELDING NOTHING is `no answer`,
      // which is what was true all along, and THAT HALF SURVIVED SPRINT 43
      // WHILE THE FIRST DID NOT.
      "textDocument/completion": async function* (context, params) {
        const document = context.tsudoi.documents.get(params.textDocument.uri);
        if (!document) {
          return;
        }

        {
          // Paths from the roots that make sense where the cursor is: the
          // document's own directory, the working directory, every workspace
          // folder the editor opened, and the filesystem root when the
          // fragment starts at one. Each yield here
          // is another `$/progress` for a client that asked for partial
          // results, which is why a directory of any size streams.
          //
          // WHAT A USER SHOULD KNOW BEFORE TURNING THIS ON, and none of it is
          // something tsudoi can fix for them:
          //
          //  * KEEPING a filesystem completion source alongside this one shows
          //    the same path TWICE, deduplicated by NEITHER. Cross-source
          //    dedup is the completion plugin's job -- tsudoi cannot know what
          //    other sources exist, or what they will insert.
          //  * REPLACING one is a change to what OPENS the popup. Whether
          //    typing `/` reaches this handler at all is a property of the
          //    editor's completion plugin and its settings, not of tsudoi, and
          //    nothing here should be read as a promise that it does. Check it
          //    before removing the source you have.
          //  * A completion plugin may TRANSFORM what it inserts. A filename
          //    containing a space or shell punctuation can arrive truncated at
          //    the first one. tsudoi emits the whole path; what the plugin
          //    does with it afterwards is the plugin's.
          //  * Items carry an `InsertReplaceEdit` -- an insert range ending at
          //    the cursor and a replace range covering the whole fragment --
          //    so a plugin option that chooses between inserting and replacing
          //    is YOURS to set and does what you set it to. Completing in the
          //    MIDDLE of a path is where the two differ.
          //  * THE WORKSPACE SOURCE IS LIVE ONLY IF YOUR EDITOR SENDS WORKSPACE
          //    FOLDERS at `initialize`, which is its configuration and not
          //    tsudoi's behaviour. ONE FIELD COUNTS: `workspaceFolders`, which
          //    only an editor declaring that capability sends.
          //    examples/completion-path.ts reads that field and nothing else.
          //    An editor that names its project in the DEPRECATED `rootUri` or
          //    `rootPath` instead reaches your handler with both fields filled
          //    and the folder list EMPTY -- tsudoi mirrors what the client sent
          //    and reduces nothing -- and this example declines to reduce them
          //    either, which is a decision its own comments carry. A language
          //    server whose editor names no project at all has no workspace to
          //    answer from, and its
          //    working directory is then wherever the editor itself was
          //    launched -- which is a root, but not the one you meant. AND
          //    NOTHING WILL TELL YOU: the workspace
          //    source contributes nothing, which looks exactly like a working
          //    source in a project that holds no matches. An earlier version
          //    wrote one line to stderr per session and it was removed as
          //    noise; see examples/completion-path.ts, where that decision and
          //    its cost are recorded.
          //  * AN OPTION THAT RESOLVES ITEMS LAZILY IS LIVE, and this paragraph
          //    said the opposite until the handler below was added -- which is
          //    the rule it exists to state, arriving. THIS CONFIG supplies a
          //    `completionItem/resolve` handler, so tsudoi advertises
          //    `resolveProvider` inside `completionProvider` and a client that
          //    resolves lazily gets the file's size and date when the user
          //    highlights an item. It is a fact about this file rather than
          //    about tsudoi -- a config that DROPS that key is advertised no
          //    flag and receives no such request. The same is true of every
          //    method this config does not name, and the shape of the rule is
          //    worth more than the instance: a capability is advertised exactly
          //    where `methods` below can answer it, so ADDING A KEY IS THE
          //    WHOLE OF TURNING A FEATURE ON.
          //
          // DELEGATED WHOLE: the batches this yields are the delegate's, and
          // tsudoi decides from the client's `partialResultToken` whether they
          // leave as `$/progress` or are aggregated into one response. NOTHING
          // WRITTEN HERE CHOOSES BETWEEN THEM, which is the whole shape of the
          // API -- a handler that had items of its own would `yield` them and
          // still choose nothing.
          //
          // `yield*` RATHER THAN A RETURN, and it has to be: this handler is a
          // generator, so handing the delegate's generator BACK would make it
          // the yielded value instead of running it. `yield*` is what forwards
          // every batch AND the close -- tsudoi's `.return()` on cancellation
          // reaches the delegate through it, which is what runs the `finally`
          // that lives with the work in examples/completion-path.ts.
          yield* pathCompletion(context, params);
        }
      },

      // DELEGATED, exactly as completion is: the handler a config author
      // writes can be one line when the work has a home of its own. What stays
      // here is the CHOICE of which method this config answers.
      "textDocument/hover": hoverWordnet,

      // THE OTHER SHAPE A HANDLER CAN HAVE, and it is here to be read beside
      // the two above rather than merely to add a method. Completion goes to
      // the FILESYSTEM for its answer and hover goes to a DICTIONARY; this one
      // goes NOWHERE -- it computes its answer from the document it was handed.
      // That is the commoner shape in a real language server, because a parser
      // does not go anywhere else either.
      "textDocument/diagnostic": trailingWhitespaceDiagnostics,

      // A MATCHED PAIR WITH THE LINE ABOVE, and the pairing is the reason both
      // are here rather than either alone. This removes exactly what that
      // reports -- same analysis, same ranges -- so running the demo is a
      // closed loop: the warnings appear, you format, and they clear. Either
      // half on its own is half a demonstration: a problem this server cannot
      // fix, or a fix for a problem it never reports.
      "textDocument/formatting": removeTrailingWhitespace,

      // WHAT THE COMPLETION ABOVE DELIBERATELY DID NOT DO, and the pairing is
      // the reason it is here: listing a directory offers what is in it, and
      // asking the disk about every entry is what a large directory cannot
      // afford. This answers that question for the ONE ITEM THE USER
      // HIGHLIGHTS. It is also the only method here whose params are neither a
      // document nor a position -- it takes the item back and hands it back.
      //
      // IT MAY NOT BE HERE ALONE: a config supplying this key without
      // `textDocument/completion` is refused when it LOADS, since resolving
      // items nothing can produce is incoherent and would advertise a completion
      // provider tsudoi cannot answer.
      "completionItem/resolve": resolvePathStat,
    },
  });
};

export default config;
