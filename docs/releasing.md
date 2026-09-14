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
test "$(node --version)" = "v24.20.0"
test "$(npm --version)" = "11.19.0"
test "$(bun --version)" = "1.3.13"
test "$(deno --version | awk 'NR == 1 { print $2 }')" = "2.9.4"
```

Only `oxlint` and `oxfmt` deliberately float to their latest versions. Stop before packing if a
pinned tool differs; do not silently produce the bootstrap tarballs with another npm implementation.

## First release: maintainer bootstrap

`v0.1.0-alpha.0` is intentionally not reused: its tag CI exposed a nondeterministic test and failed
before any package was published. The tag remains an immutable failure record, so the first npm
version is `0.1.0-alpha.1`.

Run the bootstrap only after the release pull request is merged. Start from the merged commit on a
clean `main`, not from the pull-request branch:

```sh
git switch main
git pull --ff-only origin main
git status --short
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
npm whoami --registry=https://registry.npmjs.org/
bun install --frozen-lockfile
bun add --global oxlint@latest oxfmt@latest
bun run check
release_dir="$(mktemp -d)"
bun run scripts/pack-release.ts "$release_dir"
git tag -a v0.1.0-alpha.1 -m "v0.1.0-alpha.1"
git push origin v0.1.0-alpha.1
```

`git status --short` must print nothing. Wait for the tag's CI run to pass before continuing. Keep
`release_dir` and the same terminal: those are the tarballs that passed locally. The release
manifest lists the framework first and records every tarball's SHA-256.

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
metadata, the synchronized `alpha` tags, and the bootstrap `latest` tags. The smoke
test then installs all seven packages through `alpha` into isolated, empty Bun and Deno consumers,
checks that every resolved version matches the retained release manifest, and completes an LSP
initialize, document completion, shutdown, and clean exit under both runtimes. The first release
cannot be verified this way beforehand because the package names do not yet exist in the registry.

The npm registry's
[package metadata contract](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md)
requires every package to expose a `latest` dist-tag. Even though bootstrap explicitly published
with `--tag alpha`, the registry assigned `latest` to `0.1.0-alpha.1` because no previous version
existed; it cannot be left absent. Registry verification therefore requires `alpha` to name the
release being checked and `latest` to remain frozen at `0.1.0-alpha.1` throughout the alpha phase.
An unqualified install gets that bootstrap version; use `@alpha` for the current alpha.
The publisher checks this frozen `latest` policy for every package before its first registry write.
Retire or revise the alpha workflow before a stable release intentionally advances `latest`.

## Enable Trusted Publishing

After all seven packages exist, a maintainer configures each package in npm's **Settings > Trusted
Publisher** with these exact values:

- Provider: GitHub Actions
- Organization or user: `atusy`
- Repository: `tsudoi-language-server`
- Workflow filename: `publish.yml`
- Environment: `npm`
- Allowed actions: `npm publish`

In the GitHub repository, create or review the `npm` environment, require an appropriate reviewer,
and set **Deployment branches and tags** to **Selected branches and tags** with only the
`v*-alpha.*` tag pattern and no branch pattern. Add a repository ruleset that restricts creation and
update of those tags to release maintainers. These controls are separate: the ruleset protects the
tag, while the environment policy prevents a release ref outside the allowed tag pattern from
requesting npm deployment approval and OIDC credentials. Do not add an npm token to repository or
environment secrets. The workflow requests `id-token: write` and uses npm Trusted Publishing's
short-lived OIDC credential. See npm's
[Trusted Publishing documentation](https://docs.npmjs.com/trusted-publishers/) and GitHub's
[deployment environment documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments).

After the first OIDC release succeeds, verify that its unprivileged post-publish job reports SLSA
provenance for all seven packages and passes `npm audit signatures`. Then open **Settings >
Publishing access** for every package, select **Require two-factor authentication and disallow
tokens**, and revoke any now-unused automation or publish tokens from the npm account. Do this only
after OIDC has worked: npm accepts traditional authentication alongside a trusted publisher until
the package setting explicitly disables it.

## Later alpha releases

Prepare a synchronized version bump in a pull request and merge it. From the clean merged `main`,
create and push the matching tag, wait for its CI run to pass, then publish the matching GitHub
prerelease:

```sh
git switch main
git pull --ff-only origin main
git status --short
test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"
release_version="$(node -p "require('./packages/tsudoi-language-server/package.json').version")"
release_tag="v${release_version}"
git tag -a "$release_tag" -m "$release_tag"
git push origin "$release_tag"
gh release create "$release_tag" --verify-tag --prerelease --latest=false --generate-notes
release_commit="$(git rev-parse "$release_tag^{commit}")"
# Repeat gh run list if the release workflow has not appeared yet.
run_id="$(gh run list --workflow publish.yml --event release --commit "$release_commit" --limit 1 --json databaseId --jq '.[0].databaseId')"
test -n "$run_id"
gh run watch "$run_id" --exit-status
```

Approve the `npm` environment deployment after inspecting the requested tag. The workflow itself is
triggered by the GitHub `release.published` event so npm's provenance names the release ref and
commit. The job requires the release to be a prerelease and checks that the event ref, event commit,
checked-out commit, tag, and package version agree. An unprivileged
runner checks out the immutable release commit, installs the latest `oxlint` and `oxfmt`, and runs
`bun run check`, including tests under Bun and Deno. After that succeeds, a fresh runner checks out
the same commit and uses locked dependencies to pack a checksummed release; no floating Ox
executable runs on the filesystem that produces the release bundle. That bundle contains only
tarballs, their manifest, and checksums—never producer-generated executable code. The OIDC job
checks out the same release commit, installs lockfile-bound dependencies with lifecycle scripts
disabled, and runs the reviewed publisher source against that data-only bundle. Re-running the job
is safe only for registry artifacts whose integrity matches the freshly packed tarballs; any other
existing artifact is refused. A separate unprivileged job then verifies registry metadata, requires
each package's SLSA provenance,
cryptographically checks the exact installed release with `npm audit signatures`, and policy-checks
the signed subject, repository, workflow path, tag ref, and commit before running the same fresh Bun
and Deno consumer smoke test. The verification job has neither the `npm` environment nor OIDC
permission.

GitHub documents that `release.published` covers both stable releases and prereleases, including a
prerelease published from a draft; that is why the workflow also checks the event's `prerelease`
field instead of relying on the activity type alone. See GitHub's
[release event documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#release).

If a publish run fails after changing some packages, do not move or delete the tag, and do not
unpublish or recreate the GitHub Release. Rerun the failed jobs from that exact workflow run while
its one-day release bundle is retained, then watch the new attempt:

```sh
gh run rerun "$run_id" --failed
gh run watch "$run_id" --exit-status
```

If the artifact has expired, `gh run rerun "$run_id"` reruns the whole workflow from the original
release ref and rebuilds it; the publisher will resume only where registry artifact integrity
matches. Verify the registry before preparing another version. The fixed workflow concurrency
group serializes up to GitHub's maximum queue of release runs, and the publisher refuses to move an
`alpha` dist-tag to the same or an older version.
