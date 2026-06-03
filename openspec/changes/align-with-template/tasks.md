## 1. tsconfig refactor (fixes the dist/ corruption bug)

- [ ] 1.1 Create `tsconfig.base.json` with the shared compiler options (`lib: ["es2023"]`, `target: "es2022"`, `module: "nodenext"`, `moduleResolution: "nodenext"`, `allowJs`, `checkJs`, `esModuleInterop`, `forceConsistentCasingInFileNames`, `resolveJsonModule`, `skipLibCheck`, `strict`)
- [ ] 1.2 Rewrite `tsconfig.json` to extend `./tsconfig.base.json`, set `rootDir: "./src"`, `outDir: "./dist"`, `declaration: true`, `sourceMap: true`, `declarationMap: true`, `include: ["src"]`
- [ ] 1.3 Rewrite `tsconfig-test.json` to extend `./tsconfig.base.json`, set `rootDir: "."`, `noEmit: true`, `include: ["tests", "vitest.config.ts"]`
- [ ] 1.4 Verify `tsconfig-release.json` still extends `./tsconfig.json` and overrides `sourceMap: false`, `declarationMap: false` (no other change needed)
- [ ] 1.5 Run `rimraf ./dist && npx tsc --project tsconfig.json` and confirm `./dist` contains a flat layout (no `dist/src/`, no `dist/tests/`)

## 2. package.json scripts and metadata

- [ ] 2.1 Update `scripts.build` to `rimraf ./dist && tsc --project tsconfig.json && npm run prepack`
- [ ] 2.2 Update `scripts.check` to `tsc --project tsconfig.json --noEmit`
- [ ] 2.3 Update `scripts.check:test` to `tsc --project tsconfig-test.json` (drop `--skipLibCheck`)
- [ ] 2.4 Update `scripts.test` to `npm run check:test && vitest run --run`
- [ ] 2.5 Update `scripts.coverage` to `npm run check:test && vitest run --coverage`
- [ ] 2.6 Update `files` to `["dist", "CHANGELOG.md", "!dist/**/*.test.*", "!dist/**/*.spec.*"]`
- [ ] 2.7 Add `exports` map: `{ ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "default": "./dist/index.js" } }`
- [ ] 2.8 Bump `engines.node` to `">=22"`

## 3. Toolchain dependency updates

- [ ] 3.1 Bump `typescript` to `^6.0.3`
- [ ] 3.2 Add `vitest@^4.0.3` and `@vitest/coverage-v8@^4.1.7` to devDependencies
- [ ] 3.3 Add `tsc-alias@^1.8.15` to devDependencies
- [ ] 3.4 Run `npm install`; commit the resulting `package-lock.json`

## 4. nodenext import-extension fixes

- [ ] 4.1 Run `npm run check`; collect the list of imports missing `.js` extensions
- [ ] 4.2 Fix imports in `src/` (add `.js` extensions where required by `nodenext`)
- [ ] 4.3 Fix imports in `tests/` likewise
- [ ] 4.4 Re-run `npm run check` and `npm run check:test`; both pass cleanly

## 5. Vitest setup and test conversion

- [ ] 5.1 Copy `vitest.config.ts` from `npm-typescript-template` (adjust coverage paths if needed; mirror template defaults)
- [ ] 5.2 Rename `tests/filter.ts` → `tests/filter.spec.ts`
- [ ] 5.3 Rename `tests/partial.ts` → `tests/partial.spec.ts`
- [ ] 5.4 Rename `tests/paths.ts` → `tests/paths.spec.ts`
- [ ] 5.5 Leave `tests/helpers.ts` as-is (no rename, no spec content)
- [ ] 5.6 Convert each `.spec.ts` body into vitest `describe`/`it` blocks; use `expect` for runtime assertions and `expectTypeOf` for type-level assertions; preserve the original test intent
- [ ] 5.7 Run `npm run test`; ensure it exits 0 with at least one passing test per public utility module
- [ ] 5.8 Run `npm run coverage`; ensure it exits 0 and produces a coverage report

## 6. scripts/ parity with template

- [ ] 6.1 Replace `scripts/npm-link.sh` with the template's allowlist version, but set `LINK_PACKAGES=()` (empty array) for this repo
- [ ] 6.2 Add `scripts/contribution-reset.sh` (verbatim copy from template)
- [ ] 6.3 Add `scripts/package-review-src.sh` (verbatim copy from template)
- [ ] 6.4 Add `scripts/package-openspec.sh` (verbatim copy from template)
- [ ] 6.5 `chmod +x` all four scripts (`npm-link.sh`, `contribution-reset.sh`, `package-review-src.sh`, `package-openspec.sh`)
- [ ] 6.6 Sanity-run each script: `./scripts/npm-link.sh` exits 0 with "nothing to link"; `./scripts/package-review-src.sh` produces an archive under `./artifacts/`

## 7. Verification

- [ ] 7.1 `npm run lint` passes
- [ ] 7.2 `npm run check` passes AND `./dist` is unchanged after the run
- [ ] 7.3 `npm run check:test` passes AND `./dist` is unchanged after the run
- [ ] 7.4 `npm run test` passes
- [ ] 7.5 `npm run coverage` passes
- [ ] 7.6 `rimraf ./dist && npm run build` produces a flat `./dist` (no `dist/src/`, no `dist/tests/`)
- [ ] 7.7 `npm pack --dry-run` shows `dist/`, `package.json`, `README.md`, `LICENSE`, `CHANGELOG.md` and no test files
- [ ] 7.8 `npx publint` reports no errors

## 8. Release artifact

- [ ] 8.1 Run `npx changeset` and author a major-bump changeset describing: new `engines.node: >=22`, new `exports` map, switch to `nodenext` module resolution, vitest test runner introduced
- [ ] 8.2 Stage all changes; verify `git status` matches expectations (no stray `dist/` files committed)
- [ ] 8.3 Open the PR against `main`; ensure CI is green before merge
