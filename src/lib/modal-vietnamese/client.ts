import "server-only"

import createClient from "openapi-fetch"

import { env } from "@/env"

import type { paths } from "./schema"

let client: ReturnType<typeof createClient<paths>> | undefined

export function createModalVietnameseClient() {
  if (!client) {
    client = createClient<paths>({
      baseUrl: env.MODAL_VIETNAMESE_API_URL,
      headers: {
        "x-api-key": env.MODAL_VIETNAMESE_API_KEY!,
      },
    })
  }

  return client
}
