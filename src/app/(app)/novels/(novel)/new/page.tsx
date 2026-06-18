import Link from "next/link"

import { CreateNovelForm } from "@/components/novels/create-novel-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { routes } from "@/configs/routes"

export default function NewNovelPage() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={<Link href={routes.novels} />}
      >
        ← Back to novels
      </Button>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New novel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Name your project and choose a source language.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novel details</CardTitle>
          <CardDescription>
            You can paste chapters after creating the novel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateNovelForm />
        </CardContent>
      </Card>
    </div>
  )
}
