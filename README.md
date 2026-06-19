This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Translation queue

Background chapter polishing runs through [Vercel Queues](https://vercel.com/docs/queues). One queue message processes **one chunk**; when it succeeds, the consumer publishes the next message until all chunks are done.

### Key files

| File | Role |
| --- | --- |
| `src/lib/queue/translation-queue.ts` | Publishes kickoff and chained messages to topic `translation-chunk` |
| `src/app/api/queues/process-chunk/route.ts` | Queue consumer (`handleCallback`) |
| `src/lib/queue/process-translation-chunk.ts` | Core logic: load translation, polish one chunk, chain or finalize |
| `vercel.json` | Wires topic `translation-chunk` → consumer route (`maxDuration: 300`) |

### Flow

1. **Create** — `translations.create` chunks the chapter, sets status `QUEUED`, calls `kickoffTranslation`.
2. **Process** — consumer picks the first `PENDING` or `FAILED` chunk, calls the LLM, marks it `COMPLETED`, updates progress.
3. **Chain** — if more chunks remain, `chainNextChunk` publishes another message (idempotency key: `{translationId}-{chunkIndex}`).
4. **Finalize** — when all chunks are `COMPLETED`, assembled `polishedContent` is saved and status becomes `COMPLETED`.
5. **Fail** — on any error, the current chunk and translation are marked `FAILED` with `errorMessage`. No automatic queue retry.

### Retry policy

The consumer does **not** auto-retry failed messages. The route acks on failure:

```typescript
retry: () => ({ acknowledge: true })
```

Users retry manually from the chapter detail page (**Retry** button → `translations.retry`), which resets `FAILED` chunks to `PENDING`, clears the error, sets status `QUEUED`, and re-publishes a kickoff message. Completed chunks are preserved.

### Logs

The consumer logs with prefix **`[translation-queue]`** (shared constant: `TRANSLATION_QUEUE_LOG_PREFIX` in `src/lib/queue/log-prefix.ts`). Filter Vercel function logs on that string, then trace a job by `translationId`.

| Message | Level | Source | Meaning |
| --- | --- | --- | --- |
| `kickoff` | log | `translation-queue.ts` | Kickoff message published |
| `chain publish` | log | `translation-queue.ts` | Chained message published |
| `message received` | log | `process-chunk/route.ts` | Consumer invoked |
| `started` | log | `process-translation-chunk.ts` | Handler processing translation |
| `translation not found` | warn | `process-translation-chunk.ts` | No DB row for `translationId` (stale message?) |
| `no pending chunk to process` | log | `process-translation-chunk.ts` | Nothing to polish; includes `translationStatus` and per-chunk statuses |
| `finalizing already-completed chunks` | log | `process-translation-chunk.ts` | All chunks done but translation not yet `COMPLETED` |
| `processing chunk` | log | `process-translation-chunk.ts` | About to call LLM (`chunkIndex`, provider, model) |
| `chunk completed` | log | `process-translation-chunk.ts` | Chunk saved; includes `progressPct` and `tokenDelta` |
| `chaining next chunk` | log | `process-translation-chunk.ts` | About to publish the next queue message |
| `all chunks completed, finalizing translation` | log | `process-translation-chunk.ts` | Last chunk done; assembling output |
| `translation completed` | log | `process-translation-chunk.ts` | Job finished successfully |
| `chunk failed` | error | `process-translation-chunk.ts` | LLM or processing error; translation marked `FAILED` |

**Example:** find all log lines for one job:

```
[translation-queue] translationId: "clx..."
```

In the Vercel dashboard: **Project → Logs → Functions**, filter by route `/api/queues/process-chunk` and search `[translation-queue]`.

### Debugging checklist

1. **Get `translationId`** from the UI or `Translation` table.
2. **Filter logs** by `[translation-queue]` and that `translationId`.
3. **Follow the lifecycle** — you should see `started` → `processing chunk` → `chunk completed` → (`chaining next chunk` repeated) → `translation completed`.
4. **If stuck on `QUEUED`/`PROCESSING`** — confirm the queue trigger in `vercel.json` and that the deployment is on Vercel (full queue delivery does not run on plain `next dev`).
5. **If `chunk failed`** — read `error` in the log and `Translation.errorMessage` in the DB; use **Retry** after fixing the underlying issue (rate limit, bad content, etc.).
6. **If `no pending chunk to process`** — inspect `chunkStatuses` in the log; often a partial failure or duplicate message after manual retry.
7. **If progress looks wrong** — check `TranslationChunk.status` per index; only `PENDING`/`FAILED` chunks are picked up next.

### Local development

Queue messages are sent to the real Vercel Queue service. For end-to-end testing, use **`vercel dev`** or a **Vercel preview deployment** with `vercel link` and `vercel env pull` so OIDC credentials are available. See [@vercel/queue local dev](https://www.npmjs.com/package/@vercel/queue#local-development).
