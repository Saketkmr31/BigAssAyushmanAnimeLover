"use client";
import { useMemo, useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { useAnimeCatalog } from "@/lib/useAnimeCatalog";
import AnimeCard from "@/components/AnimeCard";
const letters=["#","0-9",..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
export default function AZPage() {
 const {items,loading,loadMore,loadingMore,hasMore,totalAvailable}=useAnimeCatalog();
 const [active,setActive]=useState("A"); const [query,setQuery]=useState("");
 const list=useMemo(()=>items.filter(a=>a.title.toLowerCase().includes(query.toLowerCase())&&(active==="#"||active==="0-9"||a.title.toUpperCase().startsWith(active))),[items,active,query]);
 return <><div className="mb-7"><div className="eyebrow">Catalogue index</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">Anime A–Z List</h1><p className="muted mt-2">Browse AniList titles alphabetically. Load more pages to expand the list.</p><p className="muted mt-1 text-xs">{loading?"Loading AniList catalogue…":`${items.length} titles loaded${totalAvailable? ` · ${totalAvailable.toLocaleString()} total on AniList`:""}`}</p></div>
  <input className="field mb-5 max-w-xl" placeholder="Search loaded titles..." value={query} onChange={e=>setQuery(e.target.value)}/>
  <div className="mb-8 flex flex-wrap gap-2">{letters.map(l=><button key={l} onClick={()=>setActive(l)} className={`letter ${active===l?"selected":""}`}>{l}</button>)}</div>
  <div className="mb-4 flex items-center justify-between"><h2 className="section-title">Titles starting with {active}</h2><span className="muted text-sm">{list.length} titles</span></div>
  {list.length?<div className="anime-grid">{list.map(a=><AnimeCard key={a.slug} anime={a}/>)}</div>:<div className="surface p-8 text-center muted">No loaded titles for this letter yet. Load more pages or try another letter.</div>}
  <div className="mt-8 flex justify-center">{hasMore?<button className="btn-secondary" disabled={loading||loadingMore} onClick={()=>void loadMore()}>{loadingMore?<><LoaderCircle size={16} className="animate-spin"/> Loading more anime…</>:<><ChevronDown size={16}/> Load more anime</>}</button>:<p className="muted text-xs">End of the available catalogue pages.</p>}</div>
 </>;
}
