// Every LSP type, TYPE-ONLY, so the set grows with the dependency and no name
// has to be argued for one at a time.
//
// TYPE-ONLY IS THE RESTRAINT. A plain `export *` here publishes 287 runtime
// names: 93 Request and Notification constants for methods tsudoi does not
// implement, `createProtocolConnection` -- which would let a config build its
// own connection and bypass tsudoi entirely -- and vscode-jsonrpc's plumbing
// leaking through, RAL, LRUCache, AbstractMessageReader, NotificationType0
// through 9. Naming any of them as a value is TS1362.
//
// THE BARE SPECIFIER, NOT `/node`, which needs @types/node a config author may
// never have installed (TS2591 for child_process, net, worker_threads; TS2503
// for namespace NodeJS). Only visible with `skipLibCheck` OFF, which is what
// test/installed-without-node-types.test.ts sets.
export type * from "vscode-languageserver-protocol";
