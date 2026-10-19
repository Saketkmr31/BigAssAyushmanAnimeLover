"use client";
import Link from "next/link";
import type { Anime } from "@/lib/catalog";
import { Star, Bookmark, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function readLocalBookmarks() {
  try {
    const data: unknown = JSON.parse(localStorage.getItem("baa-bookmarks") || "[]");
    return Array.isArray(data) ? data.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function writeLocalBookmarks(list: string[]) {
  localStorage.setItem("baa-bookmarks", JSON.stringify([...new Set(list)]));
  window.dispatchEvent(new Event("baa-bookmarks-changed"));
}
function bookmarkRow(userId: string, anime: Anime) {
  return {
    user_id: userId,
    anime_slug: anime.slug,
    anime_id: anime.id ?? ( /^\d+$/.test(anime.slug) ? Number(anime.slug) : null ),
    anime_title: anime.title,
    alt_title: anime.alt || "",
    cover_image: anime.coverImage || "",
    banner_image: anime.bannerImage || "",
    anime_type: anime.type || "TV",
    anime_status: anime.status || "Unknown",
    year: anime.year || 0,
    rating: anime.rating || "—",
    episodes: anime.episodes || 0,
    genres: anime.genre || [],
    description: anime.description || "",
    color: anime.color || "#4c1d95",
  };
}

export default function AnimeCard({ anime }: { anime: Anime }) {
 const [saved,setSaved]=useState(false);
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  let alive=true;
  const sync=async()=>{
   const local=readLocalBookmarks();
   setSaved(local.includes(anime.slug));
   const supabase=getSupabaseBrowserClient();
   if(!supabase)return;
   try {
    const {data:{session}}=await supabase.auth.getSession();
    if(!alive||!session?.user)return;
    const {data,error}=await supabase.from("user_watchlist").select("id").eq("user_id",session.user.id).eq("anime_slug",anime.slug).maybeSingle();
    if(!alive)return;
    if(error)return;
    if(data){setSaved(true);if(!local.includes(anime.slug))writeLocalBookmarks([...local,anime.slug]);return;}
    // Import a bookmark created before the user signed in into their account.
    if(local.includes(anime.slug)){
     const {error:insertError}=await supabase.from("user_watchlist").upsert(bookmarkRow(session.user.id,anime),{onConflict:"user_id,anime_slug"});
     if(!alive)return;
     if(!insertError){setSaved(true);return;}
    }
    setSaved(false);
   } catch {
    // Keep browser-local state available if the network/database is temporarily unavailable.
   }
  };
  void sync();
  const onStorage=()=>setSaved(readLocalBookmarks().includes(anime.slug));
  window.addEventListener("storage",onStorage);
  window.addEventListener("baa-bookmarks-changed",onStorage);
  return()=>{alive=false;window.removeEventListener("storage",onStorage);window.removeEventListener("baa-bookmarks-changed",onStorage);};
 },[anime.slug,anime]);

 async function toggleBookmark(event:React.MouseEvent<HTMLButtonElement>){
  event.preventDefault();event.stopPropagation();
  if(busy)return;
  setBusy(true);
  const local=readLocalBookmarks();
  const wasSaved=saved;
  const next=wasSaved?local.filter(slug=>slug!==anime.slug):[...local,anime.slug];
  writeLocalBookmarks(next);
  setSaved(!wasSaved);
  try{
   const supabase=getSupabaseBrowserClient();
   if(supabase){
    const {data:{session}}=await supabase.auth.getSession();
    if(session?.user){
     const result=wasSaved
      ? await supabase.from("user_watchlist").delete().eq("user_id",session.user.id).eq("anime_slug",anime.slug)
      : await supabase.from("user_watchlist").upsert(bookmarkRow(session.user.id,anime),{onConflict:"user_id,anime_slug"});
     if(result.error){
      // Restore the previous local state and let the user retry.
      writeLocalBookmarks(wasSaved?next.concat(anime.slug):next.filter(slug=>slug!==anime.slug));
      setSaved(wasSaved);
     }
    }
   }
  }catch{
   // Browser-local bookmark remains available without an account or network.
  }finally{setBusy(false);}
 }

 return <article className="anime-card">
  <Link href={`/anime/${anime.slug}`} className="block">
   <div className="poster" style={{"--poster":anime.color} as React.CSSProperties}>
    {anime.coverImage ? <img className="poster-image" src={anime.coverImage} alt={`${anime.title} cover`} loading="lazy"/> : <span className="poster-title">{anime.title}</span>}
    <span className="poster-badge">{anime.type}</span>
   </div>
   <div className="card-title">{anime.title}</div>
  </Link>
  <div className="flex items-center justify-between gap-2">
   <div className="card-meta flex min-w-0 flex-1 items-center justify-between gap-1"><span>{anime.status}</span><span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber-300 text-amber-300"/>{anime.rating}</span></div>
   <button type="button" className="poster-bookmark !static shrink-0" style={{position:"relative"}} aria-label={saved?"Remove bookmark":"Add bookmark"} title={saved?"Remove bookmark":"Add bookmark"} disabled={busy} onClick={toggleBookmark}>{busy?<LoaderCircle size={16} className="animate-spin"/>:<Bookmark size={16} className={saved?"fill-white":""}/>}</button>
  </div>
 </article>;
}
