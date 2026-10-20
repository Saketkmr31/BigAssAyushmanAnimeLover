"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, LoaderCircle, Play, ShieldCheck, VideoOff, Youtube } from "lucide-react";
import type { Anime } from "@/lib/catalog";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type EpisodeSource = {
  id: string;
  provider_name: string;
  source_url: string;
  source_type: "mp4" | "hls" | "embed" | "external";
  language: string;
  quality: string;
};

export default function AuthorizedVideoPlayer({ anime, episode }: { anime: Anime; episode: number }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const lastSavedSecond = useRef(0);
  const saving = useRef(false);
  const [sources, setSources] = useState<EpisodeSource[]>([]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const animeKey = String(anime.id ?? anime.slug);
  const current = sources[sourceIndex] ?? null;
  const trailer = anime.trailer && anime.trailer.site?.toLowerCase() === "youtube" && anime.trailer.id && /^[\w-]{6,20}$/.test(anime.trailer.id) ? anime.trailer : null;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setSources([]);
    setSourceIndex(0);
    setError("");
    setLoaded(false);

    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (alive) setLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from("authorized_episode_sources")
          .select("id,provider_name,source_url,source_type,language,quality")
          .eq("anime_slug", animeKey)
          .eq("episode_number", episode)
          .eq("is_licensed", true)
          .not("approved_at", "is", null)
          .order("created_at", { ascending: true });

        if (queryError) throw queryError;
        const verified = (data ?? []).filter((item: EpisodeSource) =>
          typeof item.source_url === "string" && item.source_url.startsWith("https://") &&
          ["mp4", "hls", "embed", "external"].includes(item.source_type)
        ) as EpisodeSource[];
        if (alive) setSources(verified);
      } catch {
        if (alive) setError("We couldn't check licensed episode sources right now.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    return () => { alive = false; };
  }, [animeKey, episode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current || !["mp4", "hls"].includes(current.source_type)) return;

    let cancelled = false;
    setError("");
    setLoaded(false);
    lastSavedSecond.current = 0;
    video.pause();
    video.removeAttribute("src");
    video.load();

    async function attachSource() {
      if (!video) return;
      if (current.source_type === "mp4") {
        video.src = current.source_url;
        video.load();
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = current.source_url;
        video.load();
        return;
      }

      try {
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setError("HLS playback is not supported in this browser. Open an official provider link instead.");
          return;
        }
        const engine = new Hls({ enableWorker: true, lowLatencyMode: false });
        hlsRef.current = engine;
        engine.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setError("This licensed stream could not be played. Try another available source.");
        });
        engine.loadSource(current.source_url);
        engine.attachMedia(video);
      } catch {
        if (!cancelled) setError("The HLS player could not be loaded. Please try another source.");
      }
    }

    void attachSource();
    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [current]);

  const saveProgress = useCallback(async (video: HTMLVideoElement, force: boolean) => {
    if (!Number.isFinite(video.currentTime) || video.currentTime < 0) return;
    const second = Math.floor(video.currentTime);
    if (!force && second - lastSavedSecond.current < 15) return;
    if (saving.current) return;
    saving.current = true;
    lastSavedSecond.current = second;
    try {
      localStorage.setItem(
        "baa-history",
        JSON.stringify([anime.slug, ...(JSON.parse(localStorage.getItem("baa-history") || "[]") as string[]).filter((x) => x !== anime.slug)].slice(0, 60))
      );
      const historyDataRaw: unknown = JSON.parse(localStorage.getItem("baa-history-data") || "{}");
      const historyData = historyDataRaw && typeof historyDataRaw === "object" && !Array.isArray(historyDataRaw)
        ? historyDataRaw as Record<string, Anime> : {};
      historyData[anime.slug] = anime;
      localStorage.setItem("baa-history-data", JSON.stringify(historyData));
      localStorage.setItem(`baa-progress:${anime.slug}:${episode}`, JSON.stringify({
        animeSlug: anime.slug, episode, currentTime: second, duration: Number.isFinite(video.duration) ? video.duration : 0, updatedAt: Date.now()
      }));
      window.dispatchEvent(new Event("baa-history-changed"));

      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { error: saveError } = await supabase.from("user_watch_progress").upsert({
            user_id: session.user.id,
            anime_slug: animeKey,
            anime_id: anime.id ?? null,
            anime_title: anime.title,
            episode_number: episode,
            current_time_seconds: second,
            duration_seconds: Number.isFinite(video.duration) ? video.duration : 0,
            completed: video.ended,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,anime_slug,episode_number" });
          if (saveError) console.warn("Could not sync watch progress", saveError.message);
        }
      }
    } catch {
      // Local and account progress remain best-effort; playback should not be interrupted.
    } finally {
      saving.current = false;
    }
  }, [anime.id, anime.slug, anime.title, animeKey, episode]);

  if (loading) {
    return <div className="player-screen flex items-center justify-center gap-3"><LoaderCircle size={20} className="animate-spin text-violet-300" />Checking authorised video sources…</div>;
  }

  if (error && !sources.length) {
    return <div className="player-screen flex flex-col items-center justify-center p-6 text-center">
      <VideoOff size={34} className="text-violet-300" />
      <h2 className="mt-3 font-bold">Playback source unavailable</h2>
      <p className="muted mt-2 max-w-md text-sm">{error}</p>
    </div>;
  }

  if (!sources.length && trailer) {
    return <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="inline-flex items-center gap-2 font-semibold"><Youtube size={17} className="text-violet-300" /> Official trailer preview</span>
        <span className="muted text-xs">Trailer only — not episode {episode}</span>
      </div>
      <div className="overflow-hidden rounded-xl bg-black" style={{ aspectRatio: "16 / 9" }}>
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${trailer.id}`}
          title={`${anime.title} official trailer preview`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <p className="muted text-xs">This anime has no verified full-episode source registered. The preview is an official YouTube trailer listed by AniList.</p>
    </div>;
  }

  if (!sources.length) {
    return <div className="player-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-violet-600/80"><Play size={26} fill="currentColor" /></div>
      <h2 className="text-lg font-bold">Episode {episode}</h2>
      <p className="muted mt-2 max-w-lg text-sm">No licensed MP4/HLS source is registered for this episode yet. Use an official provider link below when available; full-episode playback activates only after an approved source is registered.</p>
      <div className="mt-4 inline-flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck size={14} /> Only verified, licensed sources appear in this player</div>
    </div>;
  }

  if (current?.source_type === "embed" || current?.source_type === "external") {
    return <div className="player-screen flex flex-col items-center justify-center p-6 text-center">
      <ExternalLink size={30} className="text-violet-300" />
      <h2 className="mt-3 font-bold">{current.provider_name}</h2>
      <p className="muted mt-2 max-w-md text-sm">This provider is external and doesn't expose a direct in-player file. Open the provider to watch there.</p>
      <a className="btn-primary mt-4" href={current.source_url} target="_blank" rel="noopener noreferrer">Open official source <ExternalLink size={15} /></a>
    </div>;
  }

  return <div className="space-y-3">
    {sources.length > 1 && <label className="flex flex-wrap items-center gap-3 text-sm muted">Video source
      <select className="field !w-auto !py-2" value={sourceIndex} onChange={(e) => { setSourceIndex(Number(e.target.value)); setError(""); }}>
        {sources.map((source, i) => <option key={source.id} value={i}>{source.provider_name} · {source.language} · {source.quality}</option>)}
      </select>
    </label>}
    <video
      ref={videoRef}
      className="max-h-[75vh] w-full rounded-xl bg-black"
      controls
      playsInline
      preload="metadata"
      onCanPlay={() => setLoaded(true)}
      onError={() => setError("This licensed video couldn't be played. Try another source, or open the provider from Anime details.")}
      onTimeUpdate={(e) => { void saveProgress(e.currentTarget, false); }}
      onPause={(e) => { void saveProgress(e.currentTarget, true); }}
      onEnded={(e) => { void saveProgress(e.currentTarget, true); }}
    >
      Your browser doesn't support the video player.
    </video>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <span className="inline-flex items-center gap-1 text-emerald-300"><ShieldCheck size={13} /> Verified source: {current.provider_name}</span>
      <span className="muted">{current.language} · {current.quality}{loaded ? " · Ready" : ""}</span>
    </div>
    {error && <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
  </div>;
}
