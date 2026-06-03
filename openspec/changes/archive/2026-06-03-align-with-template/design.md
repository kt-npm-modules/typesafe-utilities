## Context

`@ktarmyshov/typesafe-utilities` is a published npm package providing type-safe utilities (`filter`, `partial`, `paths`, `record`). The repo predates the `npm-typescript-template` overhaul and has drifted from it. The most consequential drift is in the build pipeline:

- `tsconfig.json` has no `rootDir`, so `tsc` infers a root from `include: ["src"]`. Combined with `tsconfig-test.json` which only swaps `include` to `["tests"]` and inherits `outDir: "./dist"`, every emit pass writes a different shape into the same output directory.
- `package.json` `check` script runs bare `tsc --skipLibCheck` (no `--project`, no `--noEmit`) and `check:test` similarly omits `--noEmit`. Both happily emit `.js` / `.d.ts` files into `./dist` as a side effect of type-checking.
- `rimraf ./dist` only runs from `build` and `build:release`, so artifacts from older configs accumulate.

The consequences are visible on disk today:

```
dist/filter.js        Mar 30 2026   ← from a real `build` run (flat layout)
dist/src/filter.js    May 23 2025   ← stale; left from when rootDir was inferred as "."
dist/tests/filter.js  May 23 2025   ← stale; left from a `check:test` emit
```

Running `check:test` after `build` would silently overwrite `dist/*.js` with compiled test code. A subsequent `npm publish` (or `npm pack`) would ship that. This is the bug we have to fix; the rest of the work is closing the gap with the canonical template while we have the build pipeline open.

## Goals / Non-Goals

**Goals:**

- Make `./dist` deterministically reflect only the compiled `src/`.
- Make `check` and `check:test` pure type-check operations with zero side effects on the filesystem.
- Bring `tsconfig*`, `package.json` (scripts, files, exports, engines, devDependencies), `scripts/`, and the test setup into structural parity with `npm-typescript-template`.
- Introduce a real test runner (`vitest`) and convert the existing type-only test files into runnable specs.
- Establish `build-and-package` as the first formal capability spec for this repo.

**Non-Goals:**

- No changes to the public API of `filter`, `partial`, `paths`, `record`. Their behavior, types, and exported names stay identical.
- No new utility modules. This is a build-pipeline change, not a feature change.
- No CI/release workflow rewrite. We keep the existing GitHub workflows; they will continue to consume `build:release` and `changeset:*` scripts unchanged.
- No version-bump policy change. The changeset for this PR will be marked as a major bump (engines + exports + module-resolution are breaking) but the bump strategy itself is out of scope.

## Decisions

### D1. Use template's two-tier tsconfig (`tsconfig.base.json` + project configs)

Adopt the template's pattern verbatim:

```
tsconfig.base.json    ← lib/target/module/strict/etc., NO rootDir/outDir/include
tsconfig.json         ← extends base; rootDir: "./src", outDir: "./dist", emit on, include: ["src"]
tsconfig-test.json    ← extends base; rootDir: ".", noEmit: true, include: ["tests", "vitest.config.ts"]
tsconfig-release.json ← extends tsconfig.json; sourceMap/declarationMap off
```

- `rootDir: "./src"` in `tsconfig.json` is the load-bearing line that makes emit flat (`src/filter.ts → dist/filter.js`).
- `noEmit: true` in `tsconfig-test.json` is the load-bearing line that prevents `check:test` from polluting `./dist`.

**Alternatives considered:**

- Keep everything inline in `tsconfig.json` and `tsconfig-test.json`, just add the missing fields. Rejected: a base file is the canonical pattern in the rest of the npm-modules monorepo and we want parity for cross-repo diffs.
- Use `tsconfig.json` references / project-references mode. Rejected: overkill for this repo and not what the template does.

### D2. `check` and `check:test` are pure type-check; emit lives only in `build*`

```
check       → tsc --project tsconfig.json --noEmit
check:test  → tsc --project tsconfig-test.json    (config carries noEmit: true)
build       → rimraf ./dist && tsc --project tsconfig.json && npm run prepack
build:release → rimraf ./dist && tsc --project tsconfig-release.json && npm run prepack
```

The `--noEmit` is belt-and-braces: it's already implied by `tsconfig-test.json`, but spelling it out on `check` is what stops the bug today. `--skipLibCheck` is dropped from `check:test`; the base config already carries `skipLibCheck: true`.

### D3. Switch to `module: nodenext` / `moduleResolution: nodenext` (with TypeScript 6.x)

The template uses `nodenext` everywhere. This is a contributor-facing change: imports inside `src/` (and `tests/`) need explicit `.js` extensions when targeting `nodenext`. We will fix imports as part of this change; it's a small file and small surface (5 src files, 4 test files).

**Alternatives considered:**

- Stay on `esnext` / `node`. Rejected: diverges from template, and `nodenext` is the supported direction for ESM-only packages.

### D4. Add `exports` map; do not add `main`

```jsonc
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "default": "./dist/index.js"
  }
}
```

Today there is no `main` and no `exports` — only `types`. Modern bundlers / Node ESM resolution expect at least one of them. Adding `exports` (without `main`) is what the template does and what `publint` will accept for an ESM-only package. We treat this as a publish-surface breaking change and call it out in proposal + changeset.

