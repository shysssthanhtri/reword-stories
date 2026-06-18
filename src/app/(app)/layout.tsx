import { AppSidebarLayout } from "@/components/app-sidebar-layout"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AppSidebarLayout>
      <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
    </AppSidebarLayout>
  )
}
