import { redirect, notFound } from "next/navigation";
type Props = { params: Promise<{ page: string }> };
export default async function CataloguePage({ params }: Props) {
  const { page } = await params;
  const number = Number(page);
  if (!Number.isInteger(number) || number < 1 || number > 500) notFound();
  redirect(number === 1 ? "/browse" : "/browse?page=" + number);
}
