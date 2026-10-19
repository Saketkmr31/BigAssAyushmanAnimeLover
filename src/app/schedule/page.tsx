"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Clock3, LoaderCircle, Play, RefreshCw } from "lucide-react";
import type { Anime } from "@/lib/catalog";

type AiringAnime = Anime & { airingAt: number; airingEpisode: number; timeUntilAiring: number };
type PageInfo = { currentPage: number; hasNextPage: boolean; total?: number };
function dateKey(timestamp:number){const d=new Date(timestamp*1000);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function dateLabel(key:string){const d=new Date(`${key}T12:00:00`);return d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});}
function EpisodeRow({anime}:{anime:AiringAnime}){
 const d=new Date(anime.airingAt*1000);
 return <article className="surface flex gap-3 p-3 sm:gap-4 sm:p-4">
  <Link href={`/anime/${anime.slug}`} className="h-[105px] w-[75px] shrink-0 overflow-hidden rounded-xl bg-zinc-900 sm:h-[125px] sm:w-[88px]">{anime.coverImage?<img src={anime.coverImage} alt={`${anime.title} cover`} className="h-full w-full object-cover" loading="lazy"/>:<div className="grid h-full place-items-center p-2 text-center text-xs font-bold" style={{background:`linear-gradient(145deg,${anime.color},#111)`}}>{anime.title}</div>}</Link>
  <div className="min-w-0 flex-1"><Link href={`/anime/${anime.slug}`} className="font-bold leading-snug hover:text-violet-200">{anime.title}</Link><div className="muted mt-1 text-xs">{anime.type} · Episode {anime.airingEpisode}{anime.year? ` · ${anime.year}`:""}</div><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"><span className="inline-flex items-center gap-1 text-violet-300"><Clock3 size={13}/>{d.toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"})}</span><span className="muted">{d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span><span className="pill !py-1">{anime.status}</span></div><Link className="btn-secondary mt-3 !px-3 !py-2 text-xs" href={`/watch/${anime.slug}-episode-${anime.airingEpisode}`}><Play size={13} fill="currentColor"/> Episode details</Link></div>
 </article>;
}
export default function SchedulePage(){
 const [days,setDays]=useState("7");
 const [items,setItems]=useState<AiringAnime[]>([]);
 const [pageInfo,setPageInfo]=useState<PageInfo|null>(null);
 const [busy,setBusy]=useState(true);
 const [moreBusy,setMoreBusy]=useState(false);
 const [error,setError]=useState("");
 async function fetchPage(page:number,append:boolean){
  if(append)setMoreBusy(true);else setBusy(true);
  setError("");
  try{
   const response=await fetch(`/api/anime?schedule=1&days=${days}&perPage=30&page=${page}`);
   if(!response.ok)throw new Error("AniList couldn't return the schedule. Retry in a moment.");
   const data=await response.json();
   const next=(Array.isArray(data.items)?data.items:[]) as AiringAnime[];
   setItems(old=>{
    if(!append)return next;
    const keys=new Set(old.map(a=>`${a.slug}-${a.airingEpisode}-${a.airingAt}`));
    return [...old,...next.filter(a=>!keys.has(`${a.slug}-${a.airingEpisode}-${a.airingAt}`))];
   });
   setPageInfo(data.pageInfo??null);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load schedule.");}
  finally{setBusy(false);setMoreBusy(false);}
 }
 useEffect(()=>{void fetchPage(1,false);},[days]);
 const grouped=useMemo(()=>{const map=new Map<string,AiringAnime[]>();for(const item of [...items].sort((a,b)=>a.airingAt-b.airingAt)){const key=dateKey(item.airingAt);map.set(key,[...(map.get(key)||[]),item]);}return [...map.entries()]},[items]);
 return <><div className="mb-7"><div className="eyebrow flex items-center gap-2"><CalendarDays size={15}/> Release calendar</div><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Anime airing schedule</h1><p className="muted mt-2">Upcoming episode times from AniList, displayed in your device's local time. Episode entries are release metadata, not a hosted video feed.</p></div>
  <div className="surface mb-6 flex flex-wrap items-center justify-between gap-3 p-4"><label className="flex items-center gap-3 text-sm"><span className="muted">Time window</span><select className="field !w-auto !py-2" value={days} onChange={e=>setDays(e.target.value)}><option value="7">Next 7 days</option><option value="14">Next 14 days</option></select></label><button className="btn-secondary" onClick={()=>void fetchPage(1,false)} disabled={busy}><RefreshCw size={15}/> Refresh</button><span className="muted text-xs">{pageInfo?.total? `${pageInfo.total.toLocaleString()} scheduled entries`:`${items.length} entries loaded`}</span></div>
  {error&&<div className="mb-5 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200" role="alert">{error}</div>}
  {busy?<div className="surface flex items-center justify-center gap-2 p-12 muted"><LoaderCircle size={20} className="animate-spin"/>Loading releases…</div>:grouped.length? <div className="space-y-8">{grouped.map(([day,group])=><section key={day}><div className="mb-3 flex items-center justify-between"><h2 className="section-title">{dateLabel(day)}</h2><span className="muted text-xs">{group.length} episodes</span></div><div className="grid gap-3 md:grid-cols-2">{group.map((a,i)=><EpisodeRow key={`${a.slug}-${a.airingEpisode}-${a.airingAt}-${i}`} anime={a}/>)}</div></section>)}</div>:<div className="surface p-10 text-center"><CalendarDays size={28} className="mx-auto text-violet-300"/><h2 className="mt-3 font-bold">No upcoming releases found</h2><p className="muted mt-2 text-sm">AniList may have no entries for this time window. Try 14 days or browse the full catalogue.</p><Link href="/browse" className="btn-primary mt-5">Browse anime</Link></div>}
  {pageInfo?.hasNextPage&&<div className="mt-8 flex justify-center"><button className="btn-secondary" disabled={moreBusy||busy} onClick={()=>void fetchPage((pageInfo?.currentPage??1)+1,true)}>{moreBusy?<><LoaderCircle size={16} className="animate-spin"/>Loading…</>:<><ChevronDown size={16}/> Load more episodes</>}</button></div>}
 </>;
}
