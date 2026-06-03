### Requirement: TypeScript configuration is layered

The repository SHALL provide three TypeScript configuration files that share a common base, so that build, type-check, and release operations have a single source of truth for compiler options.

- `tsconfig.base.json` MUST contain only the shared compiler options (`lib`, `target`, `module: "nodenext"`, `moduleResolution: "nodenext"`, `allowJs`, `checkJs`, `esModuleInterop`, `forceConsistentCasingInFileNames`, `resolveJsonModule`, `skipLibCheck`, `strict`).
- `tsconfig.base.json` MUST NOT define `rootDir`, `outDir`, `include`, or `noEmit`.
- `tsconfig.json` MUST extend `./tsconfig.base.json` and define `rootDir: "./src"`, `outDir: "./dist"`, `declaration: true`, `sourceMap: true`, `declarationMap: true`, and `include: ["src"]`.
- `tsconfig-test.json` MUST extend `./tsconfig.base.json` and define `rootDir: "."`, `noEmit: true`, and `include: ["tests", "vitest.config.ts"]`.
- `tsconfig-release.json` MUST extend `./tsconfig.json` and override `sourceMap: false`, `declarationMap: false`.

#### Scenario: Compiling source emits a flat dist layout

- **WHEN** `tsc --project tsconfig.json` runs against `src/filter.ts`
- **THEN** the output is written to `dist/filter.js`, NOT `dist/src/filter.js`

#### Scenario: Type-checking tests does not write any files

- **WHEN** `tsc --project tsconfig-test.json` runs
- **THEN** no files are emitted under `dist/` or anywhere else on disk

#### Scenario: Release config inherits release-specific overrides

- **WHEN** `tsc --project tsconfig-release.json` runs
- **THEN** the output contains `.js` and `.d.ts` files but no `.js.map` or `.d.ts.map` files

### Requirement: npm scripts have deterministic emit semantics

The `package.json` `scripts` block SHALL keep emit operations and type-check operations strictly separate.

- `build` MUST run `rimraf ./dist && tsc --project tsconfig.json && npm run prepack`.
- `build:release` MUST run `rimraf ./dist && tsc --project tsconfig-release.json && npm run prepack`.
- `prepack` MUST run `publint`.
- `check` MUST run `tsc --project tsconfig.json --noEmit` and MUST NOT emit any files.
- `check:test` MUST run `tsc --project tsconfig-test.json` and MUST NOT emit any files (relying on `noEmit` in the config).
- `test` MUST run `npm run check:test && vitest run --run`.
- `coverage` MUST run `npm run check:test && vitest run --coverage`.
- `format` MUST run `prettier --write .`.
- `lint` MUST run `prettier --check . && eslint .`.
- `changeset:version` MUST run `changeset version && npm install && git add --all`.
- `changeset:publish` MUST run `changeset publish`.

#### Scenario: Running check after a clean build leaves dist intact

- **WHEN** `npm run build` finishes successfully and `npm run check` is then invoked
- **THEN** the contents and mtimes of `./dist` are unchanged

#### Scenario: Running check:test after a clean build leaves dist intact

- **WHEN** `npm run build` finishes successfully and `npm run check:test` is then invoked
- **THEN** the contents and mtimes of `./dist` are unchanged

#### Scenario: Running build produces a flat dist tree

- **WHEN** `npm run build` runs from a state where `./dist` does not exist
- **THEN** `./dist` contains compiled files at the top level (e.g. `dist/index.js`, `dist/filter.js`) and contains NO `dist/src/` or `dist/tests/` subdirectories

### Requirement: Published tarball includes only the public artifacts

The `package.json` `files` array SHALL be configured so that `npm pack` produces a tarball containing the compiled distribution and the changelog, and excluding test artifacts.

- `files` MUST be exactly `["dist", "CHANGELOG.md", "!dist/**/*.test.*", "!dist/**/*.spec.*"]`.
- The package MUST publish `README.md` and `LICENSE` (these are auto-included by npm and need not be listed).
- The package MUST publish `CHANGELOG.md` (npm does NOT auto-include this; it must be listed).
- The package MUST NOT publish any file under `tests/`, `src/`, or any test/spec file under `dist/`.

#### Scenario: npm pack dry-run lists the expected files

- **WHEN** `npm pack --dry-run` runs in the repository root
- **THEN** the listed contents include `dist/index.js`, `dist/index.d.ts`, `package.json`, `README.md`, `LICENSE`, and `CHANGELOG.md`
- **AND** the listed contents include no files matching `**/*.test.*` or `**/*.spec.*`
- **AND** the listed contents include no files under `tests/` or `src/`

