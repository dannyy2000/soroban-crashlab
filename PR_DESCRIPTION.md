Closes #438

## Summary

Defines the dependency update security control path for changelog review, rollback planning, and post-update validation. The policy is documented in the security policy, contributor guide, and maintainer playbook, with a focused policy test that verifies the documented review and rollback requirements without manual guesswork.

## What changed

- Added dependency update review and rollback policy to `.github/SECURITY.md`, including required control path, timelines, known risks, and mitigation boundaries.
- Added contributor guidance for dependency update scope, changelog review, rollback planning, and validation evidence in `CONTRIBUTING.md`.
- Added maintainer review and rollback requirements to `MAINTAINER_WAVE_PLAYBOOK.md`, including the dependency-policy verification command.
- Added `dependency-update-policy.ts` with a pure evaluator for review readiness, rollback requirements, validation commands, and security-response timelines.
- Added `dependency-update-policy.test.ts` to cover the primary ready-for-review flow plus a lockfile-only edge case.
- Updated the existing security policy documentation test coverage to check dependency update policy links and validation guidance.
- Wired the focused policy test into `npm run test` and CI.

## Validation

```bash
rg -n "TODO|TBD" README.md CONTRIBUTING.md MAINTAINER_WAVE_PLAYBOOK.md .github/SECURITY.md || true
```

Expected: no unresolved placeholder output.

```bash
cd apps/web
npm run test:policy
npm run test
```

Expected: policy checks pass, including the primary changelog-reviewed path, lockfile-only edge behavior, and documentation cross-links.

```bash
cd apps/web
npm run lint
npm run build
```

Expected: frontend lint/build remain green for impacted surfaces.

## Local Output Summary

- `rg -n "TODO|TBD" README.md CONTRIBUTING.md MAINTAINER_WAVE_PLAYBOOK.md .github/SECURITY.md || true`: no output.
- `git diff --check`: passed.
- `jq empty apps/web/package.json`: passed.
- `ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); puts "ci yaml ok"'`: `ci yaml ok`.
- `cd apps/web && nvm use 22 && npm ci`: passed on Node `v22.22.2` / npm `10.9.7` (install completed; npm reported `1 high severity vulnerability` in the dependency tree).
- `cd apps/web && nvm use 22 && npm run test:policy`: passed (`dependency-update-policy.test.ts: all assertions passed`).
- `cd apps/web && nvm use 22 && npm run test`: passed (all 7 lightweight test files, including `dependency-update-policy.test.ts`).
- `cd apps/web && nvm use 22 && npm run lint`: failed on pre-existing baseline issues in unrelated files (for example `add-a-fuzzy-query-builder-page-51.tsx`, `campaign-milestone-timeline-55.tsx`, `implement-run-detail-modal-component.tsx`, and `integrate-sentry-integration-for-crash-reporting.tsx`).
- `cd apps/web && nvm use 22 && npm run build`: started, warned about multiple lockfiles and inferred root selection, then stalled in Next.js compile stage with no stage progress for several minutes. The build was stopped after it stopped advancing.

## Notes for Maintainers

- Review the PR description for the upstream changelog or release-notes summary before approving.
- Do not merge without a rollback path that names the previous known-good version and revert method.
- Lockfile-only updates still require transitive package review before approval.
