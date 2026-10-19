"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, Search, X, Bookmark, Compass, House, ListVideo } from "lucide-react";
export default function Header() {
 const [open,setOpen] = useState(false);
 return <header className="site-header">
  <div className="container-app flex h-[70px] items-center justify-between gap-5">
   <Link href="/" className="logo-mark shrink-0"><span className="logo-icon">BA</span><span>BigAss<span className="text-violet-400">AyushmanAnime</span>Lover</span></Link>
   <nav className="desktop-nav flex items-center gap-6">
    <Link className="nav-link" href="/">Home</Link><Link className="nav-link" href="/browse">Browse</Link><Link className="nav-link" href="/az-list">A–Z List</Link><Link className="nav-link" href="/profile#bookmarks">Bookmarks</Link>
   </nav>
   <div className="desktop-nav flex items-center gap-3">
    <Link href="/browse" aria-label="Search anime" className="btn-secondary !p-2.5"><Search size={18}/></Link>
    <Link href="/login" className="btn-primary">Sign in</Link>
   </div>
   <div className="mobile-nav items-center gap-2">
    <Link href="/browse" className="btn-secondary !p-2.5" aria-label="Search"><Search size={18}/></Link>
    <button className="btn-secondary !p-2.5" aria-label="Open menu" onClick={()=>setOpen(!open)}>{open?<X size={20}/>:<Menu size={20}/>}</button>
   </div>
  </div>
  {open && <nav className="container-app grid gap-1 pb-4 md:hidden">
    <Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/"><House size={17} className="mr-2 inline"/>Home</Link>
    <Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/browse"><Compass size={17} className="mr-2 inline"/>Browse anime</Link>
    <Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/az-list"><ListVideo size={17} className="mr-2 inline"/>A–Z List</Link>
    <Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/profile#bookmarks"><Bookmark size={17} className="mr-2 inline"/>Bookmarks</Link>
    <Link onClick={()=>setOpen(false)} className="btn-primary mt-2" href="/login">Sign in</Link>
   </nav>}
 </header>;
}