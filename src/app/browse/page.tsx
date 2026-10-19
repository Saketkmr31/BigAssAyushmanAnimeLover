"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, LoaderCircle, ChevronDown, ArrowUpDown } from "lucide-react";
import { genres } from "@/lib/catalog";
import { useAnimeCatalog } from "@/lib/useAnimeCatalog";
import AnimeCard from "@/components/AnimeCard";

type PageInfo = { currentPage: number; hasNextPage: boolean; total?: number; lastPage?: number };
const formats=["TV","TV_SHORT","MOVIE","OVA","ONA","SPECIAL","MUSIC"];
const statuses=[{label:"Ongoing",value:"RELEASING"},{label:"Completed",value:"FINISHED"},{label:"Upcoming",value:"NOT_YET_RELEASED"},{label:"Cancelled",value:"CANCELLED"},{label:"Hiatus",value:"HIATUS"}];
const sorts=[{label:"Most popular",value:"POPULARITY_DESC"},{label:"Trending",value:"TRENDING_DESC"},{label:"Top rated",value:"SCORE_DESC"},{label:"Recently updated",value:"UPDATED_AT_DESC"},{label:"Newest",value:"START_DATE_DESC"},{label:"Most favourited",value:"FAVOURITES_DESC"}];

export default function BrowsePage() {
 const {items,loading,source,loadMore,loadingMore,hasMore,totalAvailable}=useAnimeCatalog();
 const [searchResults,setSearchResults]=useState<typeof items|null>(null);
 const [searchPageInfo,setSearchPageInfo]=useState<PageInfo|null>(null);
 const [searching,setSearching]=useState(false);
 const [query,setQuery]=useState("");
 const [genre,setGenre]=useState("All genres");
 const [type,setType]=useState("All types");
 const [status,setStatus]=useState("Any status");
 const [year,setYear]=useState("Any year");
 const [sort,setSort]=useState("POPULARITY_DESC");
 const [requestError,setRequestError]=useState("");

 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  const initialGenre=params.get("genre");
  const initialSearch=params.get("search");
  if(initialGenre&&genres.includes(initialGenre))setGenre(initialGenre);
  if(initialSearch)setQuery(initialSearch);
  if(initialGenre||initialSearch) {
   const timer=window.setTimeout(()=>void loadRemote(1,{genre:initialGenre||"All genres",query:initialSearch||""}),0);
   return()=>window.clearTimeout(timer);
  }
  // Deliberately load once for URL-supplied filters; no scrape or bulk dump.
 },[]);

 function buildParams(page:number, overrides?:{genre?:string;query?:string}) {
  const selectedGenre=overrides?.genre??genre;
  const selectedQuery=overrides?.query??query;
  const params=new URLSearchParams({page:String(page),perPage:"30",sort});
  if(selectedQuery.trim())params.set("search",selectedQuery.trim());
  if(selectedGenre!=="All genres")params.set("genre",selectedGenre);
  if(type!=="All types")params.set("format",type);
  if(status!=="Any status")params.set("status",status);
  if(year!=="Any year")params.set("seasonYear",year);
  return params.toString();
 }

 async function loadRemote(page:number,overrides?:{genre?:string;query?:string}) {
  setSearching(true);setRequestError("");
  try {
   const response=await fetch(`/api/anime?${buildParams(page,overrides)}`);
   if(!response.ok)throw new Error("The live catalogue request failed. Please retry.");
   const data=await response.json();
   if(!Array.isArray(data.items))throw new Error("The catalogue returned an unexpected response.");
   setSearchResults(current=>{
    if(page===1)return data.items;
    const existing=current??[];
    const seen=new Set(existing.map(a=>a.slug));
    return [...existing,...data.items.filter((a: (typeof items)[number])=>!seen.has(a.slug))];
   });
   setSearchPageInfo(data.pageInfo??null);
  } catch(e) { setRequestError(e instanceof Error?e.message:"Could not load catalogue."); }
  finally {setSearching(false);}
 }

 const visibleItems=searchResults ?? items;
 const filtered=useMemo(()=>visibleItems.filter(a=>(a.title.toLowerCase().includes(query.toLowerCase())||a.alt.toLowerCase().includes(query.toLowerCase()))&&(genre==="All genres"||a.genre.includes(genre))&&(type==="All types"||a.type===type)&&(status==="Any status"||a.status===status||(status==="RELEASING"&&a.status==="Ongoing")||(status==="FINISHED"&&a.status==="Completed"))&&(year==="Any year"||String(a.year)===year)),[visibleItems,query,genre,type,status,year]);

 function reset() {
  setQuery("");setGenre("All genres");setType("All types");setStatus("Any status");setYear("Any year");setSort("POPULARITY_DESC");setSearchResults(null);setSearchPageInfo(null);setRequestError("");
  window.history.replaceState({}, "", "/browse");
 }
 const selectedTotal=searchPageInfo?.total??totalAvailable;

 return <><div className="mb-7"><div className="eyebrow">Discover</div><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Browse anime</h1><p className="muted mt-2">Search the live catalogue and combine genre, format, release status, year, and ranking filters.</p><p className="muted mt-1 text-xs">{loading?"Loading live catalogue…":`${visibleItems.length} titles loaded${selectedTotal? ` · ${selectedTotal.toLocaleString()} matching titles on AniList`:""} · ${source}`}</p></div>
  <section className="surface mb-8 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
   <label className="relative sm:col-span-2 lg:col-span-2"><span className="sr-only">Search titles</span><Search size={17} className="muted absolute left-3 top-3.5"/><input className="field pl-10" placeholder="Search anime titles..." value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void loadRemote(1)}}}/></label>
   <label className="block text-xs muted">Genre<select className="field mt-1.5" value={genre} onChange={e=>setGenre(e.target.value)}><option>All genres</option>{genres.map(g=><option key={g}>{g}</option>)}</select></label>
   <label className="block text-xs muted">Format<select className="field mt-1.5" value={type} onChange={e=>setType(e.target.value)}><option>All types</option>{formats.map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}</select></label>
   <label className="block text-xs muted">Release status<select className="field mt-1.5" value={status} onChange={e=>setStatus(e.target.value)}><option value="Any status">Any status</option>{statuses.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
   <label className="block text-xs muted">Year<select className="field mt-1.5" value={year} onChange={e=>setYear(e.target.value)}><option>Any year</option>{Array.from({length:40},(_,i)=>String(new Date().getFullYear()-i)).map(y=><option key={y}>{y}</option>)}</select></label>
   <label className="block text-xs muted"><span className="inline-flex items-center gap-1"><ArrowUpDown size={13}/> Sort by</span><select className="field mt-1.5" value={sort} onChange={e=>setSort(e.target.value)}>{sorts.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
   <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-4"><button className="btn-primary" disabled={searching} onClick={()=>void loadRemote(1)}><Search size={16}/>{searching?"Searching…":"Search / Apply filters"}</button><button className="btn-secondary" onClick={reset}><SlidersHorizontal size={16}/> Reset</button></div>
  </section>
  {requestError&&<div role="alert" className="mb-5 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">{requestError}</div>}
  <div className="mb-4 flex items-center justify-between gap-3"><h2 className="section-title">{searchResults===null?"Anime catalogue":"Search results"}</h2><span className="muted text-sm">{filtered.length} shown</span></div>
  {filtered.length?<div className="anime-grid">{filtered.map(a=><AnimeCard key={a.slug} anime={a}/>)}</div>:<div className="surface p-10 text-center"><p className="font-bold">No titles found</p><p className="muted mt-2 text-sm">Try another query, change your filters, or reset the catalogue.</p></div>}
  <div className="mt-8 flex flex-col items-center gap-2">
   {searchResults!==null ? (searchPageInfo?.hasNextPage ? <button className="btn-secondary" disabled={searching} onClick={()=>void loadRemote((searchPageInfo?.currentPage??1)+1)}>{searching?<><LoaderCircle size={16} className="animate-spin"/> Loading…</>:<><ChevronDown size={16}/> Load more results</>}</button> : <p className="muted text-xs">{searchResults.length?"End of available results.":"No matching anime was returned."}</p>) : (hasMore ? <button className="btn-secondary" disabled={loading||loadingMore} onClick={()=>void loadMore()}>{loadingMore?<><LoaderCircle size={16} className="animate-spin"/> Loading more anime…</>:<><ChevronDown size={16}/> Load more anime</>}</button> : <p className="muted text-xs">End of the available catalogue pages.</p>)}
  </div>
 </>;
}
