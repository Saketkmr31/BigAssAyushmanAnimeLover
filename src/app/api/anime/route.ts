import { NextRequest, NextResponse } from "next/server";

const ENDPOINT = "https://graphql.anilist.co";
const CORE_FIELDS = `id idMal title { romaji english native } description(asHtml: false) coverImage { large extraLarge color } bannerImage averageScore episodes seasonYear season format status genres isAdult startDate { year month day } endDate { year month day } nextAiringEpisode { airingAt timeUntilAiring episode }`;
const DETAIL_FIELDS = `${CORE_FIELDS} externalLinks { id url site type language color icon } streamingEpisodes { title thumbnail url site } trailer { id site thumbnail }`;
const LIST_QUERY = `
query AnimeCatalogue(
  $search: String, $page: Int, $perPage: Int, $sort: [MediaSort],
  $genre_in: [String], $format_in: [MediaFormat], $status: MediaStatus,
  $season: MediaSeason, $seasonYear: Int, $type: MediaType, $isAdult: Boolean
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage total lastPage }
    media(
      type: $type, search: $search, sort: $sort, genre_in: $genre_in,
      format_in: $format_in, status: $status, season: $season,
      seasonYear: $seasonYear, isAdult: $isAdult
    ) { ${CORE_FIELDS} externalLinks { id url site type language color icon } trailer { id site thumbnail } }
  }
}`;
const DETAIL_QUERY = `query AnimeById($id: Int) { Media(id: $id, type: ANIME) { ${DETAIL_FIELDS} } }`;
const SCHEDULE_QUERY = `
query AnimeSchedule($page: Int, $perPage: Int, $greater: Int, $lesser: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage total lastPage }
    airingSchedules(airingAt_greater: $greater, airingAt_lesser: $lesser, sort: TIME) {
      id airingAt timeUntilAiring episode
      media { ${CORE_FIELDS} }
    }
  }
}`;

type ExternalLink = { id?: number; url: string; site: string; type?: string; language?: string | null; color?: string | null; icon?: string | null };
type StreamingEpisode = { title?: string; thumbnail?: string | null; url: string; site: string };
type Media = {
  id: number;
  title?: { romaji?: string; english?: string; native?: string };
  description?: string;
  coverImage?: { large?: string; extraLarge?: string; color?: string | null };
  bannerImage?: string | null;
  averageScore?: number | null;
  episodes?: number | null;
  seasonYear?: number | null;
  season?: string | null;
  format?: string | null;
  status?: string | null;
  genres?: string[];
  isAdult?: boolean;
  startDate?: { year?: number | null; month?: number | null; day?: number | null } | null;
  endDate?: { year?: number | null; month?: number | null; day?: number | null } | null;
  nextAiringEpisode?: { airingAt: number; timeUntilAiring: number; episode: number } | null;
  externalLinks?: ExternalLink[];
  streamingEpisodes?: StreamingEpisode[];
  trailer?: { id?: string | null; site?: string | null; thumbnail?: string | null } | null;
};

const OFFICIAL_STREAMING_PROVIDERS = new Set([
  "Crunchyroll", "Netflix", "Hulu", "Disney+", "Disney Plus", "Amazon Prime Video",
  "Prime Video", "HIDIVE", "Bilibili", "Bilibili TV", "iQIYI", "Muse Asia",
  "Ani-One Asia", "ADN", "ANIPLUS", "Tubi", "Pluto TV", "Max", "Apple TV",
  "YouTube", "BBC iPlayer", "Adult Swim", "RetroCrush", "Viu", "WeTV", "iQ",
]);

