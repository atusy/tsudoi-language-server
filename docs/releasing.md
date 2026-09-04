# Releasing npm Alpha Packages

This runbook separates repository work from npm and GitHub authority. The repository produces one
ordered, checksummed set of seven tarballs. A maintainer owns the irreversible publication,
two-factor authentication, and external trusted-publisher settings.

## Release prerequisites

Install `fish`, `xonsh`, and `zsh` with the platform package manager before running the release
suite. Use the same release toolchain as GitHub Actions, then verify it explicitly:

```sh
command -v fish
command -v xonsh
command -v zsh
test "$(node --version)" = "v24.10.0"
test "$(npm --version)" = "11.6.1"
test "$(bun --version)" = "1.3.13"
test "$(deno --version | awk 'NR == 1 { print $2 }')" = "2.9.4"
```

Only `oxlint` and `oxfmt` deliberately float to their latest versions. Stop before packing if a
pinned tool differs; do not silently produce the bootstrap tarballs with another npm implementation.

## First release: maintainer bootstrap

Run the bootstrap only after the release pull request is merged. Start from the merged commit on a
clean `main`, not from the pull-request branch:

```sh
git switch main
git pull --ff-only origin main
git status --short
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
gh workflow run publish.yml --ref main -f mode=bootstrap
npm whoami --registry=https://registry.npmjs.org/
bun install --frozen-lockfile
bun add --global oxlint@latest oxfmt@latest
bun run scripts/definition-of-done.ts
release_dir="$(mktemp -d)"
bun run scripts/pack-release.ts "$release_dir"
git tag -a v0.1.0-alpha.0 -m "v0.1.0-alpha.0"
git push origin v0.1.0-alpha.0
```

`git status --short` must print nothing. Wait for the bootstrap-only `publish.yml` run to succeed;
it exists solely to enable future tag-scoped API/CLI dispatches and has no checkout, environment, or
OIDC permission. Then wait for the tag's CI run to pass before continuing. Keep `release_dir` and
the same terminal: those are the tarballs that passed locally. The release manifest lists the
framework first and records every tarball's SHA-256.

Publishing is the maintainer's explicit, 2FA-protected action:

```sh
bun run scripts/publish-release.ts "$release_dir"
node scripts/verify-registry-release.ts "$release_dir"
node scripts/smoke-registry-release.ts "$release_dir"
```

The publisher checks every local SHA-256 before contacting npm. It also checks the SHA-512
integrity of any version already in the registry. A retry skips an already-published package only
when its registry artifact is byte-for-byte the same; a mismatch or a registry error stops the run
before another package is published. The read-only verifier then checks all seven registry
identities and versions, each retained tarball's integrity, public access, repository and exact peer
metadata, the synchronized `alpha` tags, and the absence of an accidental `latest` tag. The smoke
test then installs all seven packages through `alpha` into isolated, empty Bun and Deno consumers,
checks that every resolved version matches the retained release manifest, and completes an LSP
initialize, document completion, shutdown, and clean exit under both runtimes. The first release
cannot be verified this way beforehand because the package names do not yet exist in the registry.

## Enable Trusted Publishing

After all seven packages exist, a maintainer configures each package in npm's **Settings > Trusted
Publisher** with these exact values:

- Provider: GitHub Actions
- Organization or user: `atusy`
- Repository: `tsudoi-language-server`
- Workflow filename: `publish.yml`
- Environment: `npm`
- Allowed actions: `npm publish`

In the GitHub repository, create or review the `npm` environment and require an appropriate
reviewer before deployment. Add a repository ruleset that restricts creation and update of
`v*-alpha.*` tags to release maintainers. Do not add an npm token to repository or environment
secrets. The workflow requests `id-token: write` and uses npm Trusted Publishing's short-lived OIDC
credential. See npm's
[Trusted Publishing documentation](https://docs.npmjs.com/trusted-publishers/) and GitHub's
[deployment environment documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

## Later alpha releases

Prepare a synchronized version bump in a pull request and merge it. From the clean merged `main`,
create and push the matching tag, wait for CI, then dispatch the publishing workflow from that tag:

```sh
git switch main
git pull --ff-only origin main
git status --short
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
git tag -a v0.1.0-alpha.1 -m "v0.1.0-alpha.1"
git push origin v0.1.0-alpha.1
gh workflow run publish.yml --ref v0.1.0-alpha.1 -f mode=publish -f release-tag=v0.1.0-alpha.1
```

Approve the `npm` environment deployment after inspecting the requested tag. The workflow itself is
dispatched from that tag so npm's provenance names the release ref and commit. The job checks that
the event ref, event commit, checked-out commit, tag, and package version agree; installs the latest
`oxlint` and `oxfmt`; runs the complete Definition of Done under Bun and Deno; packs a fresh
checksummed release; and publishes through OIDC with provenance. Re-running the job is safe only for
registry artifacts whose integrity matches the freshly packed tarballs; any other existing artifact
is refused. A separate unprivileged job then verifies registry metadata and runs the same fresh Bun
and Deno consumer smoke test; it has neither the `npm` environment nor OIDC permission.

If a publish run fails after changing some packages, rerun that same tag immediately and verify the
registry before preparing another version. The fixed workflow concurrency group prevents two
release runs from publishing at the same time, and the publisher refuses to move an `alpha`
dist-tag to the same or an older version.
