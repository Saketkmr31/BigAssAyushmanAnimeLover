"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Clock3, UserRound, Trash2, ShieldCheck, LogOut, Play, CheckCircle2, LoaderCircle } from "lucide-react";
import type { Anime } from "@/lib/catalog";
import { useAnimeCatalog } from "@/lib/useAnimeCatalog";
import AnimeCard from "@/components/AnimeCard";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type DbWatchlistRow = {
  anime_slug: string; anime_id?: number | null; anime_title: string; alt_title?: string | null;
  cover_image?: string | null; banner_image?: string | null; anime_type?: string | null;
  anime_status?: string | null; year?: number | null; rating?: string | null; episodes?: number | null;
  genres?: string[] | null; description?: string | null; color?: string | null;
};
type DbProgressRow = {
  anime_slug: string; anime_id?: number | null; anime_title: string; episode_number: number;
  current_time_seconds: number; duration_seconds: number; completed: boolean; updated_at?: string;
};
function readArray(key:string):string[] {
  try { const parsed:unknown=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(parsed)?parsed.filter((v):v is string=>typeof v==="string"):[]; } catch { return []; }
}
function readData(key:string):Record<string,Anime> {
  try { const parsed:unknown=JSON.parse(localStorage.getItem(key)||"{}");return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed as Record<string,Anime>:{}; } catch { return {}; }
}
function fromRow(row:DbWatchlistRow):Anime {
  return {
    id:row.anime_id??( /^\d+$/.test(row.anime_slug)?Number(row.anime_slug):undefined ),
    slug:row.anime_slug,title:row.anime_title,alt:row.alt_title||"",type:row.anime_type||"TV",
    status:row.anime_status||"Unknown",year:row.year||0,rating:row.rating||"—",episodes:row.episodes||0,
    genre:row.genres||[],description:row.description||"",color:row.color||"#4c1d95",
    coverImage:row.cover_image||"",bannerImage:row.banner_image||"",source:"Supabase watchlist"
  };
}
export default function ProfilePage() {
 const router=useRouter();
 const {user,loading,configured,signOut}=useAuth();
 const {items}=useAnimeCatalog();
 const [tab,setTab]=useState("overview");
 const [saved,setSaved]=useState<string[]>([]);
 const [history,setHistory]=useState<string[]>([]);
 const [savedItems,setSavedItems]=useState<Anime[]>([]);
 const [historyItems,setHistoryItems]=useState<Anime[]>([]);
 const [progress,setProgress]=useState<DbProgressRow[]>([]);
 const [dataLoading,setDataLoading]=useState(true);
 const [signOutError,setSignOutError]=useState("");
 const [dataError,setDataError]=useState("");

 useEffect(()=>{if(!loading&&configured&&!user)router.replace("/login?next=%2Fprofile");},[loading,configured,user,router]);

 useEffect(()=>{
  const onHash=()=>{const key=window.location.hash.replace("#","");if(["overview","history","bookmarks"].includes(key))setTab(key);};
  onHash();window.addEventListener("hashchange",onHash);return()=>window.removeEventListener("hashchange",onHash);
 },[]);

 useEffect(()=>{
  let alive=true;
  async function sync(){
   setDataLoading(true);setDataError("");
   const localSaved=readArray("baa-bookmarks");
   const localHistory=readArray("baa-history");
   const localSavedData=readData("baa-bookmark-data");
   const localHistoryData=readData("baa-history-data");
   const localSavedItems=localSaved.map(slug=>localSavedData[slug]||items.find(a=>a.slug===slug)).filter((a):a is Anime=>Boolean(a));
   const localHistoryItems=localHistory.map(slug=>localHistoryData[slug]||items.find(a=>a.slug===slug)).filter((a):a is Anime=>Boolean(a));
   if(alive){setSaved(localSaved);setHistory(localHistory);setSavedItems(localSavedItems);setHistoryItems(localHistoryItems);}
   const supabase=getSupabaseBrowserClient();
   if(!supabase||!user){if(alive)setDataLoading(false);return;}
   try{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.user){if(alive)setDataLoading(false);return;}
    // Import browser-local bookmarks into this account before re-reading its saved list.
    const localRows=localSaved.map(slug=>localSavedData[slug]||items.find(a=>a.slug===slug)).filter((a):a is Anime=>Boolean(a)).map(a=>({
      user_id:session.user.id,anime_slug:a.slug,anime_id:a.id??(/^\d+$/.test(a.slug)?Number(a.slug):null),
      anime_title:a.title,alt_title:a.alt||"",cover_image:a.coverImage||"",banner_image:a.bannerImage||"",
      anime_type:a.type||"TV",anime_status:a.status||"Unknown",year:a.year||0,rating:a.rating||"—",
      episodes:a.episodes||0,genres:a.genre||[],description:a.description||"",color:a.color||"#4c1d95"
    }));
    if(localRows.length)await supabase.from("user_watchlist").upsert(localRows,{onConflict:"user_id,anime_slug"});
    const [watchlistResult,progressResult]=await Promise.all([
      supabase.from("user_watchlist").select("*").eq("user_id",session.user.id).order("added_at",{ascending:false}),
      supabase.from("user_watch_progress").select("*").eq("user_id",session.user.id).order("updated_at",{ascending:false}).limit(100)
    ]);
    if(watchlistResult.error)throw watchlistResult.error;
    const rows=(watchlistResult.data||[]) as DbWatchlistRow[];
    const dbItems=rows.map(fromRow);
    const merged=new Map<string,Anime>();
    dbItems.forEach(a=>merged.set(a.slug,a));
    localSavedItems.forEach(a=>{if(!merged.has(a.slug))merged.set(a.slug,a);});
    const allItems=[...merged.values()];
    const allSlugs=allItems.map(a=>a.slug);
    const bookmarkData=Object.fromEntries(allItems.map(a=>[a.slug,a]));
    localStorage.setItem("baa-bookmarks",JSON.stringify(allSlugs));
    localStorage.setItem("baa-bookmark-data",JSON.stringify({...localSavedData,...bookmarkData}));
    const prows=(progressResult.data||[]) as DbProgressRow[];
    if(alive){setSaved(allSlugs);setSavedItems(allItems);setProgress(prows);}
    // Merge local history with account progress, preserving most recently watched titles first.
    const progressSlugs=[...new Set(prows.map(p=>p.anime_slug))];
    const newHistory=[...progressSlugs,...localHistory.filter(slug=>!progressSlugs.includes(slug))];
    const historyData={...localHistoryData};
    prows.forEach(p=>{const known=items.find(a=>a.slug===p.anime_slug)||localHistoryData[p.anime_slug];if(known)historyData[p.anime_slug]=known;else historyData[p.anime_slug]={slug:p.anime_slug,title:p.anime_title,alt:"",type:"TV",status:"Unknown",year:0,rating:"—",episodes:0,genre:[],description:"",color:"#4c1d95"};});
    localStorage.setItem("baa-history",JSON.stringify(newHistory));
    localStorage.setItem("baa-history-data",JSON.stringify(historyData));
    const finalHistory=newHistory.map(slug=>historyData[slug]||items.find(a=>a.slug===slug)).filter((a):a is Anime=>Boolean(a));
    if(alive){setHistory(newHistory);setHistoryItems(finalHistory);}
    if(progressResult.error)console.warn("Unable to load watch progress",progressResult.error.message);
   }catch(e){
    if(alive)setDataError("Saved items couldn't sync with the account right now. Browser-local bookmarks are still available.");
   }finally{if(alive)setDataLoading(false);}
  }
  void sync();
  const refresh=()=>{setSaved(readArray("baa-bookmarks"));setHistory(readArray("baa-history"));};
  window.addEventListener("storage",refresh);
  window.addEventListener("baa-bookmarks-changed",refresh);
  window.addEventListener("baa-history-changed",refresh);
  return()=>{alive=false;window.removeEventListener("storage",refresh);window.removeEventListener("baa-bookmarks-changed",refresh);window.removeEventListener("baa-history-changed",refresh);};
 },[user,items]);

 if(configured&&(loading||!user))return <div className="surface mx-auto max-w-xl p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-300"><ShieldCheck/></div><h1 className="mt-4 text-xl font-black">Loading your account</h1><p className="muted mt-2 text-sm">Checking your secure session…</p></div>;

 const tabs=[["overview","Overview",UserRound],["history","History",Clock3],["bookmarks","Bookmarks",Bookmark]] as const;
 function clearSaved(){localStorage.setItem("baa-bookmarks","[]");localStorage.setItem("baa-bookmark-data","{}");setSaved([]);setSavedItems([]);window.dispatchEvent(new Event("baa-bookmarks-changed"));}
 const displayName=String(user?.user_metadata?.username||user?.email?.split("@")[0]||"Anime fan");
 async function handleSignOut(){setSignOutError("");try{await signOut();router.replace("/");router.refresh()}catch{setSignOutError("Couldn't sign out just now. Please retry.")}}
 const latestProgress=new Map<string,DbProgressRow>();progress.forEach(p=>{if(!latestProgress.has(p.anime_slug))latestProgress.set(p.anime_slug,p);});
 return <><div className="mb-7"><div className="eyebrow">Your space</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">My profile</h1><p className="muted mt-2">Your profile, bookmarks and authorised playback progress. Saved anime syncs with your account when the database is available.</p></div>
 <div className="surface mb-6 flex flex-wrap items-center gap-4 p-5"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 text-xl font-black">{displayName.slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="text-lg font-bold">{displayName}</div><div className="muted break-all text-sm">{user?.email||"Guest profile"}</div>{user&&<div className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300"><ShieldCheck size={13}/> Authenticated account</div>}</div>{user?<button className="btn-secondary" onClick={handleSignOut}><LogOut size={15}/> Sign out</button>:<Link className="btn-primary" href="/login">Sign in</Link>}</div>
 {signOutError&&<p role="alert" className="mb-4 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{signOutError}</p>}
 {dataError&&<p role="status" className="mb-4 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">{dataError}</p>}
 <div className="mb-6 flex flex-wrap gap-2">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>{setTab(id);window.history.replaceState({}, "", "/profile#"+id);}} className={"btn-secondary "+(tab===id?"!border-violet-500 !bg-violet-500/15 !text-white":"")}><Icon size={16}/>{label}</button>)}</div>
 {tab==="overview"&&<div className="grid gap-4 sm:grid-cols-3"><div className="surface p-5"><Bookmark className="text-violet-300"/><div className="mt-3 text-2xl font-black">{savedItems.length}</div><div className="muted text-sm">Bookmarks saved</div></div><div className="surface p-5"><Clock3 className="text-violet-300"/><div className="mt-3 text-2xl font-black">{historyItems.length}</div><div className="muted text-sm">Titles in watch history</div></div><div className="surface p-5"><Play className="text-violet-300"/><div className="mt-3 text-2xl font-black">{progress.length}</div><div className="muted text-sm">Episode progress records synced</div></div>
 {dataLoading&&<div className="surface flex items-center gap-2 p-5 text-sm muted sm:col-span-3"><LoaderCircle size={16} className="animate-spin"/>Syncing your account library…</div>}
 {progress.length>0&&<div className="surface p-5 sm:col-span-3"><h2 className="font-bold">Continue watching</h2><div className="mt-3 space-y-3">{[...latestProgress.values()].slice(0,6).map(p=>{const duration=Number(p.duration_seconds)||0;const current=Number(p.current_time_seconds)||0;const percent=duration>0?Math.max(0,Math.min(100,Math.round(current/duration*100))):0;return <div key={p.anime_slug+"-"+p.episode_number} className="flex flex-wrap items-center gap-3"><div className="min-w-0 flex-1"><div className="font-semibold">{p.anime_title}</div><div className="muted mt-1 text-xs">Episode {p.episode_number}{p.completed?" · Completed":""}</div>{duration>0&&<div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-500" style={{width:percent+"%"}}/></div>}</div><Link className="btn-secondary !px-3 !py-2 text-xs" href={"/watch/"+p.anime_slug+"-episode-"+p.episode_number}>Resume <Play size={13}/></Link></div>})}</div></div>}
 </div>}
 {tab==="history"&&(historyItems.length?<><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Recently viewed</h2><button className="btn-secondary" onClick={()=>{localStorage.setItem("baa-history","[]");localStorage.setItem("baa-history-data","{}");setHistory([]);setHistoryItems([]);window.dispatchEvent(new Event("baa-history-changed"))}}><Trash2 size={15}/> Clear history</button></div><div className="anime-grid">{historyItems.map(a=><AnimeCard key={a.slug} anime={a}/>)}</div></>:<div className="surface p-8 text-center"><Clock3 className="mx-auto text-violet-300"/><h2 className="mt-3 font-bold">Your watch history</h2><p className="muted mt-2 text-sm">Open anime details or play an approved source to add titles here.</p></div>)}
 {tab==="bookmarks"&&(savedItems.length?<><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Saved anime</h2><button className="btn-secondary" onClick={clearSaved}><Trash2 size={15}/> Clear</button></div><div className="anime-grid">{savedItems.map(a=><AnimeCard key={a.slug} anime={a}/>)}</div></>:<div className="surface p-8 text-center"><Bookmark className="mx-auto text-violet-300"/><h2 className="mt-3 font-bold">No bookmarks yet</h2><p className="muted mt-2 text-sm">Use the bookmark icon on any anime poster to save it here.</p><Link className="btn-primary mt-5" href="/browse">Browse anime</Link></div>)}
 </>;
}
