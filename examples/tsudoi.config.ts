import type {
  CompletionItem,
  CompletionParams,
  RequestContext,
  Tsudoi,
  TsudoiConfig,
} from "@atusy/tsudoi/types";
import { pathCompletion } from "./completion-path.ts";
import { trailingWhitespaceDiagnostics } from "./diagnostic-trailing-whitespace.ts";
import { removeTrailingWhitespace } from "./formatting-trailing-whitespace.ts";
import { hoverWordnet } from "./hover-wordnet.ts";
import { resolvePathStat } from "./resolve-path-stat.ts";

export default (_tsudoi: Tsudoi): Promise<TsudoiConfig> => {
  return Promise.resolve({
    methods: {
      "textDocument/completion": async function* (
        context: RequestContext,
        params: CompletionParams,
      ): AsyncGenerator<CompletionItem[], CompletionItem[] | null, void> {
        const document = context.tsudoi.documents.get(params.textDocument.uri);
        if (!document) {
          return [];
        }

        try {
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
          //  * THE WORKSPACE SOURCE IS LIVE ONLY IF YOUR EDITOR SENDS FOLDERS
          //    at `initialize`, which is its configuration and not tsudoi's
          //    behaviour: a language server started without a project root has
          //    no workspace to answer from, and its working directory is then
          //    wherever the editor itself was launched -- which is a root, but
          //    not the one you meant. HOW YOU WILL KNOW: this handler says so
          //    once on stderr per session, because a source that silently
          //    contributes nothing is indistinguishable from one that works in
          //    a project holding no matches.
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
          yield* pathCompletion(context, params);

          // Deliberate divergence from the brief's example, which falls off the end here.
          // The declared AsyncGenerator return type requires an explicit return, and per the
          // brief's own MethodMap comment a null result after partial responses is delivered
          // to the client as an empty CompletionItem[].
          return null;
        } finally {
          // Where a handler releases what it held: an index reader, a child
          // process, a temporary file. There is nothing to release here, and
          // the block is kept anyway because WHEN it runs is the part worth
          // knowing.
          //
          // It runs on the ordinary path, and it also runs when the editor
          // gives up on this request -- which it does on every keystroke that
          // supersedes the last one. tsudoi closes this generator then, so
          // cleanup written here happens even though the request is answered
          // `RequestCancelled` and nothing here can be watched succeeding.
          // Cleanup written AFTER the loop instead would simply never run.
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
