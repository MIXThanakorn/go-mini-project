import { Suspense } from "react";
import BookmarksView from "@/components/bookmarks";
import { Loading } from "@/components/ui";
export default function BookmarksPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BookmarksView />
    </Suspense>
  );
}
