import { AppSidebarLayout } from "@/components/app-sidebar-layout"
import { Providers } from "@/components/providers"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Providers>
      <AppSidebarLayout>
        <div className="container mx-auto flex w-full flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </AppSidebarLayout>
    </Providers>
  )
}
