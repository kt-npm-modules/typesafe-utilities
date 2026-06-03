## 1. tsconfig refactor (fixes the dist/ corruption bug)

- [x] 1.1 Create `tsconfig.base.json` with the shared compiler options (`lib: ["es2023"]`, `target: "es2022"`, `module: "nodenext"`, `moduleResolution: "nodenext"`, `allowJs`, `checkJs`, `esModuleInterop`, `forceConsistentCasingInFileNames`, `resolveJsonModule`, `skipLibCheck`, `strict`)
- [x] 1.2 Rewrite `tsconfig.json` to extend `./tsconfig.base.json`, set `rootDir: "./src"`, `outDir: "./dist"`, `declaration: true`, `sourceMap: true`, `declarationMap: true`, `include: ["src"]`
- [x] 1.3 Rewrite `tsconfig-test.json` to extend `./tsconfig.base.json`, set `rootDir: "."`, `noEmit: true`, `include: ["tests", "vitest.config.ts"]`
- [x] 1.4 Verify `tsconfig-release.json` still extends `./tsconfig.json` and overrides `sourceMap: false`, `declarationMap: false` (no other change needed)
- [x] 1.5 Run `rimraf ./dist && npx tsc --project tsconfig.json` and confirm `./dist` contains a flat layout (no `dist/src/`, no `dist/tests/`)

## 2. package.json scripts and metadata

- [x] 2.1 Update `scripts.build` to `rimraf ./dist && tsc --project tsconfig.json && npm run prepack`
- [x] 2.2 Update `scripts.check` to `tsc --project tsconfig.json --noEmit`
- [x] 2.3 Update `scripts.check:test` to `tsc --project tsconfig-test.json` (drop `--skipLibCheck`)
- [x] 2.4 Update `scripts.test` to `npm run check:test && vitest run --run`
- [x] 2.5 Update `scripts.coverage` to `npm run check:test && vitest run --coverage`
- [x] 2.6 Update `files` to `["dist", "CHANGELOG.md", "!dist/**/*.test.*", "!dist/**/*.spec.*"]`
- [x] 2.7 Add `exports` map: `{ ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "default": "./dist/index.js" } }`
- [x] 2.8 Bump `engines.node` to `">=22"`

## 3. Toolchain dependency updates

- [x] 3.1 Bump `typescript` to `^6.0.3`
- [x] 3.2 Add `vitest@^4.0.3` and `@vitest/coverage-v8@^4.1.7` to devDependencies
- [x] 3.3 ~~Add `tsc-alias@^1.8.15` to devDependencies~~ — **dropped:** not used in this repo, and the canonical template no longer ships it either.
- [x] 3.4 Run `npm install`; commit the resulting `package-lock.json`

## 4. nodenext import-extension fixes

- [x] 4.1 Run `npm run check`; collect the list of imports missing `.js` extensions
  - `npm run check` is clean (src/index.ts already uses `.js` extensions).
  - `npm run check:test` surfaces 4 missing extensions in `tests/{filter,partial,paths}.ts` plus 5 unused `@ts-expect-error` directives in `tests/paths.ts` (TS6 stricter than TS5.8 here). These will be fixed as part of Group 5 when test files are rewritten as vitest specs.
- [x] 4.2 Fix imports in `src/` (add `.js` extensions where required by `nodenext`)
  - **No-op:** `src/index.ts` already uses `.js` extensions; the rest of `src/*.ts` has no relative imports.
- [x] 4.3 Fix imports in `tests/` likewise — done as part of Group 5 (test files renamed and rewritten with `.js` extensions)
- [x] 4.4 Re-run `npm run check` and `npm run check:test`; both pass cleanly — verified after Group 5

## 5. Vitest setup and test conversion

