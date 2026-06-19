"use client"

import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  buildChapterListUrl,
  type ChapterListParams,
} from "@/lib/chapter-list-url"

type ChapterListSearchProps = {
  novelId: string
  defaultValue?: string
  listParams: ChapterListParams
}

export function ChapterListSearch({
  novelId,
  defaultValue = "",
  listParams,
}: ChapterListSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = query.trim()

    router.push(
      buildChapterListUrl(novelId, {
        ...listParams,
        q: trimmed.length > 0 ? trimmed : undefined,
        page: 1,
      })
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm items-center gap-2">
      <Input
        type="search"
        placeholder="Search by title..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        aria-label="Search chapters by title"
      />
      <Button type="submit" variant="outline" size="icon">
        <SearchIcon className="size-4" />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  )
}
