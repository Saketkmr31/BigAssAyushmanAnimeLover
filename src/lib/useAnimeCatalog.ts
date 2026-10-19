"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Anime } from "@/lib/catalog";
import { catalog as fallback } from "@/lib/catalog";

type PageInfo = {
  currentPage: number;
  hasNextPage: boolean;
  total?: number;
};

export function useAnimeCatalog() {
  const [items, setItems] = useState<Anime[]>(fallback);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [source, setSource] = useState("Offline fallback");
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const requestInFlight = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/anime?page=1&perPage=30")
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Catalogue request failed")))
      .then((data) => {
        if (!alive || !Array.isArray(data.items) || !data.items.length) return;
        setItems(data.items);
        setPageInfo(data.pageInfo ?? null);
        setSource("AniList live metadata");
      })
      .catch(() => {
        // Keep the small offline fallback catalogue if AniList is unavailable.
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || requestInFlight.current) return;
    if (pageInfo && !pageInfo.hasNextPage) return;
    const nextPage = (pageInfo?.currentPage ?? 1) + 1;
    requestInFlight.current = true;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/anime?page=${nextPage}&perPage=30`);
      if (!response.ok) throw new Error("Unable to load more anime");
      const data = await response.json();
      if (!Array.isArray(data.items)) throw new Error("Invalid catalogue response");
      setItems((current) => {
        const seen = new Set(current.map((item) => item.slug));
        return [...current, ...data.items.filter((item: Anime) => !seen.has(item.slug))];
      });
      setPageInfo(data.pageInfo ?? { currentPage: nextPage, hasNextPage: false });
      setSource("AniList live metadata");
    } catch {
      // Keep the items already loaded. The user can retry.
    } finally {
      requestInFlight.current = false;
      setLoadingMore(false);
    }
  }, [loading, loadingMore, pageInfo]);

  return {
    items,
    loading,
    source,
    loadMore,
    loadingMore,
    hasMore: Boolean(pageInfo?.hasNextPage),
    totalAvailable: pageInfo?.total ?? null,
  };
}
