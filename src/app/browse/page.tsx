"use client";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { genres } from "@/lib/catalog";
import { useAnimeCatalog } from "@/lib/useAnimeCatalog";
import AnimeCard from "@/components/AnimeCard";
export default function BrowsePage() {
 const {items,loading,source}=useAnimeCatalog();
 const [searchResults,setSearchResults]=useState<typeof items|null>(null); const [searching,setSearching]=useState(false);
 const [query,setQuery]=useState(""); const [genre,setGenre]=useState("All genres"); const [type,setType]=useState("All types"); const [status,setStatus]=useState("Any status"); const [year,setYear]=useState("Any year");
 const visibleItems=searchResults ?? items;
 const filtered=useMemo(()=>visibleItems.filter(a=>(a.title.toLowerCase().includes(query.toLowerCase())||a.alt.toLowerCase().includes(query.toLowerCase()))&&(genre==="All genres"||a.genre.includes(genre))&&(type==="All types"||a.type===type)&&(status==="Any status"||a.status===status)&&(year==="Any year"||String(a.year)===year)),[visibleItems,query,genre,type,status,year]);
 const selectClass="field";
 return <><div className="mb-7"><div className="eyebrow">Discover</div><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Browse anime</h1><p className="muted mt-2">Find your next favourite by title, genre, format, or year.</p><p className="muted mt-1 text-xs">{loading?"Loading live catalogue…":`${source} · ${visibleItems.length} titles loaded`}</p></div>
  <section className="surface mb-8 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
   <label className="relative sm:col-span-2 lg:col-span-1"><span className="sr-only">Search titles</span><Search size={17} className="muted absolute left-3 top-3.5"/><input className="field pl-10" placeholder="Search AniList titles..." value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();setSearching(true);fetch(`/api/anime?search=${encodeURIComponent(query)}&perPage=30`).then(r=>r.ok?r.json():Promise.reject()).then(d=>setSearchResults(d.items||[])).catch(()=>setSearchResults([])).finally(()=>setSearching(false))}}}/></label>
   <select className={selectClass} value={genre} onChange={e=>setGenre(e.target.value)}><option>All genres</option>{genres.map(g=><option key={g}>{g}</option>)}</select>
   <select className={selectClass} value={type} onChange={e=>setType(e.target.value)}><option>All types</option>{["TV","TV_SHORT","MOVIE","OVA","ONA","SPECIAL","MUSIC"].map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}</select>
   <select className={selectClass} value={status} onChange={e=>setStatus(e.target.value)}><option>Any status</option>{["Ongoing","Completed","NOT_YET_RELEASED","CANCELLED","HIATUS"].map(s=><option key={s}>{s}</option>)}</select>
   <select className={selectClass} value={year} onChange={e=>setYear(e.target.value)}><option>Any year</option>{Array.from({length:15},(_,i)=>String(new Date().getFullYear()-i)).map(y=><option key={y}>{y}</option>)}</select>
   <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-5"><button className="btn-primary" disabled={searching} onClick={()=>{setSearching(true);fetch(`/api/anime?search=${encodeURIComponent(query)}&perPage=30`).then(r=>r.ok?r.json():Promise.reject()).then(d=>setSearchResults(d.items||[])).catch(()=>setSearchResults([])).finally(()=>setSearching(false))}}><Search size={16}/>{searching?"Searching AniList…":"Search AniList"}</button><button className="btn-secondary" onClick={()=>{setQuery("");setGenre("All genres");setType("All types");setStatus("Any status");setYear("Any year");setSearchResults(null)}}><SlidersHorizontal size={16}/> Reset filters</button></div>
  </section>
  <div className="mb-4 flex items-center justify-between"><h2 className="section-title">Anime catalogue</h2><span className="muted text-sm">{filtered.length} results</span></div>
  {filtered.length?<div className="anime-grid">{filtered.map(a=><AnimeCard key={a.slug} anime={a}/>)}</div>:<div className="surface p-10 text-center"><p className="font-bold">No titles found</p><p className="muted mt-2 text-sm">Try another search or reset your filters.</p></div>}
 </>;
}
