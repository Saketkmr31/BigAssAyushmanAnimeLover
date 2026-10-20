"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, LoaderCircle, Search, BookOpen } from "lucide-react";
import type { Anime } from "@/lib/catalog";
import AnimeCard from "@/components/AnimeCard";
const letters=["#","0-9",..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
type PageInfo={currentPage:number;hasNextPage:boolean;total?:number};
export default function AZPage() {
 const [items,setItems]=useState<Anime[]>([]);
 const [pageInfo,setPageInfo]=useState<PageInfo|null>(null);
 const [loading,setLoading]=useState(true);
 const [loadingMore,setLoadingMore]=useState(false);
 const [active,setActive]=useState("A");
 const [query,setQuery]=useState("");
 const [error,setError]=useState("");
 async function fetchPage(page:number,append:boolean){
  if(append)setLoadingMore(true);else setLoading(true);
  setError("");
  try{
   const r=await fetch(`/api/anime?sort=TITLE_ENGLISH&page=${page}&perPage=30`);
   if(!r.ok)throw new Error("Couldn't fetch the alphabetic catalogue.");
   const d=await r.json();
   if(!Array.isArray(d.items))throw new Error("Unexpected catalogue response.");
   setItems(old=>{if(!append)return d.items;const seen=new Set(old.map(x=>x.slug));return [...old,...d.items.filter((x:Anime)=>!seen.has(x.slug))]});
   setPageInfo(d.pageInfo??null);
  }catch(e){setError(e instanceof Error?e.message:"Unable to fetch alphabetic catalogue.");}
  finally{setLoading(false);setLoadingMore(false);}
 }
 useEffect(()=>{
  const requested=new URLSearchParams(window.location.search).get("letter");
  const decoded=requested==="%23"?"#":requested;
  if(decoded&&letters.includes(decoded.toUpperCase()))setActive(decoded==="#"?"#":decoded.toUpperCase());
  void fetchPage(1,false);
 },[]);
 const list=useMemo(()=>items.filter(a=>{
  const title=a.title.trim().toUpperCase();
  const letter=active==="#"?!/^[A-Z0-9]/.test(title):active==="0-9"?/^\d/.test(title):title.startsWith(active);
  return letter&&(title.toLowerCase().includes(query.toLowerCase())||a.alt.toLowerCase().includes(query.toLowerCase()));
 }),[items,active,query]);
 return <><div className="mb-7"><div className="eyebrow flex items-center gap-2"><BookOpen size={15}/> Catalogue index</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">Anime A–Z List</h1><p className="muted mt-2">Alphabetically sorted AniList catalogue. Load additional pages to reveal more titles.</p><p className="muted mt-1 text-xs">{loading?"Loading catalogue…":`${items.length.toLocaleString()} loaded${pageInfo?.total? ` of ${pageInfo.total.toLocaleString()} available titles`:""}`}</p></div>
  <label className="relative mb-5 block max-w-xl"><Search size={17} className="muted absolute left-3 top-3.5"/><input className="field pl-10" placeholder="Search loaded titles..." value={query} onChange={e=>setQuery(e.target.value)}/></label>
  <div className="mb-8 flex flex-wrap gap-2">{letters.map(l=><button key={l} type="button" onClick={()=>setActive(l)} className={`letter ${active===l?"selected":""}`}>{l}</button>)}</div>
  {error&&<div className="mb-5 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200" role="alert">{error}</div>}
  <div className="mb-4 flex items-center justify-between gap-3"><h2 className="section-title">Titles starting with {active}</h2><span className="muted text-sm">{list.length} titles in loaded pages</span></div>
  {list.length?<div className="anime-grid">{list.map(a=><AnimeCard key={a.slug} anime={a}/>)}</div>:<div className="surface p-8 text-center"><p className="font-bold">{loading?"Loading titles…":"No matching loaded titles"}</p><p className="muted mt-2 text-sm">Try another letter, change your search, or load more alphabetic pages.</p></div>}
  <div className="mt-8 flex justify-center">{pageInfo?.hasNextPage?<button className="btn-secondary" disabled={loading||loadingMore} onClick={()=>void fetchPage((pageInfo?.currentPage??1)+1,true)}>{loadingMore?<><LoaderCircle size={16} className="animate-spin"/> Loading more anime…</>:<><ChevronDown size={16}/> Load more anime</>}</button>:!loading?<p className="muted text-xs">End of AniList title pages.</p>:null}</div>
 </>;
}
