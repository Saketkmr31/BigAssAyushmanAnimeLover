"use client";
import Link from "next/link";
import { Play, Sparkles, ChevronRight, TrendingUp } from "lucide-react";
import AnimeSection from "@/components/AnimeSection";
import { useAnimeCatalog } from "@/lib/useAnimeCatalog";
export default function HomePage() {
 const {items,loading,source}=useAnimeCatalog();
 const featured=items[0];
 return <>
  <section className="hero"><div className="hero-art" aria-hidden="true"/><div className="hero-content">
   <div className="eyebrow flex items-center gap-2"><Sparkles size={15}/> Your next obsession starts here</div>
   <h1>Find your next<br/><span className="text-violet-300">anime world.</span></h1>
   <p>Discover new stories, explore hidden gems, and keep your watchlist in one place. Real titles, artwork and metadata powered by AniList.</p>
   <div className="mt-6 flex flex-wrap gap-3"><Link className="btn-primary" href={featured?`/anime/${featured.slug}`:"/browse"}><Play size={17} fill="currentColor"/> Explore featured</Link><Link className="btn-secondary" href="/browse">Browse catalogue <ChevronRight size={16}/></Link></div>
   <div className="mt-8 flex flex-wrap gap-2"><span className="pill">Fantasy</span><span className="pill">Action</span><span className="pill">Romance</span><span className="pill">Sci-Fi</span></div>
  </div></section>
  <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="surface p-4"><div className="text-xl font-black text-violet-300">{items.length}+</div><div className="muted mt-1 text-sm">Titles loaded on this page</div></div><div className="surface p-4"><div className="text-xl font-black text-violet-300">Live</div><div className="muted mt-1 text-sm">Anime metadata integration</div></div><div className="surface p-4"><div className="text-xl font-black text-violet-300">{loading?"Connecting…":source}</div><div className="muted mt-1 text-sm">Catalogue source status</div></div></div>
  <AnimeSection title="Popular Anime" items={items.slice(0,12)}/>
  <AnimeSection title="More to Discover" items={items.slice(12,24)}/>
  <div className="surface mt-12 flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 font-bold"><TrendingUp size={18} className="text-violet-300"/> Build your watchlist</div><p className="muted mt-1 text-sm">Save titles locally and pick up where you left off.</p></div><Link className="btn-primary" href="/profile#bookmarks">Open my list</Link></div>
 </>;
}
