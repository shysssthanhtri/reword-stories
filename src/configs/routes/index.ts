export const routes = {
  home: "/",
  novels: "/novels",
  novelNew: "/novels/new",
  novelDetail: (id: string) => `/novels/${id}`,
  chapterNew: (novelId: string) => `/novels/${novelId}/chapters/new`,
  chapterDetail: (novelId: string, chapterId: string) =>
    `/novels/${novelId}/chapters/${chapterId}`,
  settings: "/settings",
} as const

export const defaultRoute = routes.novels

export const navItems = [
  {
    key: "novels",
    title: "Novels",
    href: routes.novels,
    matchPrefix: true,
  },
  {
    key: "settings",
    title: "Settings",
    href: routes.settings,
  },
] as const

export type NavItemKey = (typeof navItems)[number]["key"]
