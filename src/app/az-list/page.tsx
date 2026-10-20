"use client";
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, LoaderCircle, Search, BookOpen } from "lucide-react";
import type { Anime } from "@/lib/catalog";
import AnimeCard from "@/components/AnimeCard";

const letters = ["#", "0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const TARGET_MATCHES = 8;
const MAX_SCAN_PAGES = 40;
type PageInfo = { currentPage: number; hasNextPage: boolean; total?: number };

function startsWithLetter(anime: Anime, selected: string) {
  const title = anime.title.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (selected === "#") return !/^[A-Z0-9]/.test(title);
  if (selected === "0-9") return /^\d/.test(title);
  return title.startsWith(selected);
}
function uniqueAnime(items: Anime[]) {
  const seen = new Set<string>();
  return items.filter((anime) => {
    if (seen.has(anime.slug)) return false;
    seen.add(anime.slug);
    return true;
  });
}

export default function AZPage() {
  const [items, setItems] = useState<Anime[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [active, setActive] = useState("A");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function fetchPage(startPage: number, append: boolean, letterToFind?: string) {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");

    let accumulated: Anime[] = append ? [...items] : [];
    let latestPageInfo: PageInfo | null = pageInfo;
    let nextPage = startPage;
    let scans = 0;

    try {
      do {
        const response = await fetch(`/api/anime?sort=TITLE_ROMAJI&page=${nextPage}&perPage=30`);
        if (!response.ok) throw new Error("Couldn't fetch the alphabetic catalogue.");
        const data = await response.json();
        if (!Array.isArray(data.items)) throw new Error("Unexpected catalogue response.");

        accumulated = uniqueAnime([...accumulated, ...(data.items as Anime[])]);
        latestPageInfo = data.pageInfo ?? null;
        setItems(accumulated);
        setPageInfo(latestPageInfo);
        scans += 1;

        if (!letterToFind) break;
        const matches = accumulated.filter((anime) => startsWithLetter(anime, letterToFind));
        if (matches.length >= TARGET_MATCHES || !latestPageInfo?.hasNextPage || scans >= MAX_SCAN_PAGES) break;
        nextPage = (latestPageInfo.currentPage || nextPage) + 1;
      } while (true);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Unable to fetch alphabetic catalogue.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("letter");
    const normalized = requested === "%23" ? "#" : requested;
    const initial = normalized && letters.includes(normalized.toUpperCase())
      ? (normalized === "#" ? "#" : normalized.toUpperCase())
      : "A";
    setActive(initial);
    void fetchPage(1, false, initial);
    // Initial catalogue load only; selections are handled by selectLetter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectLetter(letter: string) {
    setActive(letter);
    const loadedMatches = items.filter((anime) => startsWithLetter(anime, letter)).length;
    if (loadedMatches < TARGET_MATCHES && pageInfo?.hasNextPage && !loading && !loadingMore) {
      void fetchPage((pageInfo.currentPage || 1) + 1, true, letter);
    }
  }

  const list = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items
      .filter((anime) => startsWithLetter(anime, active))
      .filter((anime) => !needle || anime.title.toLowerCase().includes(needle) || anime.alt.toLowerCase().includes(needle))
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  }, [items, active, query]);

  return <>
    <div className="mb-7">
      <div className="eyebrow flex items-center gap-2"><BookOpen size={15}/> Catalogue index</div>
      <h1 className="mt-2 text-3xl font-black sm:text-4xl">Anime A–Z List</h1>
      <p className="muted mt-2">Alphabetically sorted AniList catalogue. Choose a letter to find matching titles, then load more to expand the list.</p>
      <p className="muted mt-1 text-xs">{loading ? "Loading catalogue…" : `${items.length.toLocaleString()} loaded${pageInfo?.total ? ` of ${pageInfo.total.toLocaleString()} available titles` : ""}`}</p>
    </div>

    <label className="relative mb-5 block max-w-xl">
      <Search size={17} className="muted absolute left-3 top-3.5"/>
      <input className="field pl-10" placeholder="Search loaded titles..." value={query} onChange={(event) => setQuery(event.target.value)}/>
    </label>

    <div className="mb-8 flex flex-wrap gap-2">
      {letters.map((letter) => <button key={letter} type="button" disabled={loading || loadingMore} onClick={() => selectLetter(letter)} className={`letter ${active === letter ? "selected" : ""} disabled:cursor-wait disabled:opacity-60`}>{letter}</button>)}
    </div>

    {error && <div className="mb-5 rounded-xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200" role="alert">{error}</div>}
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="section-title">Titles starting with {active}</h2>
      <span className="muted text-sm">{list.length} titles loaded for this letter</span>
    </div>

    {list.length ? <div className="anime-grid">{list.map((anime) => <AnimeCard key={anime.slug} anime={anime}/>)}</div>
      : <div className="surface p-8 text-center">
          <p className="font-bold">{loading || loadingMore ? "Finding matching titles…" : "No matching loaded titles"}</p>
          <p className="muted mt-2 text-sm">{loading || loadingMore ? "Checking more AniList pages for this letter." : "Load more pages to continue searching this letter, or try another letter."}</p>
        </div>}

    <div className="mt-8 flex justify-center">
      {pageInfo?.hasNextPage ? <button className="btn-secondary" disabled={loading || loadingMore} onClick={() => void fetchPage((pageInfo.currentPage || 1) + 1, true)}>
          {loadingMore ? <><LoaderCircle size={16} className="animate-spin"/> Finding / loading anime…</> : <><ChevronDown size={16}/> Load more anime</>}
        </button> : !loading ? <p className="muted text-xs">End of AniList title pages.</p> : null}
    </div>
  </>;
}
