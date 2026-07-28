import {
  CompletionItemKind,
  type CompletionItem,
  type CompletionParams,
  type Hover,
  type HoverParams,
} from "vscode-languageserver-protocol";

import type { RequestContext, Tsudoi, TsudoiConfig } from "@atusy/tsudoi/types";
import { pathCompletion } from "./path-completion.ts";

/**
 * The run of non-whitespace characters containing `character`, or "" if the
 * cursor sits on whitespace. Whitespace is the crudest word rule there is, and
 * that is the point: a real config author replaces this one function with their
 * own language's notion of a word.
 */
function wordAt(line: string, character: number): string {
  const isBoundary = (index: number): boolean => /\s/u.test(line[index] ?? " ");
  let start = character;
  while (start > 0 && !isBoundary(start - 1)) {
    start -= 1;
  }
  let end = character;
  while (end < line.length && !isBoundary(end)) {
    end += 1;
  }
  return line.slice(start, end);
}

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
          // Example: Return a static completion item
          yield [
            {
              label: "HelloWorld",
              kind: CompletionItemKind.Text,
              detail: "Example completion item",
              documentation: "This is a sample completion item.",
            },
          ];

          // Paths from the roots that make sense where the cursor is: the
          // document's own directory, the working directory, and the
          // filesystem root when the fragment starts at one. Each yield here
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
          //  * Items carry a plain `textEdit` with a range. A plugin option
          //    that chooses between inserting and replacing consults an
          //    `InsertReplaceEdit` only, so setting it has NO EFFECT on these
          //    items -- a setting of yours quietly disabled by a choice of
          //    ours, which is worth knowing rather than discovering.
          //  * An option that resolves items lazily is equally inert: tsudoi
          //    advertises `completionProvider` with no `resolveProvider`, so
          //    `completionItem/resolve` is never sent.
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

      "textDocument/hover": async (
        context: RequestContext,
        params: HoverParams,
      ): Promise<Hover | null> => {
        const document = context.tsudoi.documents.get(params.textDocument.uri);
        if (!document) {
          return null;
        }

        // Position math is the config author's job: tsudoi hands over the live
        // buffer and the cursor, and what counts as a `word` in this language
        // is exactly what only this file knows.
        //
        // Both LSP `character` and JavaScript string indices count UTF-16 code
        // units, so plain slicing is correct here -- iterating code points
        // instead would drift on the first character outside the BMP.
        const line = document.getText().split(/\r?\n/)[params.position.line];
        if (line === undefined) {
          return null;
        }
        const word = wordAt(line, params.position.character);
        if (word === "") {
          return null;
        }

        return {
          contents: {
            kind: "markdown",
            value: `**${word}** はカーソル位置の語です。`,
          },
          range: undefined,
        };
      },
    },
  });
};
