# Dev Tooling

Local developer quality gates: ESLint plugins, TypeScript typecheck, combined lint check, and Husky pre-push hooks.

## Requirements

### Requirement: ESLint with import and unused-import plugins

The project SHALL extend ESLint (flat config) with `eslint-plugin-simple-import-sort` for automatic import ordering and `eslint-plugin-unused-imports` to flag and auto-fix unused imports.

#### Scenario: Import sort rule active

- **WHEN** a source file has unsorted imports
- **THEN** running `pnpm lint` reports a violation or auto-fixes import order per `simple-import-sort` rules

#### Scenario: Unused imports flagged

- **WHEN** a source file contains an unused import
- **THEN** running `pnpm lint` reports the unused import via `unused-imports/no-unused-imports`

### Requirement: Prettier integrated with ESLint for React

The project SHALL include Prettier with `eslint-config-prettier` (and optionally `eslint-plugin-prettier`) so ESLint and Prettier do not conflict on React/TypeScript formatting.

#### Scenario: Prettier config exists

- **WHEN** inspecting project root
- **THEN** a Prettier config file (e.g. `.prettierrc` or `prettier.config.mjs`) defines formatting rules

#### Scenario: ESLint and Prettier coexist

- **WHEN** running `pnpm lint`
- **THEN** ESLint passes on code formatted by Prettier without conflicting style rules

### Requirement: Typecheck script

The project SHALL expose a `typecheck` npm/pnpm script that runs TypeScript in no-emit mode (`tsc --noEmit`).

#### Scenario: Typecheck passes on clean codebase

- **WHEN** developer runs `pnpm typecheck`
- **THEN** TypeScript validates all project files and exits with code 0

#### Scenario: Typecheck catches type errors

- **WHEN** a file contains a TypeScript type error
- **THEN** running `pnpm typecheck` exits with a non-zero code and reports the error

### Requirement: Ultimate lint check script

The project SHALL expose a `check` script that runs ESLint followed by typecheck as a single combined quality gate.

#### Scenario: Check runs both linters

- **WHEN** developer runs `pnpm check`
- **THEN** ESLint runs first, then `tsc --noEmit`, and the command fails if either step fails

### Requirement: Husky pre-push hook

The project SHALL use Husky with a `pre-push` git hook that runs the ultimate lint check (`pnpm check`) and production build (`pnpm build`) before allowing a push.

#### Scenario: Pre-push runs quality gates

- **WHEN** developer runs `git push`
- **THEN** Husky executes `pnpm check` and `pnpm build` before the push proceeds

#### Scenario: Pre-push blocks on failure

- **WHEN** lint, typecheck, or build fails during pre-push
- **THEN** the git push is aborted with a non-zero exit code
