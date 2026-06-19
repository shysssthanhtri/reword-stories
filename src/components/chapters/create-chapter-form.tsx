"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { routes } from "@/configs/routes"
import { createChapterSchema } from "@/lib/validations/chapter"
import { trpc } from "@/trpc/react"

type CreateChapterFormValues = z.infer<typeof createChapterSchema>

type CreateChapterFormProps = {
  novelId: string
}

export function CreateChapterForm({ novelId }: CreateChapterFormProps) {
  const router = useRouter()
  const createChapter = trpc.chapters.create.useMutation()

  const form = useForm<CreateChapterFormValues>({
    resolver: zodResolver(createChapterSchema),
    defaultValues: {
      title: "",
      rawContent: "",
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const chapter = await createChapter.mutateAsync({
        novelId,
        ...values,
      })
      router.push(routes.chapterDetail(novelId, chapter.id))
    } catch {
      form.setError("root", {
        message: "Unable to save chapter. Please try again.",
      })
    }
  })

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="chapter-title">Title (optional)</FieldLabel>
              <Input
                {...field}
                id="chapter-title"
                placeholder="Chapter 1"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="rawContent"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="chapter-raw-content">Raw content</FieldLabel>
              <FieldDescription>
                Paste machine-translated text for this chapter (max 100,000
                characters).
              </FieldDescription>
              <Textarea
                {...field}
                id="chapter-raw-content"
                placeholder="Paste your machine-translated chapter here..."
                className="min-h-96 font-mono text-sm"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
      </FieldGroup>

      {form.formState.errors.root ? (
        <FieldError>{form.formState.errors.root.message}</FieldError>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={createChapter.isPending}>
          {createChapter.isPending ? "Saving..." : "Save chapter"}
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href={routes.novelDetail(novelId)} />}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
