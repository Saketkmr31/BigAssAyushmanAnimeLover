"use client";
import { useEffect, useState } from "react";
import type { Anime } from "@/lib/catalog";
import { catalog as fallback } from "@/lib/catalog";
export function useAnimeCatalog() {
  const [items,setItems] = useState<Anime[]>(fallback);
  const [loading,setLoading] = useState(true);
  const [source,setSource] = useState("Offline fallback");
  useEffect(()=>{ let alive=true; fetch("/api/anime?perPage=24").then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(alive&&Array.isArray(data.items)&&data.items.length){setItems(data.items);setSource("AniList live metadata")}}).catch(()=>{}).finally(()=>{if(alive)setLoading(false)}); return ()=>{alive=false}; },[]);
  return {items,loading,source};
}
