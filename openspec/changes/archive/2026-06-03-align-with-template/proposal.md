## Why

`@ktarmyshov/typesafe-utilities` has drifted from the canonical `npm-typescript-template` and accumulated several issues that, together, make builds non-deterministic and risk publishing the wrong code.

The most severe is a build-output corruption: because `tsconfig.json` lacks `rootDir`, and the `check` / `check:test` scripts run `tsc` without `--noEmit`, multiple emit passes write into the same `./dist` with different inferred root directories. The on-disk evidence shows `dist/filter.js` (Mar 2026, flat — from a real `build`) sitting next to `dist/src/filter.js` and `dist/tests/filter.js` (May 2025, stale leftovers from earlier configs). A `check:test` run after a fresh `build` would silently overwrite the published source files with compiled test code. This must be fixed before the next release.

Alongside that we have small but real divergences from the template (no `exports`, missing `CHANGELOG.md` from `files`, outdated Node engine, outdated TypeScript, missing helper scripts, no real test runner) that we want to close in one pass while we have the build pipeline open.

## What Changes

- **BREAKING (publish surface)**: Add `exports` map (`./dist/index.{js,d.ts}`) to `package.json`. Today the package has no `main` and no `exports` — only `types`. Modern ESM consumers / bundlers may resolve differently after this change.
- **BREAKING (engines)**: Bump `engines.node` from `>=20.0.0` to `>=22`. Node 20 is EOL; consumers on Node 20 will get an `EBADENGINE` warning.
- **BREAKING (toolchain)**: Bump `typescript` to `^6.0.3` and switch `module` / `moduleResolution` to `nodenext`. Source imports may need explicit `.js` extensions; this is a contributor-facing change, not a runtime one for consumers.
- Fix `tsconfig.json` layout: extract a `tsconfig.base.json` (mirrors template), set `rootDir: "./src"` in `tsconfig.json`, set `noEmit: true` and `rootDir: "."` in `tsconfig-test.json`.
- Fix `package.json` scripts: `check` becomes `tsc --project tsconfig.json --noEmit`; `check:test` drops `--skipLibCheck` (config carries `noEmit`); `build` gets explicit `--project tsconfig.json`; `test` runs vitest; `coverage` runs vitest with coverage.
- Fix `package.json` `files`: `["dist", "CHANGELOG.md", "!dist/**/*.test.*", "!dist/**/*.spec.*"]` — drop no-op `!tests`, add `CHANGELOG.md` (npm does not auto-include it like README/LICENSE).
- Add real testing: introduce `vitest` + `@vitest/coverage-v8`, create `vitest.config.ts`, rename `tests/{filter,partial,paths}.ts` → `tests/{filter,partial,paths}.spec.ts` and add real assertions; keep `tests/helpers.ts` as-is.
- Add `tsc-alias` devDependency (template has it; harmless and keeps parity).
- Sync `scripts/` with template: replace `scripts/npm-link.sh` with the allowlist (`LINK_PACKAGES`) version; add `scripts/contribution-reset.sh`, `scripts/package-review-src.sh`, `scripts/package-openspec.sh`. Keep `scripts/push-update.sh`.
- No changes to the public API: `filter`, `partial`, `paths`, `record` exports remain identical.

## Capabilities

### New Capabilities

- `build-and-package`: Defines the build, type-check, test, and publish pipeline for the package — which TypeScript configurations exist and what each emits, what npm scripts must do, what files ship in the published tarball, what Node and toolchain versions are required.

### Modified Capabilities

(None. This is the first formal spec for this project; the public API specs of `filter`/`partial`/`paths`/`record` are out of scope here and are not changing.)

## Impact

- **Affected files**:
  - `package.json` (scripts, files, exports, engines, devDependencies)
  - `tsconfig.json`, `tsconfig-test.json`, `tsconfig-release.json` (refactor)
  - new `tsconfig.base.json`, new `vitest.config.ts`
  - `tests/*.ts` (rename + add assertions)
  - `src/*.ts` (possible `.js` extension additions in imports under `nodenext`)
  - `scripts/*.sh` (replace one, add three)
- **Affected APIs**: None at the type level. The `exports` field formalizes what was already the de-facto entry point.
- **Affected dependencies**: `typescript` 5.8 → 6.x; new: `vitest`, `@vitest/coverage-v8`, `tsc-alias`.
- **Consumers**: must be on Node ≥22. Module resolution path narrows to `dist/index.js` via `exports`.
- **CI**: existing GitHub workflows must keep passing; release workflow consumes `build:release`.
