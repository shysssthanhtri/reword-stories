import { db } from "@/lib/db"

export async function createTRPCContext() {
  return { db }
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>
