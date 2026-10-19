"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, Sparkles, ChevronRight, TrendingUp, CalendarDays, LoaderCircle, Clock3 } from "lucide-react";
import AnimeSection from "@/components/AnimeSection";
import type { Anime } from "@/lib/catalog";
import AnimeCard from "@/components/AnimeCard";
import { useAnimeCatalog } from "@/lib/useAnimeCatalog";

type AiringAnime = Anime & { airingAt: number; airingEpisode: number; timeUntilAiring: number };
type FeedMode = "TRENDING_DESC" | "POPULARITY_DESC" | "SCORE_DESC";
const modes: {label:string;sort:FeedMode}[] = [
 {label:"Trending",sort:"TRENDING_DESC"},
 {label:"Most popular",sort:"POPULARITY_DESC"},
 {label:"Top rated",sort:"SCORE_DESC"},
];
function currentSeason() {
 const month=new Date().getMonth();
 return month<3?"WINTER":month<6?"SPRING":month<9?"SUMMER":"FALL";
}
function UpcomingEpisode({anime}:{anime:AiringAnime}) {
 const d=new Date(anime.airingAt*1000);
 return <Link href={`/anime/${anime.slug}`} className="surface group flex items-center gap-3 p-3 transition hover:border-violet-400/40 hover:bg-white/[0.04]">
  <div className="h-[76px] w-[55px] shrink-0 overflow-hidden rounded-lg bg-zinc-900">{anime.coverImage?<img src={anime.coverImage} alt="" className="h-full w-full object-cover" loading="lazy"/>:<div className="h-full w-full" style={{background:`linear-gradient(145deg,${anime.color},#111)`}}/>}</div>
  <div className="min-w-0 flex-1"><div className="line-clamp-2 text-sm font-bold group-hover:text-violet-200">{anime.title}</div><div className="muted mt-1 text-xs">Episode {anime.airingEpisode} · {anime.type}</div><div className="mt-2 inline-flex items-center gap-1 text-xs text-violet-300"><Clock3 size={12}/>{d.toLocaleString([], {weekday:"short",hour:"2-digit",minute:"2-digit",month:"short",day:"numeric"})}</div></div>
 </Link>;
}
export default function HomePage() {
 const {items,loading,source}=useAnimeCatalog();
 const [mode,setMode]=useState<FeedMode>("TRENDING_DESC");
 const [ranking,setRanking]=useState<Anime[]>([]);
 const [rankLoading,setRankLoading]=useState(true);
 const [seasonItems,setSeasonItems]=useState<Anime[]>([]);
 const [recentItems,setRecentItems]=useState<Anime[]>([]);
 const [upcoming,setUpcoming]=useState<Anime[]>([]);
 const [airing,setAiring]=useState<AiringAnime[]>([]);
 const [secondaryLoading,setSecondaryLoading]=useState(true);
 const featured=items[0];

 useEffect(()=>{
  let alive=true;
  fetch(`/api/anime?sort=${mode}&perPage=12`).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(alive)setRanking(Array.isArray(d.items)?d.items:[])}).catch(()=>{if(alive)setRanking([])}).finally(()=>{if(alive)setRankLoading(false)});
  return()=>{alive=false};
 },[mode]);

 useEffect(()=>{
  let alive=true;
  const year=new Date().getFullYear();
  Promise.all([
   fetch(`/api/anime?season=${currentSeason()}&seasonYear=${year}&sort=POPULARITY_DESC&perPage=12`).then(r=>r.ok?r.json():Promise.reject()),
   fetch(`/api/anime?sort=UPDATED_AT_DESC&perPage=12`).then(r=>r.ok?r.json():Promise.reject()),
   fetch(`/api/anime?status=NOT_YET_RELEASED&sort=POPULARITY_DESC&perPage=12`).then(r=>r.ok?r.json():Promise.reject()),
   fetch(`/api/anime?schedule=1&days=7&perPage=12`).then(r=>r.ok?r.json():Promise.reject()),
  ]).then(([season,recent,coming,airingData])=>{
    if(!alive)return;
    setSeasonItems(Array.isArray(season.items)?season.items:[]);
    setRecentItems(Array.isArray(recent.items)?recent.items:[]);
    setUpcoming(Array.isArray(coming.items)?coming.items:[]);
    setAiring(Array.isArray(airingData.items)?airingData.items:[]);
  }).catch(()=>{}).finally(()=>{if(alive)setSecondaryLoading(false)});
  return()=>{alive=false};
 },[]);

 return <>
  <section className="hero"><div className={"hero-art " + ((featured?.bannerImage || featured?.coverImage) ? "has-image" : "")} style={(featured?.bannerImage || featured?.coverImage) ? { backgroundImage: 'linear-gradient(90deg,rgba(10,8,18,.12),rgba(10,8,18,.32)),url("' + (featured?.bannerImage || featured?.coverImage) + '")', backgroundSize: "cover", backgroundPosition: "center" } : undefined} aria-hidden="true"/><div className="hero-content">
   <div className="eyebrow flex items-center gap-2"><Sparkles size={15}/> Your next obsession starts here</div>
   <h1>Find your next<br/><span className="text-violet-300">anime world.</span></h1>
   <p>Discover stories, explore hidden gems, check upcoming episodes, and keep your watchlist in one place. Real titles and artwork powered by AniList.</p>
   <div className="mt-6 flex flex-wrap gap-3"><Link className="btn-primary" href={featured?`/anime/${featured.slug}`:"/browse"}><Play size={17} fill="currentColor"/> Explore featured</Link><Link className="btn-secondary" href="/browse">Browse catalogue <ChevronRight size={16}/></Link></div>
   <div className="mt-8 flex flex-wrap gap-2">{["Action","Adventure","Comedy","Fantasy","Mystery","Romance","Sci-Fi"].map(g=><Link className="pill transition hover:border-violet-400 hover:text-white" key={g} href={`/browse?genre=${encodeURIComponent(g)}`}>{g}</Link>)}</div>
  </div></section>

  <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
   <div className="surface p-4"><div className="text-xl font-black text-violet-300">{loading?"…":items.length}</div><div className="muted mt-1 text-sm">Titles loaded in catalogue</div></div>
   <div className="surface p-4"><div className="text-xl font-black text-violet-300">AniList</div><div className="muted mt-1 text-sm">Live metadata and artwork</div></div>
   <div className="surface p-4"><div className="text-xl font-black text-violet-300">{secondaryLoading?"…":airing.length}</div><div className="muted mt-1 text-sm">Scheduled releases found for 7 days</div></div>
  </div>

  <section className="mt-10">
   <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="section-title flex items-center gap-2"><TrendingUp size={20} className="text-violet-300"/>Popular Anime</h2><div className="flex flex-wrap gap-2">{modes.map(m=><button key={m.sort} type="button" onClick={()=>setMode(m.sort)} className={`btn-secondary !px-3 !py-2 text-xs ${mode===m.sort?"!border-violet-400/60 !bg-violet-500/15 !text-white":""}`}>{m.label}</button>)}</div></div>
   {rankLoading?<div className="surface flex items-center gap-2 p-8 muted"><LoaderCircle className="animate-spin" size={18}/>Loading anime rankings…</div>:<div className="anime-grid">{ranking.map(a=><AnimeCard key={a.slug} anime={a}/>)}</div>}
  </section>

  <section className="mt-11">
   <div className="mb-5 flex items-center justify-between gap-3"><h2 className="section-title flex items-center gap-2"><CalendarDays size={20} className="text-violet-300"/>Upcoming episodes</h2><Link href="/schedule" className="muted inline-flex items-center gap-1 text-sm hover:text-white">Full schedule <ChevronRight size={15}/></Link></div>
   {secondaryLoading?<div className="surface flex items-center gap-2 p-7 muted"><LoaderCircle size={18} className="animate-spin"/>Loading airing schedule…</div>:airing.length?<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{airing.slice(0,9).map((a,i)=><UpcomingEpisode key={`${a.slug}-${a.airingEpisode}-${i}`} anime={a}/>)}</div>:<div className="surface p-6"><p className="font-semibold">No upcoming episodes returned for this week.</p><p className="muted mt-1 text-sm">Check the full schedule or browse currently airing anime.</p><Link href="/schedule" className="btn-secondary mt-4">Open airing schedule</Link></div>}
  </section>

  <AnimeSection title="Recently updated anime" items={recentItems}/>
  <AnimeSection title="Current season" items={seasonItems}/>
  <AnimeSection title="All-time favourites" items={items.slice(0,12)}/>
  <AnimeSection title="Coming soon" items={upcoming}/>
  <div className="surface mt-12 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 font-bold"><TrendingUp size={18} className="text-violet-300"/> Build your watchlist</div><p className="muted mt-1 text-sm">Save titles in this browser or sync them to your account when signed in.</p></div><Link className="btn-primary" href="/bookmarks">Open my list</Link></div>
  <p className="muted mt-7 text-xs">Catalogue and ratings are sourced from AniList. Streaming availability depends on official providers and your region; this project does not host anime episodes.</p>
 </>;
}
