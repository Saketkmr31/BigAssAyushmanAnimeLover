"use client";
import Link from "next/link";
import type { Anime } from "@/lib/catalog";
import { Star, Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
export default function AnimeCard({anime}:{anime:Anime}) {
 const [saved,setSaved]=useState(false);
 useEffect(()=>{try{const list=JSON.parse(localStorage.getItem("baa-bookmarks")||"[]") as string[];setSaved(list.includes(anime.slug))}catch{}},[anime.slug]);
 function toggleBookmark(e:React.MouseEvent<HTMLButtonElement>){e.preventDefault();e.stopPropagation();let list:string[]=[];try{list=JSON.parse(localStorage.getItem("baa-bookmarks")||"[]")}catch{};list=saved?list.filter(x=>x!==anime.slug):[...new Set([...list,anime.slug])];localStorage.setItem("baa-bookmarks",JSON.stringify(list));setSaved(!saved);window.dispatchEvent(new Event("baa-bookmarks-changed"));}
 return <article className="anime-card">
  <Link href={`/anime/${anime.slug}`} className="block">
   <div className="poster" style={{"--poster":anime.color} as React.CSSProperties}>
    {anime.coverImage ? <img className="poster-image" src={anime.coverImage} alt={`${anime.title} cover`} loading="lazy"/> : <span className="poster-title">{anime.title}</span>}
    <span className="poster-badge">{anime.type}</span><button className="poster-bookmark" aria-label={saved?"Remove bookmark":"Add bookmark"} title={saved?"Remove bookmark":"Add bookmark"} onClick={toggleBookmark}><Bookmark size={16} className={saved?"fill-white":""}/></button>
   </div>
   <div className="card-title">{anime.title}</div>
  </Link>
  <div className="card-meta flex items-center justify-between gap-1"><span>{anime.status}</span><span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber-300 text-amber-300"/>{anime.rating}</span></div>
 </article>;
}
