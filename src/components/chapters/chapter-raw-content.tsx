"use client"

import { ChevronDownIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

type ChapterRawContentProps = {
  rawContent: string
  characterCount: number
}

export function ChapterRawContent({
  rawContent,
  characterCount,
}: ChapterRawContentProps) {
  return (
    <Collapsible defaultOpen={false}>
      <Card>
        <CollapsibleTrigger
          className={cn(
            "group/trigger flex w-full cursor-pointer items-start justify-between gap-4 rounded-t-xl px-(--card-spacing) text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          )}
        >
          <CardHeader className="flex-1 p-0">
            <CardTitle>Raw content</CardTitle>
            <CardDescription>
              {characterCount.toLocaleString()} characters
            </CardDescription>
          </CardHeader>
          <ChevronDownIcon
            aria-hidden
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-aria-expanded/trigger:rotate-180"
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap font-mono text-sm leading-relaxed">
              {rawContent}
            </pre>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
