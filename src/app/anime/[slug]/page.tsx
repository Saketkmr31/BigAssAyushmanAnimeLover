"use client";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { Play, Star, CalendarDays, ListVideo, ExternalLink, Share2, ChevronLeft, ChevronRight, Tv, Youtube, Bookmark } from "lucide-react";
import type { Anime } from "@/lib/catalog";
import { useAnimeCatalog } from "@/lib/useAnimeCatalog";
import AnimeSection from "@/components/AnimeSection";
import BookmarkButton from "@/components/BookmarkButton";

const EPISODES_PER_RANGE = 100;

export default function AnimePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { items } = useAnimeCatalog();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [rangePage, setRangePage] = useState(0);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    let alive = true;
    const found = items.find((a) => a.slug === slug);
    if (found) {
      setAnime(found);
      setLoading(false);
      return () => { alive = false; };
    }
    const id = Number(slug.split("-")[0]);
    if (!Number.isInteger(id) || id <= 0) {
      setLoading(false);
      return () => { alive = false; };
    }
    fetch(\`/api/anime?id=\${id}\`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Anime not found")))
      .then((data) => { if (alive && data.item) setAnime(data.item); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [slug, items]);

  useEffect(() => {
    if (!anime) return;
    try {
      const old = JSON.parse(localStorage.getItem("baa-history") || "[]") as string[];
      localStorage.setItem("baa-history", JSON.stringify([anime.slug, ...old.filter((x) => x !== anime.slug)].slice(0, 60)));
      window.dispatchEvent(new Event("baa-history-changed"));
    } catch {}
  }, [anime]);

  const episodeCount = Math.max(1, anime?.episodes || 12);
  const rangeCount = Math.max(1, Math.ceil(episodeCount / EPISODES_PER_RANGE));
  const safeRangePage = Math.min(rangePage, rangeCount - 1);
  const rangeStart = safeRangePage * EPISODES_PER_RANGE + 1;
  const rangeEnd = Math.min(episodeCount, rangeStart + EPISODES_PER_RANGE - 1);
  const episodeNumbers = useMemo(
    () => Array.from({ length: rangeEnd - rangeStart + 1 }, (_, i) => rangeStart + i),
    [rangeStart, rangeEnd],
  );

  async function shareAnime() {
    setShareMessage("");
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: anime?.title || "Anime", url });
        setShareMessage("Share sheet opened.");
      } else {
        await navigator.clipboard.writeText(url);
        setShareMessage("Anime link copied.");
      }
    } catch {
      setShareMessage("Couldn't share automatically. Copy the page URL from your address bar.");
    }
  }

  if (loading && !anime) return <div className="surface p-10 text-center muted">Loading anime details…</div>;
  if (!anime) return <div className="surface p-10 text-center"><h1 className="text-2xl font-black">Anime details unavailable</h1><p className="muted mt-2">AniList could not return this title. Search the catalogue and try again.</p><Link className="btn-primary mt-5" href="/browse">Back to browse</Link></div>;

  const providers = anime.streamingProviders || [];
  const streamingEpisodes = anime.streamingEpisodes || [];
  const trailer = anime.trailer && anime.trailer.site === "youtube" && anime.trailer.id && /^[\w-]{6,20}$/.test(anime.trailer.id)
    ? anime.trailer
    : null;

  return <>
    <div className="mb-5 text-sm muted"><Link href="/">Home</Link><span className="mx-2">/</span><Link href="/browse">Anime</Link><span className="mx-2">/</span><span className="text-white">{anime.title}</span></div>
    <section className="surface relative grid gap-7 overflow-hidden p-5 sm:p-7 md:grid-cols-[250px_1fr]">
      {anime.bannerImage && <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: \`linear-gradient(90deg,#111 5%,transparent 100%),url("\${anime.bannerImage}")\`, backgroundPosition: "center", backgroundSize: "cover" }} />}
      <div className="poster relative mx-auto w-full max-w-[250px]" style={{ "--poster": anime.color } as React.CSSProperties}>
        {anime.coverImage ? <img className="poster-image" src={anime.coverImage} alt={\`\${anime.title} cover\`} /> : <span className="poster-title">{anime.title}</span>}
        <span className="poster-badge">{anime.type}</span>
      </div>
      <div className="relative flex flex-col items-start">
        <div className="eyebrow">Anime details · AniList metadata</div>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{anime.title}</h1>
        {anime.alt && anime.alt !== anime.title && <p className="muted mt-1">{anime.alt}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="pill"><Star size={13} className="mr-1 fill-amber-300 text-amber-300" />{anime.rating}</span>
          <span className="pill"><CalendarDays size={13} className="mr-1" />{anime.year || "Year unknown"}</span>
          <span className="pill">{anime.status}</span>
          <span className="pill">{anime.episodes || "?"} episodes listed</span>
          {anime.season && <span className="pill">{anime.season}{anime.year ? \` \${anime.year}\` : ""}</span>}
        </div>
        <p className="mt-5 max-w-3xl whitespace-pre-line leading-7 text-zinc-300">{anime.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">{anime.genre.map((g) => <Link className="pill transition hover:border-violet-400 hover:text-white" href={\`/browse?genre=\${encodeURIComponent(g)}\`} key={g}>{g}</Link>)}</div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link className="btn-primary" href={\`/watch/\${anime.slug}-episode-1\`}><Play size={17} fill="currentColor" /> Open episode 1</Link>
          <BookmarkButton anime={anime} />
          <button className="btn-secondary" onClick={shareAnime}><Share2 size={16} /> Share</button>
        </div>
        {shareMessage && <p className="muted mt-2 text-xs" role="status">{shareMessage}</p>}
      </div>
    </section>

    <section className="surface mt-7 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="section-title flex items-center gap-2"><ListVideo size={19} className="text-violet-300" /> Episodes</h2><p className="muted mt-1 text-sm">Episode numbering follows the available anime metadata; playback depends on an authorised source.</p></div>
        <span className="pill">{anime.episodes || "Unknown"} episodes</span>
      </div>
      {rangeCount > 1 && <div className="mt-5 flex flex-wrap gap-2">
        <button className="btn-secondary !px-3 !py-2 text-xs" disabled={safeRangePage === 0} onClick={() => setRangePage((p) => Math.max(0, p - 1))}><ChevronLeft size={14} /> Previous</button>
        {Array.from({ length: rangeCount }, (_, i) => {
          const start = i * EPISODES_PER_RANGE + 1;
          const end = Math.min(episodeCount, start + EPISODES_PER_RANGE - 1);
          return <button key={start} className={\`btn-secondary !px-3 !py-2 text-xs \${safeRangePage === i ? "!border-violet-400/60 !bg-violet-500/15 !text-white" : ""}\`} onClick={() => setRangePage(i)}>{start}–{end}</button>;
        })}
        <button className="btn-secondary !px-3 !py-2 text-xs" disabled={safeRangePage >= rangeCount - 1} onClick={() => setRangePage((p) => Math.min(rangeCount - 1, p + 1))}>Next <ChevronRight size={14} /></button>
      </div>}
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {episodeNumbers.map((ep) => <Link key={ep} href={\`/watch/\${anime.slug}-episode-\${ep}\`} className="btn-secondary !px-2 !py-3 text-sm">EP {ep}</Link>)}
      </div>
    </section>

    {(providers.length > 0 || streamingEpisodes.length > 0) && <section className="surface mt-7 p-5 sm:p-6">
      <h2 className="section-title flex items-center gap-2"><Tv size={19} className="text-violet-300" /> Official streaming options</h2>
      <p className="muted mt-1 text-sm">Availability can vary by country and subscription. These are outbound provider links from AniList—not streams hosted by this project.</p>
      {providers.length > 0 && <div className="mt-4 flex flex-wrap gap-2">
        {providers.map((provider, i) => <a key={\`\${provider.site}-\${i}\`} href={provider.url} target="_blank" rel="noopener noreferrer" className="btn-secondary">{provider.site}<ExternalLink size={14} /></a>)}
      </div>}
      {streamingEpisodes.length > 0 && <div className="mt-5">
        <h3 className="mb-3 font-bold">Episodes listed by AniList</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {streamingEpisodes.map((ep, i) => <a key={\`\${ep.site}-\${ep.url}-\${i}\`} href={ep.url} target="_blank" rel="noopener noreferrer" className="surface flex items-center gap-3 p-3 transition hover:border-violet-400/40">
            {ep.thumbnail ? <img src={ep.thumbnail} alt="" className="h-16 w-24 rounded-lg object-cover" loading="lazy" /> : <div className="grid h-16 w-24 place-items-center rounded-lg bg-violet-950"><Play size={18} /></div>}
            <div className="min-w-0"><div className="line-clamp-2 text-sm font-semibold">{ep.title}</div><div className="muted mt-1 text-xs">{ep.site} · Open provider <ExternalLink size={11} className="ml-1 inline" /></div></div>
          </a>)}
        </div>
      </div>}
    </section>}

    {trailer && <section className="surface mt-7 p-5 sm:p-6"><h2 className="section-title flex items-center gap-2"><Youtube size={19} className="text-violet-300" /> Official trailer</h2><div className="mt-4 overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}><iframe className="h-full w-full" src={\`https://www.youtube-nocookie.com/embed/\${trailer.id}\`} title={\`\${anime.title} official trailer\`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen /></div></section>}

    <AnimeSection title="More popular anime" items={items.filter((a) => a.slug !== anime.slug).slice(0, 8)} />
  </>;
}
