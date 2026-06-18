import { ThemeSettings } from "@/components/theme-settings"
import { FieldGroup } from "@/components/ui/field"

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your app preferences.
      </p>
      <FieldGroup className="mt-8">
        <ThemeSettings />
      </FieldGroup>
    </div>
  )
}
