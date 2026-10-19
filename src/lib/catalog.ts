export type Anime = {
  id?: number; slug: string; title: string; alt: string; type: string; status: string;
  year: number; rating: string; episodes: number; genre: string[];
  color: string; description: string; coverImage?: string; bannerImage?: string; source?: string;
};
// Offline fallback only. Live pages load real metadata from AniList when available.
export const catalog: Anime[] = [
 {slug:"moonlit-vow",title:"Moonlit Vow",alt:"Tsuki no Chikai",type:"TV",status:"Ongoing",year:2026,rating:"8.8",episodes:12,genre:["Fantasy","Action"],color:"#4c1d95",description:"A young wanderer discovers an ancient oath that binds the kingdoms to a forgotten moon spirit."},
 {slug:"crimson-academy",title:"Crimson Academy",alt:"Akai Gakuen",type:"TV",status:"Ongoing",year:2026,rating:"8.5",episodes:10,genre:["School","Mystery"],color:"#7f1d1d",description:"At an academy built over sealed ruins, every student hides a secret and every bell unlocks another mystery."},
 {slug:"skyline-zero",title:"Skyline Zero",alt:"Sora Zero",type:"TV",status:"Completed",year:2025,rating:"9.1",episodes:24,genre:["Sci-Fi","Adventure"],color:"#164e63",description:"Pilots race across floating cities to uncover what happened to the world beneath the clouds."}
];
export const genres = ["Action","Adventure","Comedy","Drama","Fantasy","Mystery","Romance","Sci-Fi","School","Supernatural","Slice of Life","Thriller"];
export function getAnime(slug: string) { return catalog.find(a => a.slug === slug) ?? catalog[0]; }
