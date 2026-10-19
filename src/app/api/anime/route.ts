import { NextRequest, NextResponse } from "next/server";

const ENDPOINT = "https://graphql.anilist.co";
const FIELDS = `id idMal title { romaji english native } description(asHtml: false) coverImage { large extraLarge color } bannerImage averageScore episodes seasonYear format status genres isAdult`;
const LIST_QUERY = `query AnimeCatalogue($search: String, $page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { pageInfo { currentPage hasNextPage total } media(type: ANIME, search: $search, sort: [POPULARITY_DESC, SCORE_DESC]) { ${FIELDS} } } }`;
const ID_QUERY = `query AnimeById($id: Int) { Media(id: $id, type: ANIME) { ${FIELDS} } }`;
type Media = { id:number; title?:{romaji?:string;english?:string;native?:string}; description?:string; coverImage?:{large?:string;extraLarge?:string;color?:string}; bannerImage?:string; averageScore?:number; episodes?:number; seasonYear?:number; format?:string; status?:string; genres?:string[]; isAdult?:boolean };
function normalize(a: Media) {
  const title = a.title?.english || a.title?.romaji || a.title?.native || "Untitled anime";
  return { id:a.id, slug:String(a.id), title, alt:a.title?.romaji || a.title?.native || "", type:a.format || "TV", status:a.status === "RELEASING" ? "Ongoing" : a.status === "FINISHED" ? "Completed" : a.status || "Unknown", year:a.seasonYear || 0, rating:a.averageScore ? (a.averageScore / 10).toFixed(1) : "—", episodes:a.episodes || 0, genre:a.genres || [], color:a.coverImage?.color || "#4c1d95", description:(a.description || "No synopsis is available yet.").replace(/<[^>]*>/g, ""), coverImage:a.coverImage?.extraLarge || a.coverImage?.large || "", bannerImage:a.bannerImage || "", source:"AniList" };
}
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const id = Number(p.get("id") || 0);
  const search = (p.get("search") || "").trim().slice(0, 80);
  const page = Math.max(1, Math.min(100, Number(p.get("page") || "1") || 1));
  const perPage = Math.max(6, Math.min(30, Number(p.get("perPage") || "24") || 24));
  try {
    const isSingle = Number.isInteger(id) && id > 0;
    const response = await fetch(ENDPOINT, { method:"POST", headers:{"Content-Type":"application/json","Accept":"application/json"}, body:JSON.stringify({query:isSingle?ID_QUERY:LIST_QUERY,variables:isSingle?{id}:{search:search||null,page,perPage}}), next:{revalidate:3600}, signal:AbortSignal.timeout(12000) });
    if (!response.ok) return NextResponse.json({error:`AniList returned ${response.status}.`,items:[]},{status:502});
    const payload = await response.json();
    if (payload.errors?.length) return NextResponse.json({error:"Anime metadata is temporarily unavailable.",items:[]},{status:502});
    if (isSingle) {
      const media:Media|undefined = payload.data?.Media;
      if (!media || media.isAdult) return NextResponse.json({error:"Anime not found.",items:[]},{status:404});
      return NextResponse.json({item:normalize(media),source:"AniList"},{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400"}});
    }
    const data = payload.data?.Page;
    if (!data?.media) return NextResponse.json({error:"No anime metadata returned.",items:[]},{status:502});
    const items = (data.media as Media[]).filter(a=>!a.isAdult).map(normalize);
    return NextResponse.json({items,pageInfo:data.pageInfo,source:"AniList"},{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400"}});
  } catch { return NextResponse.json({error:"Could not reach AniList right now. Please retry shortly.",items:[]},{status:502}); }
}
