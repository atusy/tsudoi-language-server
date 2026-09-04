# Publish Synchronized npm Alpha Packages

|                     |                                       |
| ------------------- | ------------------------------------- |
| **Status**          | proposed                              |
| **Date**            | 2026-09-05                            |
| **Decision-makers** | Project stakeholder and maintainers   |
| **Consulted**       | npm publication and package contracts |
| **Informed**        | Package consumers                     |

## Context and Problem Statement

Tsudoi is distributed from a checkout even though its framework and handlers are already shaped as
npm packages. The framework is private, every package is versioned `0.0.0`, and handlers mark the
framework peer optional only to avoid an install-time registry lookup for a package that does not
exist. An alpha release needs one reproducible version set, a safe first-publication route, and a
credential-free route for later releases.

## Decision Drivers

- A consumer must be able to install the same artifacts under Bun and Deno.
- A handler must not claim that the framework it imports is optional.
- The initial release must not accidentally acquire npm's `latest` dist-tag.
- Publication must use the artifacts that passed the repository's release checks.
- Recurring publication must not depend on a stored, long-lived npm token.
- The irreversible first publication must remain an explicit maintainer action protected by 2FA.

## Considered Options

1. Publish every package as one synchronized alpha set, bootstrap manually, then use trusted
   publishing.
2. Publish only the framework and leave handlers installable from repository tarballs.
3. Publish each package independently whenever it changes.
4. Use a long-lived npm automation token for every release, including the bootstrap.

## Decision Outcome

**Chosen option**: "Publish every package as one synchronized alpha set, bootstrap manually, then
use trusted publishing", because one version identifies a tested combination and lets every handler
declare the real framework peer without an optionality exception.

The first set is `0.1.0-alpha.0`. Every public package carries `publishConfig.access = public` and
`publishConfig.tag = alpha`; every handler requires exactly the framework version in that set. The
workspace root stays private and unpublished.

The initial release is packed and checked from the merged release commit, then published in build
order with an interactive npm session and 2FA. The framework is first because every handler names
it as a required peer. Later releases use the repository's `publish.yml` through npm Trusted
Publishing, GitHub's `npm` environment, and short-lived OIDC credentials.

### Consequences

**Positive:**

- `bun add` and `deno add npm:` can obtain the same compiled package set from npm.
- Required peer metadata now agrees with the handlers' runtime and type-level imports.
- The alpha tag prevents an experimental release from becoming the default install.
- Trusted Publishing removes a reusable npm secret from GitHub Actions.

**Negative:**

- A change to any public package version requires updating the whole set.
- The first release is manual and therefore does not carry trusted-publishing provenance.
- Each npm package needs its own Trusted Publisher configuration after bootstrap.

**Neutral:**

- Git tags identify release commits, while npm dist-tags identify the consumer channel.
- The private workspace root retains its unrelated `0.0.0` version.

### Confirmation

Repository tests must reject mismatched public versions, optional framework peers, non-public or
non-alpha publish configuration, stale package artifacts, and a release workflow that publishes a
different commit from the requested alpha tag. A release candidate must pass the Definition of Done
and package-install smoke tests under Bun and Deno before publication. After the first publication,
registry probes must verify versions, dist-tags, package metadata, and both installation routes.

## Pros and Cons of the Options

### Synchronized alpha set with manual bootstrap and trusted publishing

- Good, because one version denotes one verified package graph.
- Good, because no permanent publishing credential is stored in GitHub.
- Bad, because unchanged packages are republished for each synchronized alpha.

### Publish only the framework

- Good, because it minimizes the first release surface.
- Bad, because documented handler imports still require checkout-built tarballs.
- Bad, because the knowingly false optional-peer metadata remains necessary.

### Independently version every package

- Good, because a package changes version only when its own artifact changes.
- Bad, because compatibility has no single tested-set identifier during the alpha phase.
- Bad, because release ordering and peer ranges become a second evolving policy.

### Long-lived automation token

- Good, because it can bootstrap packages from CI.
- Bad, because a reusable write credential must be stored, rotated, and protected.
- Bad, because compromise outlives one workflow run.
