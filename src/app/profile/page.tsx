"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Clock3, UserRound, Trash2, ShieldCheck, LogOut } from "lucide-react";
import type { Anime } from "@/lib/catalog";
import { useAnimeCatalog } from "@/lib/useAnimeCatalog";
import AnimeCard from "@/components/AnimeCard";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
 const router=useRouter();
 const {user,loading,configured,signOut}=useAuth();
 const {items}=useAnimeCatalog(); const [tab,setTab]=useState("overview"); const [saved,setSaved]=useState<string[]>([]); const [history,setHistory]=useState<string[]>([]); const [signOutError,setSignOutError]=useState("");
 useEffect(()=>{if(!loading&&configured&&!user)router.replace("/login?next=%2Fprofile");},[loading,configured,user,router]);
 useEffect(()=>{const sync=()=>{try{setSaved(JSON.parse(localStorage.getItem("baa-bookmarks")||"[]"));setHistory(JSON.parse(localStorage.getItem("baa-history")||"[]"))}catch{setSaved([]);setHistory([])}};sync();window.addEventListener("storage",sync);window.addEventListener("baa-bookmarks-changed",sync);window.addEventListener("baa-history-changed",sync);return()=>{window.removeEventListener("storage",sync);window.removeEventListener("baa-bookmarks-changed",sync);window.removeEventListener("baa-history-changed",sync)}},[]);
 if(configured&&(loading||!user))return <div className="surface mx-auto max-w-xl p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-300"><ShieldCheck/></div><h1 className="mt-4 text-xl font-black">Loading your account</h1><p className="muted mt-2 text-sm">Checking your secure session…</p></div>;
 const titles:Anime[]=saved.map(slug=>items.find(a=>a.slug===slug)).filter((a):a is Anime=>Boolean(a)); const watched:Anime[]=history.map(slug=>items.find(a=>a.slug===slug)).filter((a):a is Anime=>Boolean(a));
 const tabs=[["overview","Overview",UserRound],["history","History",Clock3],["bookmarks","Bookmarks",Bookmark]] as const;
 function clearSaved(){localStorage.setItem("baa-bookmarks","[]");setSaved([]);window.dispatchEvent(new Event("baa-bookmarks-changed"))}
 const displayName=String(user?.user_metadata?.username||user?.email?.split("@")[0]||"Anime fan");
 async function handleSignOut(){setSignOutError("");try{await signOut();router.replace("/");router.refresh()}catch{setSignOutError("Couldn't sign out just now. Please retry.")}}
 return <><div className="mb-7"><div className="eyebrow">Your space</div><h1 className="mt-2 text-3xl font-black sm:text-4xl">My profile</h1><p className="muted mt-2">Your viewing history and bookmarks are currently saved in this browser. Cross-device sync will be a separate feature.</p></div>
 <div className="surface mb-6 flex flex-wrap items-center gap-4 p-5"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 text-xl font-black">{displayName.slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="text-lg font-bold">{displayName}</div><div className="muted break-all text-sm">{user?.email||"Guest profile"}</div>{user&&<div className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-300"><ShieldCheck size={13}/> Authenticated account</div>}</div>{user?<button className="btn-secondary" onClick={handleSignOut}><LogOut size={15}/> Sign out</button>:<Link className="btn-primary" href="/login">Sign in</Link>}</div>
 {signOutError&&<p role="alert" className="mb-4 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{signOutError}</p>}
 <div className="mb-6 flex flex-wrap gap-2">{tabs.map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`btn-secondary ${tab===id?"!border-violet-500 !bg-violet-500/15 !text-white":""}`}><Icon size={16}/>{label}</button>)}</div>
 {tab==="overview"&&<div className="grid gap-4 sm:grid-cols-3"><div className="surface p-5"><Bookmark className="text-violet-300"/><div className="mt-3 text-2xl font-black">{saved.length}</div><div className="muted text-sm">Bookmarks saved</div></div><div className="surface p-5"><Clock3 className="text-violet-300"/><div className="mt-3 text-2xl font-black">{history.length}</div><div className="muted text-sm">Recently viewed titles</div></div><div className="surface p-5"><UserRound className="text-violet-300"/><div className="mt-3 font-bold">{user?"Member":"Guest"}</div><div className="muted text-sm">{user?"Signed in": "Local-only profile"}</div></div></div>}
 {tab==="history"&&(watched.length?<><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Recently viewed</h2><button className="btn-secondary" onClick={()=>{localStorage.setItem("baa-history","[]");setHistory([]);window.dispatchEvent(new Event("baa-history-changed"))}}><Trash2 size={15}/> Clear history</button></div><div className="anime-grid">{watched.map(a=><AnimeCard key={a.slug} anime={a}/>)}</div></>:<div className="surface p-8 text-center"><Clock3 className="mx-auto text-violet-300"/><h2 className="mt-3 font-bold">Your watch history</h2><p className="muted mt-2 text-sm">Open anime details to add them to your recent history.</p></div>)}
 {tab==="bookmarks"&&(titles.length?<><div className="mb-4 flex items-center justify-between"><h2 className="section-title">Saved anime</h2><button className="btn-secondary" onClick={clearSaved}><Trash2 size={15}/> Clear</button></div><div className="anime-grid">{titles.map(a=><AnimeCard key={a.slug} anime={a}/>)}</div></>:<div className="surface p-8 text-center"><Bookmark className="mx-auto text-violet-300"/><h2 className="mt-3 font-bold">No bookmarks yet</h2><p className="muted mt-2 text-sm">Use the bookmark icon on any anime poster to save it here.</p><Link className="btn-primary mt-5" href="/browse">Browse anime</Link></div>)}
 </>;
}
