"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, Search, X, Bookmark, Compass, House, ListVideo, UserRound, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function Header() {
 const [open, setOpen] = useState(false);
 const [signOutError, setSignOutError] = useState("");
 const { user, loading, configured, signOut } = useAuth();
 const displayName = String(user?.user_metadata?.username || user?.email?.split("@")[0] || "Account");
 const initials = displayName.slice(0, 2).toUpperCase();
 async function handleSignOut() {
  setSignOutError("");
  try { await signOut(); setOpen(false); }
  catch { setSignOutError("Couldn't sign out just now. Please retry."); }
 }
 const accountAction = user ? <>
  <Link href="/profile" className="btn-secondary !p-2.5" aria-label="My profile" title={displayName}><UserRound size={18}/></Link>
  <button onClick={handleSignOut} className="btn-secondary !p-2.5" aria-label="Sign out" title="Sign out"><LogOut size={18}/></button>
 </> : <Link href="/login" className="btn-primary">{loading && configured ? "Checking…" : "Sign in"}</Link>;
 return <header className="site-header">
  <div className="container-app flex h-[70px] items-center justify-between gap-5">
   <Link href="/" className="logo-mark shrink-0"><span className="logo-icon">BA</span><span>BigAss<span className="text-violet-400">AyushmanAnime</span>Lover</span></Link>
   <nav className="desktop-nav flex items-center gap-6">
    <Link className="nav-link" href="/">Home</Link><Link className="nav-link" href="/browse">Browse</Link><Link className="nav-link" href="/az-list">A–Z List</Link><Link className="nav-link" href="/profile#bookmarks">Bookmarks</Link>
   </nav>
   <div className="desktop-nav flex items-center gap-3">
    <Link href="/browse" aria-label="Search anime" className="btn-secondary !p-2.5"><Search size={18}/></Link>
    {accountAction}
   </div>
   <div className="mobile-nav items-center gap-2">
    <Link href="/browse" className="btn-secondary !p-2.5" aria-label="Search"><Search size={18}/></Link>
    {user && <Link href="/profile" className="btn-secondary !p-2.5" aria-label={`Profile ${initials}`}><UserRound size={18}/></Link>}
    <button className="btn-secondary !p-2.5" aria-label="Open menu" onClick={()=>setOpen(!open)}>{open?<X size={20}/>:<Menu size={20}/>}</button>
   </div>
  </div>
  {signOutError && <div role="status" className="container-app pb-2 text-sm text-rose-300">{signOutError}</div>}
  {open && <nav className="container-app grid gap-1 pb-4 md:hidden">
    <Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/"><House size={17} className="mr-2 inline"/>Home</Link>
    <Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/browse"><Compass size={17} className="mr-2 inline"/>Browse anime</Link>
    <Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/az-list"><ListVideo size={17} className="mr-2 inline"/>A–Z List</Link>
    <Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/profile#bookmarks"><Bookmark size={17} className="mr-2 inline"/>Bookmarks</Link>
    {user ? <><Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/profile"><UserRound size={17} className="mr-2 inline"/>My profile</Link><button onClick={handleSignOut} className="btn-secondary mt-2"><LogOut size={17}/> Sign out</button></> : <Link onClick={()=>setOpen(false)} className="btn-primary mt-2" href="/login">Sign in</Link>}
  </nav>}
 </header>;
}