**Alternatives considered:**

- Add legacy `main: "./dist/index.js"` alongside `exports`. Rejected: `exports` shadows it for any modern resolver; adding `main` is misleading.

### D5. Adopt `vitest` as the test runner

Mirror the template:

- `vitest`, `@vitest/coverage-v8` in devDependencies.
- `vitest.config.ts` at repo root (copy from template; coverage v8 config).
- Rename `tests/{filter,partial,paths}.ts → tests/{filter,partial,paths}.spec.ts`. Keep `tests/helpers.ts` (no rename — it's not a spec).
- Convert the bodies from type-only smoke tests into real `describe`/`it` specs with `expect` assertions. Where current files only assert types, use `expectTypeOf` from `vitest` to keep the type-level intent.

**Alternatives considered:**

- Keep type-only tests, only fix the build. Rejected by user; we want parity with the template.

### D6. `package.json` `files` mirrors template

```json
"files": ["dist", "CHANGELOG.md", "!dist/**/*.test.*", "!dist/**/*.spec.*"]
```

- Drop `!tests` (no-op: `tests/` was never in the whitelist).
- Add `CHANGELOG.md` (npm auto-includes README/LICENSE but **not** CHANGELOG).
- Keep test-file negative globs as belt-and-braces against future `dist/` mistakes.

### D7. `engines.node` → `>=22`

Node 20 is EOL as of mid-2025. Template is on `>=22`. Treat as a breaking change for consumers (will surface as `EBADENGINE` warning on Node 20).

### D8. `scripts/` parity, but no behavior change

Drop-in copies from template:

- Replace `scripts/npm-link.sh` (the auto-detect-all-deps version) with template's `LINK_PACKAGES` allowlist version. **Note:** the template version has a hard-coded `LINK_PACKAGES=("@mirasen/chessboard")` — for typesafe-utilities this should be the empty list `LINK_PACKAGES=()`, which makes the script a fast no-op. This is the only deviation from a verbatim copy.
- Add `scripts/contribution-reset.sh`, `scripts/package-review-src.sh`, `scripts/package-openspec.sh`.
- Keep `scripts/push-update.sh` (already aligned).

### D9. Add `tsc-alias` even though we don't currently use path aliases

Template has it. It's a tiny dev dep. Including it removes a difference and lets future path-alias work happen without another devDep PR.

## Risks / Trade-offs

- **[Risk] `nodenext` resolution forces `.js` extensions in source imports** → Mitigation: enumerate all imports in `src/` and `tests/` during implementation; `tsc --noEmit` against the new config will surface every miss.
- **[Risk] `exports` map narrows resolution and could break existing consumers who reach into internal paths (`@ktarmyshov/typesafe-utilities/dist/...`)** → Mitigation: spot-check current consumers in the npm-modules workspace (`assert`, `digraph-js`, etc.) for deep imports; `exports` only exposes `.`. If any consumer reaches in, add a subpath export. Realistic blast radius: 0 — this package's consumers are all owned by the same maintainer.
- **[Risk] vitest 4.x + coverage-v8 4.x version compatibility** → Mitigation: pin to the same versions the template uses (`^4.0.3` and `^4.1.7` respectively); if the template builds, this will too.
- **[Risk] TypeScript 6.x deprecations / removed flags** → Mitigation: the template is already on 6.x; copy its base config wholesale. Run `npm run check` and `npm run lint` before declaring done.
- **[Risk] Stale `dist/` already on disk** → Mitigation: implementation includes a deliberate `rimraf ./dist` and a `npm run build` followed by `npm pack --dry-run` to verify the tarball.
- **[Trade-off] Treating this as a major version bump** → Three breaking-flavored changes (engines, exports, module-resolution-affecting-contributors). Better to consolidate into one major bump than spread across three minors.

## Migration Plan

1. **Branch**: work on the existing `contribution` branch (default for this repo).
2. **Sequence** (each step independently verifiable):
   1. Create `tsconfig.base.json`, refactor `tsconfig.json` and `tsconfig-test.json`. Run `rimraf ./dist && npm run build`. Verify flat layout in `./dist`.
   2. Run `npm run check` and `npm run check:test`. Confirm `./dist` is unchanged after both.
   3. Update `package.json` scripts, files, exports, engines.
   4. Add devDeps: `typescript@^6.0.3`, `vitest@^4.0.3`, `@vitest/coverage-v8@^4.1.7`, `tsc-alias@^1.8.15`. `npm install`.
   5. Fix any `nodenext` import-extension errors surfaced by `npm run check`.
   6. Create `vitest.config.ts`. Rename `tests/*.ts` → `tests/*.spec.ts` (except `helpers.ts`). Rewrite test bodies as vitest specs.
   7. Replace `scripts/npm-link.sh`; add `scripts/contribution-reset.sh`, `scripts/package-review-src.sh`, `scripts/package-openspec.sh`.
   8. Final verification: `npm run lint && npm run check && npm run check:test && npm run test && npm run coverage && npm run build && npm pack --dry-run`.
   9. Add a changeset (major bump) describing the breaking changes.
3. **Rollback**: revert the merge commit. The pipeline changes are self-contained; no data migration, no consumer-side migration script.

## Open Questions

- None blocking. Decisions D1–D9 have been confirmed by the user; alternatives are documented above for posterity.
