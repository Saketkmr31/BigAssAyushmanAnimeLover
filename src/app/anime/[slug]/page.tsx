"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Play, Bookmark, Star, CalendarDays, ListVideo } from "lucide-react";
import type { Anime } from "@/lib/catalog";
import { useAnimeCatalog } from "@/lib/useAnimeCatalog";
import AnimeSection from "@/components/AnimeSection";
export default function AnimePage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=use(params); const {items}=useAnimeCatalog();
 const [anime,setAnime]=useState<Anime|null>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{let alive=true; const found=items.find(a=>a.slug===slug); if(found){setAnime(found);setLoading(false);return ()=>{alive=false}} const id=Number(slug.split("-")[0]); if(!Number.isInteger(id)||id<=0){setLoading(false);return ()=>{alive=false}} fetch(`/api/anime?id=${id}`).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(alive&&d.item)setAnime(d.item)}).catch(()=>{}).finally(()=>{if(alive)setLoading(false)}); return ()=>{alive=false};},[slug,items]);
 useEffect(()=>{if(!anime)return;try{const old=JSON.parse(localStorage.getItem("baa-history")||"[]") as string[];localStorage.setItem("baa-history",JSON.stringify([anime.slug,...old.filter(x=>x!==anime.slug)].slice(0,30)));window.dispatchEvent(new Event("baa-history-changed"))}catch{}},[anime]);
 if(loading&&!anime) return <div className="surface p-10 text-center muted">Loading anime details…</div>;
 if(!anime) return <div className="surface p-10 text-center"><h1 className="text-2xl font-black">Anime details unavailable</h1><p className="muted mt-2">AniList could not return this title. Please go back to the catalogue and try again.</p><Link className="btn-primary mt-5" href="/browse">Back to browse</Link></div>;
 return <>
  <div className="mb-5 text-sm muted"><Link href="/">Home</Link> <span className="mx-2">/</span><Link href="/browse">Anime</Link><span className="mx-2">/</span><span className="text-white">{anime.title}</span></div>
  <section className="surface grid gap-7 p-5 sm:p-7 md:grid-cols-[230px_1fr]">
   <div className="poster mx-auto w-full max-w-[230px]" style={{"--poster":anime.color} as React.CSSProperties}>{anime.coverImage?<img className="poster-image" src={anime.coverImage} alt={`${anime.title} cover`}/>:<span className="poster-title">{anime.title}</span>}<span className="poster-badge">{anime.type}</span></div>
   <div className="flex flex-col items-start"><div className="eyebrow">Anime details · AniList</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">{anime.title}</h1><p className="muted mt-1">{anime.alt}</p>
    <div className="mt-4 flex flex-wrap gap-2"><span className="pill"><Star size={13} className="mr-1 text-amber-300"/>{anime.rating}</span><span className="pill"><CalendarDays size={13} className="mr-1"/>{anime.year||"Year unknown"}</span><span className="pill">{anime.status}</span><span className="pill">{anime.episodes||"?"} episodes</span></div>
    <p className="mt-5 max-w-3xl whitespace-pre-line leading-7 text-zinc-300">{anime.description}</p>
    <div className="mt-4 flex flex-wrap gap-2">{anime.genre.map(g=><span className="pill" key={g}>{g}</span>)}</div>
    <div className="mt-7 flex flex-wrap gap-3"><Link className="btn-primary" href={`/watch/${anime.slug}-episode-1`}><Play size={17} fill="currentColor"/> Watch episode 1</Link><Link className="btn-secondary" href="/profile#bookmarks"><Bookmark size={17}/> My bookmarks</Link></div>
   </div>
  </section>
  <section className="surface mt-7 p-5"><h2 className="section-title flex items-center gap-2"><ListVideo size={19} className="text-violet-300"/> Episodes</h2><div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">{Array.from({length:Math.min(anime.episodes||1,24)},(_,i)=><Link key={i} href={`/watch/${anime.slug}-episode-${i+1}`} className="btn-secondary !px-2 !py-3 text-sm">EP {i+1}</Link>)}</div><p className="muted mt-3 text-xs">Episode numbering is based on metadata; actual playback requires an authorized video source.</p></section>
  <AnimeSection title="More popular anime" items={items.filter(a=>a.slug!==anime.slug).slice(0,6)}/>
 </>;
}
