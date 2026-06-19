"use client"

import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { buildNovelListUrl, type NovelListParams } from "@/lib/novel-list-url"

type NovelListSearchProps = {
  defaultValue?: string
  listParams: NovelListParams
}

export function NovelListSearch({
  defaultValue = "",
  listParams,
}: NovelListSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmed = query.trim()

    router.push(
      buildNovelListUrl({
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
        aria-label="Search novels by title"
      />
      <Button type="submit" variant="outline" size="icon">
        <SearchIcon className="size-4" />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  )
}