### Requirement: Package declares modern ESM entry points

The `package.json` SHALL declare its public entry points via `exports` and SHALL NOT rely on the legacy `main` field.

- `package.json` MUST set `"type": "module"`.
- `package.json` MUST set `"types": "./dist/index.d.ts"`.
- `package.json` MUST define an `exports` map with at least the `"."` entry resolving to `{ "types": "./dist/index.d.ts", "import": "./dist/index.js", "default": "./dist/index.js" }`.
- `package.json` MUST NOT define a `main` field.

#### Scenario: publint accepts the package metadata

- **WHEN** `npx publint` runs in the repository root after `npm run build`
- **THEN** publint reports no errors

#### Scenario: Consumer resolves the package via exports

- **WHEN** a consumer with native ESM resolution imports `@ktarmyshov/typesafe-utilities`
- **THEN** the resolution resolves to `./dist/index.js` and the types resolve to `./dist/index.d.ts`

### Requirement: Package targets Node 22 and the canonical toolchain

The `package.json` `engines` and `devDependencies` SHALL match the canonical `npm-typescript-template` toolchain.

- `engines.node` MUST be `">=22"`.
- `devDependencies` MUST include `typescript@^6.0.3` (or newer compatible).
- `devDependencies` MUST include `vitest@^4.0.3` and `@vitest/coverage-v8@^4.1.7`.
- `devDependencies` MUST include `publint`, `rimraf`, `prettier`, `eslint`, `eslint-config-prettier`, `@eslint/js`, `@eslint/compat`, `globals`, `typescript-eslint`, `@types/node`, `@changesets/cli` at versions compatible with the template.

#### Scenario: Installing on Node 22 succeeds without engine warnings

- **WHEN** `npm install` runs in a Node 22 environment
- **THEN** no `EBADENGINE` warnings are emitted for this package

#### Scenario: Installing on Node 20 emits an engine warning

- **WHEN** `npm install` runs in a Node 20 environment
- **THEN** npm emits an `EBADENGINE` warning identifying this package as requiring `>=22`

### Requirement: Repository has a runnable test suite

The repository SHALL have a vitest-based test suite that exercises the public utilities with real assertions.

- A `vitest.config.ts` MUST exist at the repository root with v8 coverage configured.
- Test files for public utilities MUST live under `tests/` with the `.spec.ts` suffix (e.g. `tests/filter.spec.ts`, `tests/partial.spec.ts`, `tests/paths.spec.ts`).
- Shared test helpers MAY live under `tests/` without the `.spec.ts` suffix (e.g. `tests/helpers.ts`).
- Each spec file MUST contain at least one `describe`/`it` block with at least one runtime `expect` assertion or `expectTypeOf` assertion.
- `npm run test` MUST exit with code 0 when all specs pass.
- `npm run coverage` MUST produce a coverage report under `./coverage/` or `./coverage-test/` (matching the template's vitest config).

#### Scenario: Running tests passes

- **WHEN** `npm run test` runs from a clean working tree
- **THEN** the command exits with code 0
- **AND** vitest reports at least one passing test per public utility module

#### Scenario: Running coverage produces a report

- **WHEN** `npm run coverage` runs from a clean working tree
- **THEN** the command exits with code 0
- **AND** a coverage summary is written to disk

### Requirement: Repository ships the canonical scripts/ tooling

The `scripts/` directory SHALL contain the same shell utilities as the canonical `npm-typescript-template`, with project-specific values where needed.

- `scripts/push-update.sh` MUST exist (formats, commits, and pushes).
- `scripts/npm-link.sh` MUST exist and use the `LINK_PACKAGES` allowlist pattern. For this repository, `LINK_PACKAGES` MUST be the empty array `()`, making the script a no-op until a maintainer opts in.
- `scripts/contribution-reset.sh` MUST exist (resets the contribution branch to `origin/contribution` after a safety check for uncommitted changes).
- `scripts/package-review-src.sh` MUST exist (packages project source for external code review, honoring `.gitignore`).
- `scripts/package-openspec.sh` MUST exist (packages OpenSpec content for external review).
- All scripts MUST be executable (`chmod +x`).

#### Scenario: npm-link.sh is a no-op by default

- **WHEN** `./scripts/npm-link.sh` runs with the default empty `LINK_PACKAGES`
- **THEN** the script exits with code 0 and prints that nothing is to be linked
- **AND** `npm link` is not invoked

#### Scenario: package-review-src.sh produces a tarball

- **WHEN** `./scripts/package-review-src.sh` runs from inside the repository
- **THEN** an archive is written under `./artifacts/` with a timestamped name
- **AND** the archive contains source files honoring `.gitignore`
