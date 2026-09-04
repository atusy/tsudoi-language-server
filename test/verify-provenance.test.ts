import { expect, test } from "bun:test";
import type { Bundle } from "sigstore";
import { verifyProvenance, type ProvenancePolicy } from "../scripts/verify-provenance.ts";
import { applySuiteDeadline } from "./helpers/deadline.ts";

applySuiteDeadline();

const policy: ProvenancePolicy = {
  packageName: "@atusy/tsudoi-language-server",
  version: "0.1.0-alpha.0",
  sha512: "a".repeat(128),
  attestationUrl:
    "https://registry.npmjs.org/-/npm/v1/attestations/@atusy%2ftsudoi-language-server@0.1.0-alpha.0",
  repository: "https://github.com/atusy/tsudoi-language-server",
  workflowPath: ".github/workflows/publish.yml",
  gitRef: "refs/tags/v0.1.0-alpha.0",
  gitCommit: "0123456789abcdef0123456789abcdef01234567",
};

function fixture(
  overrides: {
    readonly sha512?: string;
    readonly repository?: string;
    readonly workflowPath?: string;
    readonly gitRef?: string;
    readonly gitCommit?: string;
  } = {},
): { readonly response: Response; readonly bundle: Bundle } {
  const repository = overrides.repository ?? policy.repository;
  const gitRef = overrides.gitRef ?? policy.gitRef;
  const statement = {
    subject: [
      {
        name: "pkg:npm/%40atusy/tsudoi-language-server@0.1.0-alpha.0",
        digest: { sha512: overrides.sha512 ?? policy.sha512 },
      },
    ],
    predicateType: "https://slsa.dev/provenance/v1",
    predicate: {
      buildDefinition: {
        buildType: "https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1",
        externalParameters: {
          workflow: {
            repository,
            path: overrides.workflowPath ?? policy.workflowPath,
            ref: gitRef,
          },
        },
        resolvedDependencies: [
          {
            uri: `git+${repository}@${gitRef}`,
            digest: { gitCommit: overrides.gitCommit ?? policy.gitCommit },
          },
        ],
      },
    },
  };
  const bundle = {
    mediaType: "application/vnd.dev.sigstore.bundle.v0.3+json",
    verificationMaterial: {},
    dsseEnvelope: {
      payloadType: "application/vnd.in-toto+json",
      payload: Buffer.from(JSON.stringify(statement)).toString("base64"),
      signatures: [],
    },
  } as unknown as Bundle;
  return {
    bundle,
    response: {
      ok: true,
      json: async () => ({
        attestations: [{ predicateType: "https://slsa.dev/provenance/v1", bundle }],
      }),
    } as Response,
  };
}

test("the exact cryptographically accepted bundle is checked against the release source", async () => {
  const { response, bundle } = fixture();
  let verified: Bundle | undefined;
  await verifyProvenance(
    policy,
    (async () => response) as unknown as typeof fetch,
    async (candidate) => {
      verified = candidate;
    },
  );
  expect(verified).toBe(bundle);
});

test("source and subject mismatches fail after cryptographic verification", async () => {
  for (const [overrides, error] of [
    [{ sha512: "b".repeat(128) }, "retained tarball"],
    [{ repository: "https://github.com/atusy/other" }, "workflow"],
    [{ workflowPath: ".github/workflows/other.yml" }, "workflow"],
    [{ gitRef: "refs/heads/main" }, "workflow"],
    [{ gitCommit: "f".repeat(40) }, "commit"],
  ] as const) {
    const { response } = fixture(overrides);
    await expect(
      verifyProvenance(
        policy,
        (async () => response) as unknown as typeof fetch,
        async () => undefined,
      ),
    ).rejects.toThrow(error);
  }
});

test("an unsigned or invalid bundle is never policy-accepted", async () => {
  const { response } = fixture();
  await expect(
    verifyProvenance(policy, (async () => response) as unknown as typeof fetch, async () => {
      throw new Error("cryptographic verification failed");
    }),
  ).rejects.toThrow("cryptographic verification failed");
});