function normalize(media: Media) {
  const title = media.title?.english || media.title?.romaji || media.title?.native || "Untitled anime";
  const isYoutubeTrailer = Boolean(media.trailer?.id && media.trailer.site?.toLowerCase() === "youtube");
  const providerLinks = (media.externalLinks || [])
    .filter((link) => link.type === "STREAMING" && OFFICIAL_STREAMING_PROVIDERS.has(link.site) && /^https:\/\//i.test(link.url))
    .map((link) => ({ site: link.site, url: link.url, language: link.language || null }))
    .filter((link, i, all) => all.findIndex((other) => other.site === link.site && other.url === link.url) === i);
  const streamingEpisodes = (media.streamingEpisodes || [])
    .filter((ep) => OFFICIAL_STREAMING_PROVIDERS.has(ep.site) && /^https:\/\//i.test(ep.url))
    .slice(0, 120)
    .map((ep) => ({ title: ep.title || title, thumbnail: ep.thumbnail || null, url: ep.url, site: ep.site }));
  const stripHtml = (value: string) => value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/?(p|div|li|ul|ol|h[1-6])\b[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
  return {
    id: media.id,
    slug: String(media.id),
    title,
    alt: media.title?.romaji || media.title?.native || "",
    type: media.format || "TV",
    status: media.status === "RELEASING" ? "Ongoing" : media.status === "FINISHED" ? "Completed" : media.status || "Unknown",
    year: media.seasonYear || media.startDate?.year || 0,
    season: media.season || "",
    rating: media.averageScore ? (media.averageScore / 10).toFixed(1) : "—",
    episodes: media.episodes || 0,
    genre: media.genres || [],
    color: media.coverImage?.color || "#4c1d95",
    description: stripHtml(media.description || "No synopsis is available yet.").trim() || "No synopsis is available yet.",
    coverImage: media.coverImage?.extraLarge || media.coverImage?.large || "",
    bannerImage: media.bannerImage || "",
    startDate: media.startDate || null,
    endDate: media.endDate || null,
    nextAiringEpisode: media.nextAiringEpisode || null,
    streamingProviders: providerLinks,
    streamingEpisodes,
    trailer: isYoutubeTrailer ? { id: media.trailer?.id, site: "youtube", thumbnail: media.trailer?.thumbnail || null, url: `https://www.youtube.com/watch?v=${media.trailer?.id}` } : null,
    source: "AniList",
  };
}

function enumValue(value: string | null, allowed: string[]): string | null {
  return value && allowed.includes(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const id = Number(params.get("id") || 0);
  const search = (params.get("search") || "").trim().slice(0, 80);
  const page = Math.max(1, Math.min(500, Number(params.get("page") || "1") || 1));
  const perPage = Math.max(6, Math.min(30, Number(params.get("perPage") || "30") || 30));
  const schedule = params.get("schedule") === "1";
  const days = Math.max(1, Math.min(14, Number(params.get("days") || "7") || 7));
  const sort = enumValue(params.get("sort"), [
    "TRENDING_DESC", "POPULARITY_DESC", "SCORE_DESC", "UPDATED_AT_DESC",
    "START_DATE_DESC", "START_DATE", "FAVOURITES_DESC", "TITLE_ROMAJI", "TITLE_ENGLISH",
  ]) || "POPULARITY_DESC";
  const genre = (params.get("genre") || "").trim().slice(0, 40);
  const format = enumValue(params.get("format"), ["TV", "TV_SHORT", "MOVIE", "OVA", "ONA", "SPECIAL", "MUSIC"]);
  const status = enumValue(params.get("status"), ["RELEASING", "FINISHED", "NOT_YET_RELEASED", "CANCELLED", "HIATUS"]);
  const season = enumValue(params.get("season"), ["WINTER", "SPRING", "SUMMER", "FALL"]);
  const seasonYearRaw = Number(params.get("seasonYear") || params.get("year") || 0);
  const seasonYear = Number.isInteger(seasonYearRaw) && seasonYearRaw >= 1940 && seasonYearRaw <= 2100 ? seasonYearRaw : null;

  try {
    if (schedule) {
      const now = Math.floor(Date.now() / 1000);
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: SCHEDULE_QUERY, variables: { page, perPage, greater: now, lesser: now + days * 86400 } }),
        next: { revalidate: 300 },
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) return NextResponse.json({ error: `AniList returned ${response.status}.`, items: [] }, { status: 502 });
      const payload = await response.json();
      if (payload.errors?.length) return NextResponse.json({ error: "Airing schedule is temporarily unavailable.", items: [] }, { status: 502 });
      const data = payload.data?.Page;
      const items = (data?.airingSchedules || [])
        .filter((entry: { media?: Media }) => entry.media && !entry.media.isAdult)
        .map((entry: { media: Media; airingAt: number; timeUntilAiring: number; episode: number }) => ({
          ...normalize(entry.media), airingAt: entry.airingAt, timeUntilAiring: entry.timeUntilAiring, airingEpisode: entry.episode,
        }));
      return NextResponse.json({ items, pageInfo: data?.pageInfo || null, source: "AniList airing schedule", days }, {
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800" },
      });
    }

    const isSingle = Number.isInteger(id) && id > 0;
    const query = isSingle ? DETAIL_QUERY : LIST_QUERY;
    const variables: Record<string, unknown> = isSingle
      ? { id }
      : { page, perPage, sort: [sort], type: "ANIME", isAdult: false };
    if (!isSingle) {
      // AniList has returned HTTP 500 when nullable filter variables are sent explicitly as null.
      // Omitting unused filters preserves the API's default behaviour and keeps browse/search reliable.
      if (search) variables.search = search;
      if (genre) variables.genre_in = [genre];
      if (format) variables.format_in = [format];
      if (status) variables.status = status;
      if (season) variables.season = season;
      if (seasonYear) variables.seasonYear = seasonYear;
    }
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { revalidate: isSingle ? 3600 : 900 },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return NextResponse.json({ error: `AniList returned ${response.status}.`, items: [] }, { status: 502 });
    const payload = await response.json();
    if (payload.errors?.length) return NextResponse.json({ error: "Anime metadata is temporarily unavailable.", items: [] }, { status: 502 });
    if (isSingle) {
      const media: Media | undefined = payload.data?.Media;
      if (!media || media.isAdult) return NextResponse.json({ error: "Anime not found.", items: [] }, { status: 404 });
      return NextResponse.json({ item: normalize(media), source: "AniList" }, {
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
      });
    }

    const data = payload.data?.Page;
    if (!data?.media) return NextResponse.json({ error: "No anime metadata returned.", items: [] }, { status: 502 });
    const items = (data.media as Media[]).filter((media) => !media.isAdult).map(normalize);
    return NextResponse.json({ items, pageInfo: data.pageInfo, source: "AniList" }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json({ error: schedule ? "Could not reach the airing schedule. Please retry." : "Could not reach AniList right now. Please retry shortly.", items: [] }, { status: 502 });
  }
}
