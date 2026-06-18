import { NovelLibraryHeader, NovelList } from "@/components/novels/novel-list"
import { api } from "@/trpc/server"

export default async function NovelsPage() {
  const caller = await api()
  const novels = await caller.novels.list()

  return (
    <div className="flex flex-col gap-6">
      <NovelLibraryHeader />
      <NovelList novels={novels} />
    </div>
  )
}
