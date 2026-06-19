type ChunkSlice = {
  chunkIndex: number
  polishedSlice: string | null
}

export function assemblePolishedContent(chunks: ChunkSlice[]): string {
  return chunks
    .filter((chunk) => chunk.polishedSlice?.trim())
    .sort((left, right) => left.chunkIndex - right.chunkIndex)
    .map((chunk) => chunk.polishedSlice!.trim())
    .join("\n\n")
}
