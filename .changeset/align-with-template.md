---
'@ktarmyshov/typesafe-utilities': major
---

Align with `npm-typescript-template` and fix a build-output corruption.

**Breaking:**

- `engines.node` is now `>=22` (was `>=20.0.0`); Node 20 consumers will see an `EBADENGINE` warning.
- The package now declares an `exports` map (`./dist/index.js` / `./dist/index.d.ts`) instead of a bare `types` field. Consumers that previously deep-imported into `dist/` will no longer resolve.
- TypeScript bumped to `^6.0.3` and `module`/`moduleResolution` switched to `nodenext`. This is contributor-facing only — runtime semantics are unchanged.

**Build pipeline fix:**

- `tsconfig.json` now sets `rootDir: "./src"` so emit is flat (`src/foo.ts → dist/foo.js`) instead of leaking `src/` into the output tree.
- `tsconfig-test.json` now extends a shared `tsconfig.base.json` with `noEmit: true`, so type-checking tests can never write into `./dist`.
- `check` script is now `tsc --project tsconfig.json --noEmit`. Previously it ran bare `tsc --skipLibCheck`, silently emitting files into `dist/` on every type-check.

**Tooling additions:**

- `vitest` + `@vitest/coverage-v8` introduced; existing type-only tests rewritten as vitest specs using `expectTypeOf`.
- `scripts/` extended with `contribution-reset.sh`, `package-review-src.sh`, `package-openspec.sh`; `npm-link.sh` replaced with the safer allowlist version (no-op by default).

**No changes to the public API:** `filter`, `partial`, `paths`, `record` exports remain identical.
