import { redirect } from "next/navigation";
type Props={params:Promise<{slug:string}>};
export default async function GenreSlugPage({params}:Props){const {slug}=await params;const value=decodeURIComponent(slug).replace(/-/g," ");redirect("/browse?genre="+encodeURIComponent(value));}
