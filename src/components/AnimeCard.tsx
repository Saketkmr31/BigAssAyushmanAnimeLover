"use client";
import Link from "next/link";
import type { Anime } from "@/lib/catalog";
import { Star } from "lucide-react";
import BookmarkButton from "@/components/BookmarkButton";

export default function AnimeCard({ anime }: { anime: Anime }) {
  return <article className="anime-card">
    <Link href={\`/anime/\${anime.slug}\`} className="block">
      <div className="poster" style={{ "--poster": anime.color } as React.CSSProperties}>
        {anime.coverImage
          ? <img className="poster-image" src={anime.coverImage} alt={\`\${anime.title} cover\`} loading="lazy" />
          : <span className="poster-title">{anime.title}</span>}
        <span className="poster-badge">{anime.type}</span>
      </div>
      <div className="card-title">{anime.title}</div>
    </Link>
    <div className="flex items-center justify-between gap-2">
      <div className="card-meta flex min-w-0 flex-1 items-center justify-between gap-1">
        <span>{anime.status}</span>
        <span className="inline-flex items-center gap-1"><Star size={12} className="fill-amber-300 text-amber-300" />{anime.rating}</span>
      </div>
      <BookmarkButton compact anime={anime} />
    </div>
  </article>;
}
