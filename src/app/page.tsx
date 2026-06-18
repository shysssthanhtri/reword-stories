import { redirect } from "next/navigation"

import { defaultRoute } from "@/configs/routes"

export default function Home() {
  redirect(defaultRoute)
}
