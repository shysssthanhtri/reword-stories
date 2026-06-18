"use client"

import { BookOpenIcon, type LucideIcon, Settings2Icon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { type NavItemKey, navItems } from "@/configs/routes"

const navIcons: Record<NavItemKey, LucideIcon> = {
  novels: BookOpenIcon,
  settings: Settings2Icon,
}

function isNavActive(
  pathname: string,
  href: string,
  matchPrefix?: boolean,
): boolean {
  if (matchPrefix) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return pathname === href
}

export function NavMain() {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {navItems.map((item) => {
            const Icon = navIcons[item.key]

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={isNavActive(
                    pathname,
                    item.href,
                    "matchPrefix" in item ? item.matchPrefix : undefined,
                  )}
                  render={<Link href={item.href} />}
                >
                  <Icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
