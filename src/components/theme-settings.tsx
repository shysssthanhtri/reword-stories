"use client"

import { useTheme } from "next-themes"
import { useSyncExternalStore } from "react"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const themeOptions = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const

type ThemeValue = (typeof themeOptions)[number]["value"]

function getThemeLabel(value: string | undefined): string {
  return (
    themeOptions.find((option) => option.value === value)?.label ?? "System"
  )
}

function normalizeTheme(value: string | undefined): ThemeValue {
  const match = themeOptions.find((option) => option.value === value)
  return match?.value ?? "system"
}

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}

export function ThemeSettings() {
  const mounted = useMounted()
  const { theme, setTheme } = useTheme()
  const currentTheme = normalizeTheme(mounted ? theme : "system")

  return (
    <Field>
      <FieldLabel htmlFor="theme">Theme</FieldLabel>
      <FieldDescription>
        Choose light, dark, or match your system setting.
      </FieldDescription>
      <Select
        value={currentTheme}
        onValueChange={(value) => {
          if (value) {
            setTheme(value)
          }
        }}
      >
        <SelectTrigger id="theme" className="w-[180px]" disabled={!mounted}>
          <SelectValue placeholder="Select theme">
            {getThemeLabel(currentTheme)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {themeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
