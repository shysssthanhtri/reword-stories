## ADDED Requirements

### Requirement: React Hook Form as project form library

All interactive forms in the application SHALL use **React Hook Form** with `@hookform/resolvers/zod` for Zod schema validation and shadcn/ui `Field` primitives with `Controller` for field wiring. Validation schemas SHALL live in shared modules under `src/lib/validations/` and be reused by both form `zodResolver` and tRPC procedure `.input()` where applicable.

TanStack Form SHALL NOT be used for application forms.

#### Scenario: Form dependencies installed

- **WHEN** inspecting `package.json`
- **THEN** `react-hook-form` and `@hookform/resolvers` are listed as runtime dependencies

#### Scenario: Forms follow shadcn RHF pattern

- **WHEN** inspecting any Client Component form (e.g. create-novel form)
- **THEN** it uses `useForm` with `zodResolver`, `Controller` per field, and shadcn `Field`, `FieldLabel`, and `FieldError` components

#### Scenario: Shared validation schema

- **WHEN** a form submits data validated by a Zod schema
- **THEN** the same schema (or a subset) is used by the corresponding tRPC procedure input validation
