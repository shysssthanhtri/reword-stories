"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import type { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { routes } from "@/configs/routes"
import {
  DEFAULT_GATEWAY_MODEL_ID,
  GATEWAY_PROVIDER_ID,
} from "@/lib/llm/models"
import { createTranslationSchema } from "@/lib/validations/translation"
import { trpc } from "@/trpc/react"

type CreateTranslationFormValues = z.infer<typeof createTranslationSchema>

type CreateTranslationFormProps = {
  novelId: string
  chapterId: string
}

export function CreateTranslationForm({
  novelId,
  chapterId,
}: CreateTranslationFormProps) {
  const router = useRouter()
  const createTranslation = trpc.translations.create.useMutation()
  const providersQuery = trpc.translations.listProviders.useQuery()
  const estimateQuery = trpc.translations.estimateChunks.useQuery({
    chapterId,
  })

  const form = useForm<CreateTranslationFormValues>({
    resolver: zodResolver(createTranslationSchema),
    defaultValues: {
      provider: GATEWAY_PROVIDER_ID,
      modelName: DEFAULT_GATEWAY_MODEL_ID,
    },
  })

  const selectedProviderId = useWatch({
    control: form.control,
    name: "provider",
  })

  const providers = providersQuery.data ?? []
  const selectedProvider = providers.find(
    (provider) => provider.id === selectedProviderId,
  )
  const models = selectedProvider?.models ?? []

  useEffect(() => {
    if (!selectedProvider) {
      return
    }

    const currentModel = form.getValues("modelName")
    const modelIsValid = selectedProvider.models.some(
      (model) => model.id === currentModel,
    )

    if (!modelIsValid) {
      const defaultModel =
        selectedProvider.id === GATEWAY_PROVIDER_ID
          ? DEFAULT_GATEWAY_MODEL_ID
          : selectedProvider.models[0]?.id

      if (defaultModel) {
        form.setValue("modelName", defaultModel, { shouldValidate: true })
      }
    }
  }, [form, selectedProvider])

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createTranslation.mutateAsync({
        chapterId,
        ...values,
      })
      router.push(routes.chapterDetail(novelId, chapterId))
    } catch {
      form.setError("root", {
        message: "Unable to start translation. Please try again.",
      })
    }
  })

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <FieldGroup>
        <Controller
          name="provider"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="translation-provider">Provider</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="translation-provider"
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select a provider">
                    {selectedProvider?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.label}
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

        <Controller
          name="modelName"
          control={form.control}
          render={({ field, fieldState }) => {
            const selectedModel = models.find((model) => model.id === field.value)

            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="translation-model">Model</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={models.length === 0}
                >
                  <SelectTrigger
                    id="translation-model"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Select a model">
                      {selectedModel?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                        {model.isFree ? " (free)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : null}
              </Field>
            )
          }}
        />

        <Field>
          <FieldLabel>Pre-flight estimate</FieldLabel>
          <FieldDescription>
            {estimateQuery.isLoading
              ? "Calculating chunk estimate..."
              : `~${estimateQuery.data?.chunkCount ?? 0} chunks`}
          </FieldDescription>
        </Field>
      </FieldGroup>

      {form.formState.errors.root ? (
        <FieldError>{form.formState.errors.root.message}</FieldError>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={createTranslation.isPending}>
          {createTranslation.isPending ? "Starting..." : "Start translation"}
        </Button>
        <Button
          type="button"
          variant="outline"
          nativeButton={false}
          render={
            <Link href={routes.chapterDetail(novelId, chapterId)} />
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
