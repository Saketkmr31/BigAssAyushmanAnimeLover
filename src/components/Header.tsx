"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, UserRound, LogOut, LockKeyhole } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
export default function Header() {
 const [open,setOpen]=useState(false); const [signOutError,setSignOutError]=useState("");
 const {user,loading,configured,signOut}=useAuth();
 async function handleSignOut(){setSignOutError("");try{await signOut();setOpen(false)}catch{setSignOutError("Could not sign out. Please retry.")}}
 const action=user?<><Link href="/vault" className="btn-secondary !p-2.5" aria-label="Private vault"><LockKeyhole size={18}/></Link><Link href="/vault" className="btn-secondary !p-2.5" aria-label="My profile"><UserRound size={18}/></Link><button onClick={handleSignOut} className="btn-secondary !p-2.5" aria-label="Sign out"><LogOut size={18}/></button></>:<Link href="/login?next=%2Fvault" className="btn-primary">{loading&&configured?"Checking…":"Sign in"}</Link>;
 return <header className="site-header"><div className="container-app flex h-[70px] items-center justify-between gap-5">
 <Link href="/vault" className="logo-mark shrink-0"><span className="logo-icon">18+</span><span>Velvet<span className="text-rose-400">Vault</span></span></Link>
 <nav className="desktop-nav flex items-center gap-6"><Link className="nav-link" href="/vault">Private gallery</Link><Link className="nav-link" href="/vault">Members</Link><Link className="nav-link" href="/vault">My profile</Link></nav>
 <div className="desktop-nav flex items-center gap-3">{action}</div>
 <div className="mobile-nav items-center gap-2">{user&&<Link href="/vault" className="btn-secondary !p-2.5" aria-label="My vault"><UserRound size={18}/></Link>}<button className="btn-secondary !p-2.5" aria-label="Open menu" onClick={()=>setOpen(!open)}>{open?<X size={20}/>:<Menu size={20}/>}</button></div>
 </div>{signOutError&&<div role="status" className="container-app pb-2 text-sm text-rose-300">{signOutError}</div>}
 {open&&<nav className="container-app grid gap-1 pb-4 md:hidden"><Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/vault">Private gallery</Link><Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/vault">Member profiles</Link><Link onClick={()=>setOpen(false)} className="rounded-xl p-3 hover:bg-white/5" href="/vault">My profile</Link>{user?<button onClick={handleSignOut} className="btn-secondary mt-2"><LogOut size={17}/> Sign out</button>:<Link onClick={()=>setOpen(false)} className="btn-primary mt-2" href="/login?next=%2Fvault">Sign in</Link>}</nav>}
 </header>;
}
