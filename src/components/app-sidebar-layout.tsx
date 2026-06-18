import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { SIDEBAR_COOKIE_NAME } from "@/lib/sidebar"

export async function getSidebarDefaultOpen(): Promise<boolean> {
  const cookieStore = await cookies()
  const value = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value

  if (value === undefined) {
    return true
  }

  return value === "true"
}

export async function AppSidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const defaultOpen = await getSidebarDefaultOpen()

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
