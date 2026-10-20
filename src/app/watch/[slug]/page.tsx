"use client";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Lightbulb, Settings2, Subtitles, Info, ExternalLink, Tv, ShieldCheck } from "lucide-react";
import type { Anime } from "@/lib/catalog";
import { useAnimeCatalog } from "@/lib/useAnimeCatalog";
import AuthorizedVideoPlayer from "@/components/AuthorizedVideoPlayer";

export default function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolved = use(params);
  const routeSlug = decodeURIComponent(resolved.slug);
  const animeKey = routeSlug.split("-episode-")[0];
  const { items } = useAnimeCatalog();
  const [remote, setRemote] = useState<Anime | null>(null);
  const [quality, setQuality] = useState("Auto");
  const [sub, setSub] = useState("English");
  const [light, setLight] = useState(false);
  const [sourceLocale, setSourceLocale] = useState("All");

  const match = routeSlug.match(/-episode-(\d+)/);
  const episode = match ? Math.max(1, Number(match[1])) : 1;
  const local = useMemo(() => items.find((a) => a.slug === animeKey), [items, animeKey]);

  useEffect(() => {
    if (local) return;
    const id = Number(animeKey);
    if (!Number.isInteger(id) || id <= 0) return;
    let alive = true;
    fetch("/api/anime?id=" + id)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => { if (alive && d.item) setRemote(d.item); })
      .catch(() => {});
    return () => { alive = false; };
  }, [local, animeKey]);

  const anime = local || remote;
  if (!anime) return <div className="surface p-10 text-center"><h1 className="text-xl font-black">Loading player details…</h1><p className="muted mt-2 text-sm">If this stays here, return to Browse and reopen the title.</p><Link className="btn-secondary mt-5" href="/browse">Browse anime</Link></div>;

  const providers = anime.streamingProviders || [];
  const episodes = (anime.streamingEpisodes || []).filter((ep) => sourceLocale === "All" || ep.site === sourceLocale);

  return <>
    <div className="mb-4 text-sm muted"><Link href="/">Home</Link><span className="mx-2">/</span><Link href={"/anime/" + anime.slug}>{anime.title}</Link><span className="mx-2">/</span>Episode {episode}</div>
    <div className="mb-5"><div className="eyebrow">Now watching · Episode {episode}</div><h1 className="mt-2 text-2xl font-black sm:text-3xl">{anime.title} — Episode {episode}</h1><p className="muted mt-2 text-sm">Licensed-source player with authorised HLS/MP4 playback. When an episode doesn't have an approved source, official provider options are shown below.</p></div>
    <div className="layout-main">
      <div className="min-w-0">
        <div className={"player-screen relative " + (light ? "!bg-zinc-900" : "")}>
          <div className="absolute left-4 top-4 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs text-zinc-300">{anime.title} · EP {episode}</div>
          <div className="w-full px-2 pt-10"><AuthorizedVideoPlayer anime={anime} episode={episode} /></div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href={"/watch/" + anime.slug + "-episode-" + Math.max(1, episode - 1)}><ChevronLeft size={16} /> Previous</Link>
            <Link className="btn-primary" href={"/watch/" + anime.slug + "-episode-" + (episode + 1)}>Next <ChevronRight size={16} /></Link>
            <a className="btn-secondary" href={"https://www.crunchyroll.com/search?q=" + encodeURIComponent(anime.title)} target="_blank" rel="noopener noreferrer"><ExternalLink size={15} /> Find on Crunchyroll</a>
          </div>
          <button className="btn-secondary" onClick={() => setLight(!light)}><Lightbulb size={16} />{light ? "Lights on" : "Lights off"}</button>
        </div>
        <div className="surface mt-4 flex flex-wrap items-center gap-3 p-4">
          <label className="flex items-center gap-2 text-sm muted"><Subtitles size={16} /> Subtitle<select className="field !w-auto !py-2" value={sub} onChange={(e) => setSub(e.target.value)}><option>English</option><option>Hindi</option><option>Japanese</option><option>Off</option></select></label>
          <label className="flex items-center gap-2 text-sm muted"><Settings2 size={16} /> Quality<select className="field !w-auto !py-2" value={quality} onChange={(e) => setQuality(e.target.value)}><option>Auto</option><option>1080p</option><option>720p</option><option>480p</option></select></label>
          <p className="muted text-xs">Quality and subtitle controls apply when the selected source provides those tracks. They cannot invent missing tracks.</p>
        </div>
        <div className="surface mt-5 p-5"><h2 className="font-bold">Episode {episode}</h2><p className="muted mt-2 text-sm">{anime.description}</p></div>

        {(providers.length > 0 || episodes.length > 0) && <section className="surface mt-5 p-5">
          <h2 className="section-title flex items-center gap-2"><Tv size={18} className="text-violet-300" /> Official watch options</h2>
          <p className="muted mt-1 text-sm">Provider links open the streaming service. Availability depends on your region and subscription.</p>
          {providers.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{providers.map((provider, i) => <a key={provider.site + "-" + i} className="btn-secondary" href={provider.url} target="_blank" rel="noopener noreferrer">{provider.site}<ExternalLink size={14} /></a>)}</div>}
          {episodes.length > 0 && <div className="mt-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">AniList episode links</h3><select className="field !w-auto !py-2 text-xs" value={sourceLocale} onChange={(e) => setSourceLocale(e.target.value)}><option value="All">All providers</option>{[...new Set((anime.streamingEpisodes || []).map((ep) => ep.site))].map((site) => <option key={site}>{site}</option>)}</select></div><div className="space-y-2">{episodes.map((ep, i) => <a key={ep.url + "-" + i} className="flex items-center gap-3 rounded-xl border border-white/10 p-3 hover:border-violet-400/40" href={ep.url} target="_blank" rel="noopener noreferrer">{ep.thumbnail ? <img className="h-12 w-20 rounded-lg object-cover" src={ep.thumbnail} alt="" loading="lazy" /> : <div className="grid h-12 w-20 place-items-center rounded-lg bg-violet-950"><Tv size={17}/></div>}<span className="min-w-0 flex-1"><span className="block line-clamp-2 text-sm font-semibold">{ep.title}</span><span className="muted mt-1 block text-xs">{ep.site}</span></span><ExternalLink size={15} className="muted shrink-0"/></a>)}</div></div>}
        </section>}
      </div>
      <aside className="sidebar space-y-4">
        <div className="surface p-4"><h2 className="font-bold">About this anime</h2><div className="mt-3 space-y-3 text-sm">
          <div className="flex justify-between gap-3"><span className="muted">Status</span><span>{anime.status}</span></div>
          <div className="flex justify-between gap-3"><span className="muted">Year</span><span>{anime.year || "—"}</span></div>
          <div className="flex justify-between gap-3"><span className="muted">Episodes</span><span>{anime.episodes || "—"}</span></div>
          <div className="flex flex-wrap gap-2 pt-1">{anime.genre.map((g) => <Link key={g} className="pill" href={"/browse?genre=" + encodeURIComponent(g)}>{g}</Link>)}</div>
          <Link className="btn-primary mt-2 w-full" href={"/anime/" + anime.slug}>Anime details</Link>
        </div></div>
        <div className="surface p-4"><h2 className="font-bold">More to explore</h2>{items.filter((a) => a.slug !== anime.slug).slice(0, 5).map((a) => <Link href={"/anime/" + a.slug} key={a.slug} className="mt-3 flex items-center gap-3 rounded-xl p-2 hover:bg-white/5"><div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg">{a.coverImage ? <img src={a.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full" style={{ background: "linear-gradient(150deg," + a.color + ",#101016)" }} />}</div><div><div className="text-sm font-bold">{a.title}</div><div className="muted mt-1 text-xs">{a.type} · {a.year || "—"}</div></div></Link>)}</div>
        <div className="muted flex gap-2 text-xs"><Info size={15} className="shrink-0" /><span><ShieldCheck size={13} className="mr-1 inline"/> The embedded player only plays source records marked licensed and approved by the project owner.</span></div>
      </aside>
    </div>
  </>;
}
