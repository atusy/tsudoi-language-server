import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

globalThis.fetch = (async (input: string | URL | Request) => {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  const releaseDirectory = process.env.RELEASE_DIR;
  const repositoryRoot = process.env.REPO_ROOT;
  const gitRef = process.env.GITHUB_REF;
  const gitCommit = process.env.GITHUB_SHA;
  if (
    releaseDirectory === undefined ||
    repositoryRoot === undefined ||
    gitRef === undefined ||
    gitCommit === undefined
  ) {
    return new Response("missing fake attestation environment", { status: 500 });
  }
  const release = JSON.parse(
    readFileSync(join(releaseDirectory, "release-manifest.json"), "utf8"),
  ) as {
    readonly packages: readonly {
      readonly name: string;
      readonly version: string;
      readonly filename: string;
    }[];
  };
  const decodedPath = decodeURIComponent(url.pathname);
  const entry = release.packages.find((candidate) =>
    decodedPath.endsWith(`/${candidate.name}@${candidate.version}`),
  );
  if (entry === undefined) return new Response("unknown package", { status: 404 });
  const sha512 = createHash("sha512")
    .update(readFileSync(join(releaseDirectory, entry.filename)))
    .digest("hex");
  const repository = "https://github.com/atusy/tsudoi-language-server";
  const statement = {
    _type: "https://in-toto.io/Statement/v1",
    subject: [
      {
        name: `pkg:npm/%40${entry.name.slice(1)}@${entry.version}`,
        digest: { sha512 },
      },
    ],
    predicateType: "https://slsa.dev/provenance/v1",
    predicate: {
      buildDefinition: {
        buildType: "https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1",
        externalParameters: {
          workflow: {
            ref: process.env.BAD_SOURCE_REF === "1" ? "refs/heads/main" : gitRef,
            repository,
            path: ".github/workflows/publish.yml",
          },
        },
        resolvedDependencies: [
          {
            uri: `git+${repository}@${gitRef}`,
            digest: { gitCommit },
          },
        ],
      },
    },
  };
  return Response.json({
    attestations: [
      {
        predicateType: "https://slsa.dev/provenance/v1",
        bundle: {
          dsseEnvelope: {
            payloadType: "application/vnd.in-toto+json",
            payload: Buffer.from(JSON.stringify(statement)).toString("base64"),
          },
        },
      },
    ],
  });
}) as typeof fetch;
