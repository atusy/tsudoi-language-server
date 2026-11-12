# Verifying `kakehashi/virtualDocument/prepare` end to end

A scripted editor drives a real [kakehashi](https://github.com/atusy/kakehashi) binary, with
tsudoi and `@atusy/tsudoi-kakehashi-prepare-virtual-document` as its prepare peer and **real
language servers** downstream. It is not part of `bun run check`: it needs a kakehashi built with
the prepare protocol, and it says `skipped` and exits 0 without one.

```sh
KAKEHASHI_BIN=/path/to/kakehashi bun verification/kakehashi-prepare/run.ts
```

Run it from the repository root after `bun install`. The run prints a matrix (scenario × language,
`✓` pass, `✗` deviation, `–` skipped) and every deviation with what was expected and observed; it
exits 1 when a deviation is not one of those listed in `expectations.ts`.

This file is not named `README.md` on purpose: the suite requires every fenced block of every
tracked README to be run or read by a test, and nothing in `bun run check` can run this.

## What it needs

- `bun` (the harness, the peer and the recording proxies run under it).
- kakehashi's Tree-sitter parsers and queries for `markdown`, `nix` and each injected language, in
  kakehashi's data directory (`kakehashi language install <name>`; set `KAKEHASHI_DATA_DIR` to use
  another one). The harness never installs any.
- For each language, its server on `PATH`. A language whose commands are missing is **skipped by
  name**, with the missing commands in the report:

  | language          | commands                                      |
  | ----------------- | --------------------------------------------- |
  | python            | `basedpyright-langserver`, `ruff`             |
  | lua               | `lua-language-server`                         |
  | bash              | `bash-language-server`, `shellcheck`, `shfmt` |
  | c                 | `clangd`                                      |
  | go                | `gopls`, `go`                                 |
  | json              | `vscode-json-language-server`                 |
  | yaml              | `yaml-language-server`                        |
  | css               | `vscode-css-language-server`                  |
  | r                 | `R` with the `languageserver` package         |
  | typescript        | `typescript-language-server`                  |
  | typescript (deno) | `deno`                                        |

  The `contract` scenarios need no language server at all.

## Options

| option                 | default               | effect                                                              |
| ---------------------- | --------------------- | ------------------------------------------------------------------- |
| `--kakehashi=<path>`   | `$KAKEHASHI_BIN`      | the binary under test                                               |
| `--commit=<sha>`       | `$KAKEHASHI_COMMIT`   | written into the report: the binary cannot name its own commit      |
| `--languages=<regex>`  | all                   | only languages whose name matches                                   |
| `--groups=<regex>`     | all                   | only `features`, `lifecycle` and/or `contract`                      |
| `--embeddings=<regex>` | all                   | only embeddings whose name matches (`md-list-2`, `nix-string`, …)   |
| `--features=<regex>`   | all                   | only features whose name matches (`hover`, `formatting`, …)         |
| `--modes=<regex>`      | all                   | `prepared` and/or `flag off` (the same embeddings without the flag) |
| `--scenarios=<regex>`  | all                   | only lifecycle scenarios (see below)                                |
| `--documents=<n>`      | `60`                  | generated documents in the `contract` group                         |
| `--seed=<n>`           | `1`                   | first seed of the generated documents                               |
| `--jobs=<n>`           | `3`                   | languages verified side by side                                     |
| `--patience=<ms>`      | `12000`               | how long an answer may take to become the expected one              |
| `--out=<dir>`          | `__ignored/last-run/` | where the report and every log are written                          |
| `--render=<json>`      |                       | print a finished run's `report.json` under the current expectations |
| `--verbose`            | off                   | print passing cases and measurements as they come                   |

`<out>/report.md` is the matrix, the findings and the measurements; `report.json` holds every case
with what was compared. Beside them, per session: kakehashi's configuration and debug log,
everything each downstream server was sent and answered (`*.downstream.jsonl`), and every prepare
request with the peer's answer (`*.peer.jsonl`).

## How a case is judged

The reference for a language is **the same code in a plain Markdown fence, with experimental
features off**: nothing for a peer to do, nothing prepared. Every other case embeds that code some
other way — in a list at two or four columns or behind a tab, in a nested list, in a blockquote, in
a fence indented or over-indented, between blank edge lines, with CRLF, in a Nix indented string
with and without interpolations (one of them written outside ASCII, and filled with text of another
width) — and asks the same thing at the same place in the code. An answer is read back from host
coordinates into the code's own, so the two can be compared exactly: a hover range, a diagnostic, a
completion item's edit, the code a formatting or a rename leaves.

- **`features`**: diagnostics (pull and push), hover (also after text outside ASCII), definition,
  references, document highlight, signature help, completion (with snippet and multi-line items),
  inlay hints, document symbols, rename, formatting, range formatting and a code action, each for
  every embedding. For a server that defers an auto-import to `completionItem/resolve`, the item
  is resolved while highlighted (the import must come back placed) and again after its text was
  inserted (whatever comes back must not be misplaced). The embeddings kakehashi presents as plain
  code without any peer run a second time with the flag off, which tells a deviation the peer
  brings from one kakehashi has anyway.
- **`lifecycle`** (`--scenarios` names in brackets): edits that change the peer's answer —
  indentation added and removed, a gap that grows to several lines — and undo back [`edits`]; 41
  replacements sent without waiting, and a line typed and deleted character by character
  [`rapid`]; an edit while a prepare is in flight [`in flight`]; several regions of one language
  in one file [`regions`]; the flag off, and on with no peer named, against no peer at all, plus
  empty and whitespace-only regions [`flag off`]; a peer that answers with an error, outside the
  contract, late, too late, that dies and is restarted, or that cannot start [`failures`]; and
  what a configuration without a prepare entry gets — who is asked, what is sent, how long the
  first document waits [`inherit`].
- **`contract`**: generated Nix strings and Markdown HTML blocks (seeded, so a failure can be
  generated again) opened one by one. Each must reach the downstream server as the request's
  segments with the package's answer applied; a document kakehashi refuses never arrives. Where
  the package kept a gap, the text must also be, to the letter, the one the segments spell by the
  rule kakehashi's protocol document states — written out in the harness apart from the package,
  since a peer has nothing else to tell where the virtual document's lines start. Three Nix
  strings then show which interpolations are gaps: one after text on its line, one after the
  line's indentation, and one opening a host line, which kakehashi strips as it strips a line
  prefix (the protocol document records that one).

The recording proxy is what makes "no unprepared text reaches a server" checkable: the texts each
server was sent are read from its log, not inferred from answers.

## Layout

- `run.ts` — the entry point.
- `expectations.ts` — deviations already examined, with their class. A re-run reports only what is
  new, and which known ones no longer show up.
- `lib/languages.ts` — the fixtures: for each language its servers, one piece of code, and where
  in that code each feature is asked.
- `lib/embed.ts` — the embeddings, each knowing where every character of the code went.
- `lib/features.ts` — each LSP feature, asked in host coordinates and read back in the code's.
- `lib/kakehashi.ts`, `lib/lsp.ts` — one kakehashi session and the scripted client.
- `lib/tee.ts`, `lib/sink.ts` — the recording proxy and a do-nothing downstream server.
- `peer/tsudoi.config.ts` — the peer: the package as a user configures it, plus a log and a switch
  to make it misbehave.
- `scenarios/` — the three groups.