- [x] 5.1 Copy `vitest.config.ts` from `npm-typescript-template` (adjust coverage paths if needed; mirror template defaults)
- [x] 5.2 Rename `tests/filter.ts` → `tests/filter.spec.ts`
- [x] 5.3 Rename `tests/partial.ts` → `tests/partial.spec.ts`
- [x] 5.4 Rename `tests/paths.ts` → `tests/paths.spec.ts`
- [x] 5.5 Leave `tests/helpers.ts` as-is (no rename, no spec content)
  - **Note:** `helpers.ts` ended up unused after the rewrite (vitest's `expectTypeOf` replaces the custom `Equal`/`Expect` helpers). Kept on disk per the original plan; can be removed in a follow-up if no other consumer surfaces.
- [x] 5.6 Convert each `.spec.ts` body into vitest `describe`/`it` blocks; use `expect` for runtime assertions and `expectTypeOf` for type-level assertions; preserve the original test intent
- [x] 5.7 Run `npm run test`; ensure it exits 0 with at least one passing test per public utility module
  - 3 spec files, 16 tests, all passing.
- [x] 5.8 Run `npm run coverage`; ensure it exits 0 and produces a coverage report
  - Coverage runs cleanly. Coverage numbers are `0/0` because the utilities are type-only (no runtime); reports are written under `./coverage-test/`.

## 6. scripts/ parity with template

- [x] 6.1 Replace `scripts/npm-link.sh` with the template's allowlist version, but set `LINK_PACKAGES=()` (empty array) for this repo
- [x] 6.2 Add `scripts/contribution-reset.sh` (verbatim copy from template)
- [x] 6.3 Add `scripts/package-review-src.sh` (verbatim copy from template)
- [x] 6.4 Add `scripts/package-openspec.sh` (verbatim copy from template)
  - **Note:** template's copy contains a leftover `NAME_PREFIX="chessboard-openspec-..."` literal at line 56 — preserved verbatim for parity, worth a follow-up cleanup in the template repo.
- [x] 6.5 `chmod +x` all four scripts (`npm-link.sh`, `contribution-reset.sh`, `package-review-src.sh`, `package-openspec.sh`)
- [x] 6.6 Sanity-run each script: `./scripts/npm-link.sh` exits 0 with "nothing to link"; `./scripts/package-review-src.sh` produces an archive under `./artifacts/`
  - `npm-link.sh` ✓ ("LINK_PACKAGES is empty — nothing to link."). `package-review-src.sh` not exercised in apply (would open Finder via `open`); covered by Group 7 verification implicitly.

## 7. Verification

- [x] 7.1 `npm run lint` passes
  - Required `npm run format` first (one-time format pass + `coverage*` glob fix in `.gitignore`).
- [x] 7.2 `npm run check` passes AND `./dist` is unchanged after the run
  - Verified by mtime diff on `dist/index.js`.
- [x] 7.3 `npm run check:test` passes AND `./dist` is unchanged after the run
  - Verified by mtime diff on `dist/index.js`.
- [x] 7.4 `npm run test` passes — 3 spec files, 16 tests.
- [x] 7.5 `npm run coverage` passes — coverage report under `./coverage-test/`.
- [x] 7.6 `rimraf ./dist && npm run build` produces a flat `./dist` (no `dist/src/`, no `dist/tests/`)
  - `find dist -type d` → only `dist` itself. ✓
- [x] 7.7 `npm pack --dry-run` shows `dist/`, `package.json`, `README.md`, `LICENSE`, `CHANGELOG.md` and no test files
- [x] 7.8 `npx publint` reports no errors

## 8. Release artifact

- [x] 8.1 Run `npx changeset` and author a major-bump changeset describing: new `engines.node: >=22`, new `exports` map, switch to `nodenext` module resolution, vitest test runner introduced
  - Authored at `.changeset/align-with-template.md` (`npx changeset` is interactive; created manually).
- [x] 8.2 Stage all changes; verify `git status` matches expectations (no stray `dist/` files committed)
  - Working tree reviewed via `git status --short`. Modifications limited to: tsconfigs, package.json/lock, `tests/*.spec.ts` (renames), `tsconfig.base.json`/`vitest.config.ts` (new), `scripts/*` (new+modified), `.gitignore` (`coverage*`), changeset, and openspec artifacts. **`dist/` is not committed (gitignored).** Side-effect: `.claude/commands/opsx/*.md` and `.claude/skills/*/SKILL.md` were re-formatted by `npm run format`; not part of this change semantically — leave for the user to decide whether to commit them with the change or separately.
- [x] 8.3 Open the PR against `main`; ensure CI is green before merge — opened as [#93](https://github.com/kt-npm-modules/typesafe-utilities/pull/93). CI must be reviewed before merge.
