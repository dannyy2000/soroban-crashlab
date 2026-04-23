# Security Policy

## Supported Versions

Only the latest commit on `main` is actively maintained. There are no versioned releases at this time.

| Branch | Supported |
|--------|-----------|
| `main` | ✅ Yes    |
| older  | ❌ No     |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

To report a vulnerability, please use one of the following private channels:

- **GitHub private vulnerability reporting**: Use the [Security tab → "Report a vulnerability"](../../security/advisories/new) button in this repository. This is the preferred path.
- **Email**: If GitHub private reporting is unavailable, email the maintainers directly. Contact details are listed in [`FUNDING.json`](../FUNDING.json) or the repository profile.

### What to include

A useful report includes:

- A clear description of the vulnerability and its potential impact
- Steps to reproduce or a minimal proof-of-concept
- Affected component(s) (e.g., `crashlab-core`, `apps/web`, CI scripts)
- Any suggested mitigations or patches, if available

### Response expectations

| Step | Target timeline |
|------|----------------|
| Acknowledgement of report | 48 hours |
| Initial triage and severity assessment | 5 business days |
| Fix or mitigation plan communicated to reporter | 14 days |
| Public disclosure (coordinated with reporter) | 90 days from report, or sooner if fix is ready |

We follow a **coordinated disclosure** model. We ask reporters to keep details private until a fix is available or the 90-day window closes, whichever comes first. We will credit reporters in the advisory unless they prefer to remain anonymous.

## Dependency Update Review and Rollback

Upstream dependency vulnerabilities should still be reported upstream, but dependency version changes and lockfile updates proposed in this repository are security-sensitive changes and must follow a documented review and rollback path.

### Required control path

1. Keep each dependency update PR scoped to the dependency family, advisory, or package set being changed. Avoid unrelated refactors in the same PR.
2. Review the upstream changelog, release notes, and any relevant advisory for every version hop. Summarize breaking changes, removed APIs, and security-relevant notes in the PR description.
3. Document a rollback plan before merge. Include the previous known-good version, the expected rollback trigger, and the revert path (for example: revert commit, restore manifest + lockfile, or re-pin the prior version).
4. Run the post-update validation checklist for the affected surfaces only and include a command output summary in the PR. For web dependency updates, use `cd apps/web && npm run test:policy && npm run test && npm run lint && npm run build`. For core dependency updates, use `cd contracts/crashlab-core && cargo test --all-targets`.
5. If changelog or release-note review is incomplete, validation fails, or the rollback path is ambiguous, do not merge. Escalate to another maintainer within the standard review window.

### Timelines

- Standard dependency update PRs use the Wave review timers: first maintainer review within **24 hours**, escalation to any available maintainer at **36 hours**.
- Dependency updates responding to a private vulnerability report keep the disclosure timers in this policy: acknowledgement within **48 hours**, initial triage and severity assessment within **5 business days**, and fix or mitigation plan within **14 days**.

### Known risks and mitigation boundaries

- Upstream changelogs and release notes can omit transitive or packaging-level changes. Mitigation: reviewers must inspect manifest and lockfile diffs together and hold merge when the dependency set is unclear.
- Lockfile-only updates can hide meaningful transitive version shifts. Mitigation: identify the changed transitive packages and review their upstream release notes before approval.
- A repository rollback restores our manifest and lockfile state, but it does not undo already-published upstream compromises or previously downloaded artifacts. Mitigation: pair rollback with upstream advisory tracking and any required downstream disclosure.

## Scope

This policy covers:

- `contracts/crashlab-core` — Rust fuzzing and reproducibility crate
- `apps/web` — Next.js frontend dashboard
- CI/CD configuration under `.github/workflows`
- Scripts under `scripts/`

Out of scope: vulnerabilities in third-party dependencies themselves (report those upstream), and issues that require physical access to infrastructure. In scope for this repository: review, rollback, and validation requirements for dependency updates proposed here.

## Known Gaps and Accepted Risks

See the [Operational Security Assumptions](../MAINTAINER_WAVE_PLAYBOOK.md#operational-security-assumptions) section of the Maintainer Wave Playbook for a documented list of known gaps and accepted residual risks.
