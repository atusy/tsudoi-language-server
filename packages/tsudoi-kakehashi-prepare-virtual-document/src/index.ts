/**
 * The package's whole published surface: `exports` in package.json names this
 * module alone.
 *
 * Two functions, because kakehashi needs two things of a peer and tsudoi keeps
 * them apart. `prepareVirtualDocument` answers the request, under
 * `customMethods`; `advertiseVirtualDocumentPrepare` says in the handshake that
 * it will, under `methods.initialize`. A custom method advertises nothing by
 * itself, and kakehashi never asks a server that did not advertise.
 *
 * The types are the options' and the wire's. `prepareSegments`, the pure rule
 * the handler wraps, stays in: it is reachable from this package's own tests
 * by relative import, and a config author reaches it through the handler.
 */
export { advertiseVirtualDocumentPrepare, prepareVirtualDocument } from "./handler.ts";
export type {
  Gap,
  GapFill,
  PreparedSegment,
  PrepareOptions,
  PrepareRule,
  VirtualDocumentPrepareParams,
  VirtualDocumentPrepareResult,
  VirtualDocumentSegment,
} from "./prepare.ts";
