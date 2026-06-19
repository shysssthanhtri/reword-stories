## MODIFIED Requirements

### Requirement: Vercel queue consumer skeleton

The project SHALL include a Workflow SDK setup for durable translation jobs instead of a `@vercel/queue` push consumer.

The project SHALL install the `workflow` npm package and wrap `next.config.ts` with `withWorkflow()` from `workflow/next`.

#### Scenario: Workflow package installed

- **WHEN** inspecting `package.json`
- **THEN** `workflow` is listed as a dependency

#### Scenario: Next config wrapped with withWorkflow

- **WHEN** inspecting `next.config.ts`
- **THEN** the default export uses `withWorkflow()` from `workflow/next`

## REMOVED Requirements

### Requirement: Vercel queue trigger configured

**Reason**: Translation processing uses Vercel Workflows; queue topic trigger on `process-chunk` route is removed.

**Migration**: Remove `experimentalTriggers` queue entry from `vercel.json` for `translation-chunk`. Configure `maxDuration: 300` on workflow-generated step routes as needed.
