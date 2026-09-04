const SLSA_PROVENANCE = "https://slsa.dev/provenance/v1";
const GITHUB_ACTIONS_BUILD =
  "https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1";
const IN_TOTO_PAYLOAD = "application/vnd.in-toto+json";

export interface ProvenancePolicy {
  readonly packageName: string;
  readonly version: string;
  readonly sha512: string;
  readonly attestationUrl: string;
  readonly repository: string;
  readonly workflowPath: string;
  readonly gitRef: string;
  readonly gitCommit: string;
}

function object(value: unknown, subject: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${subject} is not an object`);
  }
  return value as Record<string, unknown>;
}

function array(value: unknown, subject: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`${subject} is not an array`);
  return value;
}

export async function verifyProvenance(
  policy: ProvenancePolicy,
  fetcher: typeof fetch = fetch,
  bundleVerifier: (bundle: Bundle) => Promise<unknown> = verifyBundle,
): Promise<void> {
  const response = await fetcher(policy.attestationUrl, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`attestation endpoint returned ${response.status}`);
  }
  const document = object(await response.json(), "attestation response");
  const attestations = array(document.attestations, "attestation response.attestations");
  const candidate = attestations.find(
    (value) => object(value, "attestation").predicateType === SLSA_PROVENANCE,
  );
  if (candidate === undefined) throw new Error("attestation response has no SLSA v1 provenance");
  const bundle = object(object(candidate, "SLSA attestation").bundle, "SLSA attestation.bundle");
  await bundleVerifier(bundle as Bundle);
  const envelope = object(bundle.dsseEnvelope, "SLSA attestation.bundle.dsseEnvelope");
  if (envelope.payloadType !== IN_TOTO_PAYLOAD || typeof envelope.payload !== "string") {
    throw new Error("SLSA attestation does not contain an in-toto payload");
  }

  let statement: Record<string, unknown>;
  try {
    statement = object(
      JSON.parse(Buffer.from(envelope.payload, "base64").toString("utf8")),
      "provenance statement",
    );
  } catch (cause) {
    throw new Error(`cannot decode the provenance statement: ${String(cause)}`);
  }
  if (statement.predicateType !== SLSA_PROVENANCE) {
    throw new Error("provenance statement is not SLSA v1");
  }
  const expectedSubject = `pkg:npm/${policy.packageName.startsWith("@") ? `%40${policy.packageName.slice(1)}` : policy.packageName}@${policy.version}`;
  const subjectMatches = array(statement.subject, "provenance statement.subject").some((value) => {
    const subject = object(value, "provenance subject");
    const digest = object(subject.digest, "provenance subject.digest");
    return subject.name === expectedSubject && digest.sha512 === policy.sha512;
  });
  if (!subjectMatches) throw new Error("provenance subject does not match the retained tarball");

  const predicate = object(statement.predicate, "provenance statement.predicate");
  const build = object(predicate.buildDefinition, "provenance buildDefinition");
  if (build.buildType !== GITHUB_ACTIONS_BUILD) {
    throw new Error("provenance was not produced by the GitHub Actions build type");
  }
  const external = object(build.externalParameters, "provenance externalParameters");
  const workflow = object(external.workflow, "provenance workflow");
  if (
    workflow.repository !== policy.repository ||
    workflow.path !== policy.workflowPath ||
    workflow.ref !== policy.gitRef
  ) {
    throw new Error("provenance workflow does not match the release policy");
  }
  const dependencyMatches = array(
    build.resolvedDependencies,
    "provenance resolvedDependencies",
  ).some((value) => {
    const dependency = object(value, "provenance resolved dependency");
    const digest = object(dependency.digest, "provenance resolved dependency.digest");
    return (
      dependency.uri === `git+${policy.repository}@${policy.gitRef}` &&
      digest.gitCommit === policy.gitCommit
    );
  });
  if (!dependencyMatches) throw new Error("provenance commit does not match the release policy");
}
import { type Bundle, verify as verifyBundle } from "sigstore";
