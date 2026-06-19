"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import Link from "next/link"

import { routes } from "@/configs/routes"
import {
  type ChapterListParams,
  getChapterListSortUrl,
} from "@/lib/chapter-list-url"
import { getChapterDisplayTitle } from "@/lib/validations/chapter"

export type ChapterListItem = {
  id: string
  title: string | null
  sortOrder: number
  createdAt: Date
}

function SortableHeader({
  label,
  column,
  novelId,
  listParams,
}: {
  label: string
  column: "sortOrder" | "createdAt"
  novelId: string
  listParams: ChapterListParams
}) {
  const isActive = listParams.sortBy === column
  const SortIcon = listParams.sortDir === "asc" ? ArrowUpIcon : ArrowDownIcon

  return (
    <Link
      href={getChapterListSortUrl(column, novelId, listParams)}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      {isActive ? <SortIcon className="size-3.5" /> : null}
    </Link>
  )
}

export function getChapterListColumns(
  novelId: string,
  listParams: ChapterListParams
): ColumnDef<ChapterListItem>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Link
          href={routes.chapterDetail(novelId, row.original.id)}
          className="font-medium hover:underline"
        >
          {getChapterDisplayTitle(row.original)}
        </Link>
      ),
    },
    {
      accessorKey: "sortOrder",
      header: () => (
        <SortableHeader
          label="#"
          column="sortOrder"
          novelId={novelId}
          listParams={listParams}
        />
      ),
      cell: ({ row }) => row.original.sortOrder + 1,
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <SortableHeader
          label="Created"
          column="createdAt"
          novelId={novelId}
          listParams={listParams}
        />
      ),
      cell: ({ row }) => format(new Date(row.original.createdAt), "MMM d, yyyy"),
    },
  ]
}
