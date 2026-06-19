import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    SITE_PASSWORD: z.string().min(1),
    AI_GATEWAY_API_KEY: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    GEMINI_API_KEY: z.string().min(1).optional(),
    DEEPL_API_KEY: z.string().min(1).optional(),
    CHUNK_POLISH_RATE_LIMIT: z.coerce.number().int().positive().default(3),
    CHUNK_POLISH_RATE_LIMIT_WINDOW: z
      .string()
      .regex(/^\d+(ms|s|m|h|d|w|y)$/, 'Use a duration like "60s" or "1m"')
      .default("60s"),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
});
