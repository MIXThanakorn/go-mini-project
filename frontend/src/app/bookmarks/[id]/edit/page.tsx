import BookmarkForm from "@/components/bookmark-form";
export default async function EditBookmarkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BookmarkForm id={id} />;
}
