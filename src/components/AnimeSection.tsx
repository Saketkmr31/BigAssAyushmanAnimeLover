import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Anime } from "@/lib/catalog";
import AnimeCard from "./AnimeCard";
export default function AnimeSection({title,items,href="/browse"}:{title:string;items:Anime[];href?:string}) {
 return <section className="mt-10">
  <div className="mb-5 flex items-center justify-between gap-4"><h2 className="section-title">{title}</h2><Link href={href} className="muted inline-flex items-center gap-1 text-sm hover:text-white">View all <ArrowRight size={15}/></Link></div>
  <div className="anime-grid">{items.map(a=><AnimeCard key={a.slug} anime={a}/>)}</div>
 </section>;
}