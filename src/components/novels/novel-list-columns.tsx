"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import Link from "next/link"

import { routes } from "@/configs/routes"
import {
  getNovelListSortUrl,
  type NovelListParams,
} from "@/lib/novel-list-url"
import { getSourceLanguageLabel } from "@/lib/validations/novel"

export type NovelListItem = {
  id: string
  title: string
  sourceLanguage: string
  createdAt: Date
  chapterCount: number
}

function SortableHeader({
  label,
  column,
  listParams,
}: {
  label: string
  column: "createdAt" | "chapterCount"
  listParams: NovelListParams
}) {
  const isActive = listParams.sortBy === column
  const SortIcon = listParams.sortDir === "asc" ? ArrowUpIcon : ArrowDownIcon

  return (
    <Link
      href={getNovelListSortUrl(column, listParams)}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      {isActive ? <SortIcon className="size-3.5" /> : null}
    </Link>
  )
}

export function getNovelListColumns(
  listParams: NovelListParams
): ColumnDef<NovelListItem>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <Link
          href={routes.novelDetail(row.original.id)}
          className="font-medium hover:underline"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "sourceLanguage",
      header: "Source language",
      cell: ({ row }) => getSourceLanguageLabel(row.original.sourceLanguage),
    },
    {
      accessorKey: "chapterCount",
      header: () => (
        <SortableHeader
          label="Chapters"
          column="chapterCount"
          listParams={listParams}
        />
      ),
      cell: ({ row }) => row.original.chapterCount,
    },
    {
      accessorKey: "createdAt",
      header: () => (
        <SortableHeader
          label="Created"
          column="createdAt"
          listParams={listParams}
        />
      ),
      cell: ({ row }) => format(new Date(row.original.createdAt), "MMM d, yyyy"),
    },
  ]
}
