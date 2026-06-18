"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { routes } from "@/configs/routes"
import {
  createNovelSchema,
  getSourceLanguageLabel,
  SOURCE_LANGUAGES,
  type SourceLanguage,
} from "@/lib/validations/novel"
import { trpc } from "@/trpc/react"

type CreateNovelFormValues = z.infer<typeof createNovelSchema>

export function CreateNovelForm() {
  const router = useRouter()
  const createNovel = trpc.novels.create.useMutation()

  const form = useForm<CreateNovelFormValues>({
    resolver: zodResolver(createNovelSchema),
    defaultValues: {
      title: "",
      sourceLanguage: "ko",
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const novel = await createNovel.mutateAsync(values)
      router.push(routes.novelDetail(novel.id))
    } catch {
      form.setError("root", {
        message: "Unable to create novel. Please try again.",
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
              <FieldLabel htmlFor="novel-title">Title</FieldLabel>
              <Input
                {...field}
                id="novel-title"
                placeholder="Solo Leveling"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          name="sourceLanguage"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="novel-source-language">
                Source language
              </FieldLabel>
              <Select
                value={field.value}
                onValueChange={(value) =>
                  field.onChange(value as SourceLanguage)
                }
              >
                <SelectTrigger
                  id="novel-source-language"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select a language">
                    {getSourceLanguageLabel(field.value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_LANGUAGES.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <Button type="submit" disabled={createNovel.isPending}>
          {createNovel.isPending ? "Creating..." : "Create novel"}
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={<Link href={routes.novels} />}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
