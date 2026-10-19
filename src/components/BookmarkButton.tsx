"use client";

import { useEffect, useState } from "react";
import { Bookmark, LoaderCircle } from "lucide-react";
import type { Anime } from "@/lib/catalog";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function readBookmarks(): string[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem("baa-bookmarks") || "[]");
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}
function writeBookmarks(items: string[]) {
  localStorage.setItem("baa-bookmarks", JSON.stringify([...new Set(items)]));
  window.dispatchEvent(new Event("baa-bookmarks-changed"));
}
function rowFor(userId: string, anime: Anime) {
  return {
    user_id: userId,
    anime_slug: anime.slug,
    anime_id: anime.id ?? (/^\d+$/.test(anime.slug) ? Number(anime.slug) : null),
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

export default function BookmarkButton({ anime, compact = false }: { anime: Anime; compact?: boolean }) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      const local = readBookmarks();
      setSaved(local.includes(anime.slug));
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!alive || !session?.user) return;
        const { data, error } = await supabase.from("user_watchlist").select("id")
          .eq("user_id", session.user.id).eq("anime_slug", anime.slug).maybeSingle();
        if (!alive || error) return;
        if (data) {
          setSaved(true);
          if (!local.includes(anime.slug)) writeBookmarks([...local, anime.slug]);
        } else if (local.includes(anime.slug)) {
          const { error: insertError } = await supabase.from("user_watchlist")
            .upsert(rowFor(session.user.id, anime), { onConflict: "user_id,anime_slug" });
          if (alive && !insertError) setSaved(true);
        }
      } catch {
        // Local bookmarks remain usable if the database is offline.
      }
    };
    void sync();
    const refresh = () => setSaved(readBookmarks().includes(anime.slug));
    window.addEventListener("storage", refresh);
    window.addEventListener("baa-bookmarks-changed", refresh);
    return () => {
      alive = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("baa-bookmarks-changed", refresh);
    };
  }, [anime]);

  async function toggle(event?: React.MouseEvent<HTMLButtonElement>) {
    event?.preventDefault();
    event?.stopPropagation();
    if (busy) return;
    setBusy(true);
    const before = readBookmarks();
    const wasSaved = saved;
    const next = wasSaved ? before.filter((item) => item !== anime.slug) : [...before, anime.slug];
    writeBookmarks(next);
    setSaved(!wasSaved);
    try {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const result = wasSaved
            ? await supabase.from("user_watchlist").delete().eq("user_id", session.user.id).eq("anime_slug", anime.slug)
            : await supabase.from("user_watchlist").upsert(rowFor(session.user.id, anime), { onConflict: "user_id,anime_slug" });
          if (result.error) {
            writeBookmarks(wasSaved ? next.concat(anime.slug) : next.filter((item) => item !== anime.slug));
            setSaved(wasSaved);
          }
        }
      }
    } catch {
      // The optimistic local state remains available without network access.
    } finally {
      setBusy(false);
    }
  }

  return <button type="button" onClick={toggle} disabled={busy}
    aria-pressed={saved} aria-label={saved ? "Remove from watchlist" : "Add to watchlist"}
    className={compact ? "btn-secondary !p-2.5" : "btn-secondary"}>
    {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Bookmark size={16} className={saved ? "fill-violet-300 text-violet-300" : ""} />}
    {!compact && (saved ? "Added to List" : "Add to List")}
  </button>;
}
