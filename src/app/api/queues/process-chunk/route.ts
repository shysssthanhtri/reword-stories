import { handleCallback } from "@vercel/queue";

type TranslationChunkMessage = {
  translationId: string;
};

export const POST = handleCallback<TranslationChunkMessage>(
  async () => {
    // Stub: chunk processing implemented in step 5
  },
  {
    visibilityTimeoutSeconds: 300,
  },
);
