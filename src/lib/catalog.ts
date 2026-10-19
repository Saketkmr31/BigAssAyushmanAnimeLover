export type AnimeProvider = { site: string; url: string; language?: string | null };
export type AnimeStreamingEpisode = { title: string; thumbnail?: string | null; url: string; site: string };
export type AnimeTrailer = { id?: string; site: string; thumbnail?: string | null; url: string } | null;
export type Anime = {
  id?: number;
  slug: string;
  title: string;
  alt: string;
  type: string;
  status: string;
  year: number;
  season?: string;
  rating: string;
  episodes: number;
  genre: string[];
  color: string;
  description: string;
  coverImage?: string;
  bannerImage?: string;
  source?: string;
  startDate?: { year?: number | null; month?: number | null; day?: number | null } | null;
  endDate?: { year?: number | null; month?: number | null; day?: number | null } | null;
  nextAiringEpisode?: { airingAt: number; timeUntilAiring: number; episode: number } | null;
  streamingProviders?: AnimeProvider[];
  streamingEpisodes?: AnimeStreamingEpisode[];
  trailer?: AnimeTrailer;
  airingAt?: number;
  timeUntilAiring?: number;
  airingEpisode?: number;
};

// Small demo fallback only; real catalogue metadata is fetched from AniList when available.
export const catalog: Anime[] = [
 {slug:"moonlit-vow",title:"Moonlit Vow",alt:"Tsuki no Chikai",type:"TV",status:"Ongoing",year:2026,rating:"8.8",episodes:12,genre:["Fantasy","Action"],color:"#4c1d95",description:"A young wanderer discovers an ancient oath that binds the kingdoms to a forgotten moon spirit."},
 {slug:"crimson-academy",title:"Crimson Academy",alt:"Akai Gakuen",type:"TV",status:"Ongoing",year:2026,rating:"8.5",episodes:10,genre:["School","Mystery"],color:"#7f1d1d",description:"At an academy built over sealed ruins, every student hides a secret and every bell unlocks another mystery."},
 {slug:"skyline-zero",title:"Skyline Zero",alt:"Sora Zero",type:"TV",status:"Completed",year:2025,rating:"9.1",episodes:24,genre:["Sci-Fi","Adventure"],color:"#164e63",description:"Pilots race across floating cities to uncover what happened to the world beneath the clouds."}
];

export const genres = [
 "Action","Adventure","Comedy","Drama","Ecchi","Fantasy","Hentai","Horror","Mahou Shoujo",
 "Mecha","Music","Mystery","Psychological","Romance","Sci-Fi","Slice of Life","Sports",
 "Supernatural","Thriller","Adult Cast","Anthropomorphic","Avant Garde","Award Winning",
 "Beast","Boys Love","CGDCT","Childcare","Combat Sports","Crossdressing","Delinquents",
 "Detective","Educational","Gag Humor","Gore","Harem","High Stakes Game","Historical",
 "Idol","Isekai","Iyashikei","Love Polygon","Magical Sex Shift","Martial Arts","Medical",
 "Memoir","Military","Monster Girl","Mythology","Organized Crime","Otaku Culture",
 "Parody","Performing Arts","Pets","Reincarnation","Reverse Harem","Romantic Subtext",
 "Samurai","Showbiz","Space","Strategy Game","Survival","Team Sports","Time Travel",
 "Vampire","Video Game","Visual Arts","Workplace"
];

export function getAnime(slug: string) { return catalog.find(a => a.slug === slug) ?? catalog[0]; }
