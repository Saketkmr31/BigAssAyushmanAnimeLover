"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, LockKeyhole, LogOut, Play, Plus, Search, ShieldCheck, UploadCloud, Video, X, LoaderCircle, Users, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Member = { user_id: string; role: "admin" | "member"; display_name: string };
type VaultVideo = { id: string; title: string; description: string; category: string; thumbnail_url: string | null; source_kind: "embed" | "mp4" | "hls"; embed_url: string | null; storage_path: string | null; created_at: string; added_by: string };
type VaultProfile = { user_id: string; display_name: string; bio: string; avatar_url: string | null };
const BUCKET = "private-vault";
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const initial = (value: string) => value.trim().slice(0, 2).toUpperCase() || "VV";

function Player({ video, url, close }: { video: VaultVideo; url: string; close: () => void }) {
  return <div className="vault-modal-backdrop" onClick={close}>
    <section className="vault-player-modal" role="dialog" aria-modal="true" aria-label={video.title} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4"><div className="min-w-0"><div className="truncate font-bold">{video.title}</div><div className="muted text-xs">{video.category}</div></div><button className="btn-secondary !p-2" onClick={close} aria-label="Close player"><X size={18}/></button></div>
      <div className="bg-black">{video.source_kind === "embed" ? <iframe className="vault-iframe" src={video.embed_url || ""} title={video.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-presentation"/> : <video className="vault-video" controls playsInline preload="metadata" src={url}>Your browser does not support this video.</video>}</div>
      <div className="p-4"><h2 className="font-bold">{video.title}</h2>{video.description && <p className="muted mt-2 whitespace-pre-wrap text-sm">{video.description}</p>}<p className="muted mt-3 text-xs">Private vault · Do not share without permission.</p></div>
    </section>
  </div>;
}

export default function VaultPage() {
  const router = useRouter();
  const { user, loading: authLoading, configured, signOut } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const [member, setMember] = useState<Member | null>(null);
  const [videos, setVideos] = useState<VaultVideo[]>([]);
  const [profiles, setProfiles] = useState<VaultProfile[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeVideo, setActiveVideo] = useState<VaultVideo | null>(null);
  const [signedUrl, setSignedUrl] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tab, setTab] = useState<"gallery" | "profiles" | "account">("gallery");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoCategory, setVideoCategory] = useState("Favorites");
  const [embedUrl, setEmbedUrl] = useState("");
  const [thumbUrl, setThumbUrl] = useState("");
  const [isEmbed, setIsEmbed] = useState(true);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");

  const refreshVault = useCallback(async () => {
    if (!supabase || !user) return;
    setError("");
    const results = await Promise.all([
      supabase.from("vault_members").select("user_id,role,display_name").eq("user_id", user.id).maybeSingle(),
      supabase.from("vault_videos").select("id,title,description,category,thumbnail_url,source_kind,embed_url,storage_path,created_at,added_by").eq("published", true).order("created_at", { ascending: false }),
      supabase.from("vault_favorites").select("video_id").eq("user_id", user.id),
      supabase.from("vault_profiles").select("user_id,display_name,bio,avatar_url").order("display_name"),
      supabase.from("vault_profiles").select("display_name,bio").eq("user_id", user.id).maybeSingle()
    ]);
    const memberResult = results[0];
    if (memberResult.error) throw memberResult.error;
    setMember(memberResult.data as Member | null);
    if (!memberResult.data) { setVideos([]); setFavorites([]); setProfiles([]); return; }
    if (results[1].error) throw results[1].error;
    if (results[2].error) throw results[2].error;
    setVideos((results[1].data || []) as VaultVideo[]);
    setFavorites((results[2].data || []).map((x: {video_id:string}) => x.video_id));
    setProfiles((results[3].data || []) as VaultProfile[]);
    setProfileName(results[4].data?.display_name || String(user.user_metadata?.username || user.email?.split("@")[0] || ""));
    setProfileBio(results[4].data?.bio || "");
  }, [supabase, user]);

  useEffect(() => { if (!authLoading && !user) router.replace("/login?next=%2Fvault"); }, [authLoading, user, router]);
  useEffect(() => { if (user && supabase) refreshVault().catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load the private vault.")); }, [user, supabase, refreshVault]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(videos.map(v => v.category || "Uncategorized"))).sort()], [videos]);
  const filtered = useMemo(() => videos.filter(v => (category === "All" || v.category === category) && (v.title + " " + v.description + " " + v.category).toLowerCase().includes(search.toLowerCase())), [videos, category, search]);

  async function openVideo(video: VaultVideo) {
    if (!supabase) return;
    setError(""); setActiveVideo(video); setSignedUrl("");
    if (video.source_kind === "embed") return;
    if (!video.storage_path) { setError("This video has no private storage path."); return; }
    const result = await supabase.storage.from(BUCKET).createSignedUrl(video.storage_path, 1800);
    if (result.error) { setError("Secure playback failed. Confirm that your account is an approved member."); return; }
    setSignedUrl(result.data.signedUrl);
  }

  async function toggleFavorite(video: VaultVideo) {
    if (!supabase || !user || !member) return;
    setError("");
    if (favorites.includes(video.id)) {
      const result = await supabase.from("vault_favorites").delete().eq("user_id", user.id).eq("video_id", video.id);
      if (result.error) { setError(result.error.message); return; }
      setFavorites(old => old.filter(id => id !== video.id));
    } else {
      const result = await supabase.from("vault_favorites").insert({ user_id: user.id, video_id: video.id });
      if (result.error) { setError(result.error.message); return; }
      setFavorites(old => [...old, video.id]);
    }
  }

  async function addVideo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user || member?.role !== "admin") return;
    setError(""); setNotice(""); setBusy(true);
    let path: string | null = null;
    try {
      if (!title.trim()) throw new Error("Add a title first.");
      if (!rightsConfirmed) throw new Error("Confirm that you have rights to share this content and everyone depicted is an adult who consented.");
      let kind: "embed" | "mp4" = "embed";
      let embed: string | null = null;
      if (isEmbed) {
        const parsed = new URL(embedUrl);
        if (parsed.protocol !== "https:") throw new Error("Embed URL must use HTTPS.");
        embed = parsed.toString();
      } else {
        if (!file) throw new Error("Choose an MP4 or WebM file.");
        if (file.size > MAX_UPLOAD_BYTES) throw new Error("Free-tier limit here is 50 MB per file. Use a permitted embed for larger videos.");
        if (!["video/mp4", "video/webm"].includes(file.type)) throw new Error("Upload MP4 or WebM only.");
        kind = "mp4";
        path = user.id + "/" + crypto.randomUUID() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const upload = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
        if (upload.error) throw upload.error;
      }
      const insert = await supabase.from("vault_videos").insert({
        title: title.trim(), description: description.trim(), category: videoCategory.trim() || "Uncategorized",
        thumbnail_url: thumbUrl.trim() || null, source_kind: kind, embed_url: embed, storage_path: path,
        published: true, added_by: user.id
      });
      if (insert.error) {
        if (path) await supabase.storage.from(BUCKET).remove([path]);
        throw insert.error;
      }
      setTitle(""); setDescription(""); setEmbedUrl(""); setThumbUrl(""); setFile(null); setRightsConfirmed(false); setShowAdd(false);
      setNotice("Video added to the private gallery."); await refreshVault();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not add this video."); }
    finally { setBusy(false); }
  }

  async function inviteFriend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user || member?.role !== "admin") return;
    setError(""); setNotice(""); setBusy(true);
    try {
      const email = inviteEmail.trim().toLowerCase();
      if (!email.includes("@") || email.length > 254) throw new Error("Enter a valid email address.");
      const result = await supabase.from("vault_invites").insert({ email, role: "member", invited_by: user.id });
      if (result.error) throw result.error;
      setInviteEmail(""); setShowInvite(false);
      setNotice("Invitation saved for " + email + ". No email was sent: share the /register page privately and ask them to register with this exact email.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save the invite."); }
    finally { setBusy(false); }
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !user || !member) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const name = profileName.trim().slice(0, 40);
      const result = await supabase.from("vault_profiles").upsert({ user_id: user.id, display_name: name, bio: profileBio.trim().slice(0, 240), updated_at: new Date().toISOString() });
      if (result.error) throw result.error;
      const memberUpdate = await supabase.from("vault_members").update({ display_name: name }).eq("user_id", user.id);
      if (memberUpdate.error) throw memberUpdate.error;
      setNotice("Profile saved."); await refreshVault();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your profile."); }
    finally { setBusy(false); }
  }

  async function deleteVideo(video: VaultVideo) {
    if (!supabase || member?.role !== "admin" || !window.confirm("Delete “" + video.title + "” from the private gallery?")) return;
    setError(""); setNotice("");
    if (video.storage_path) {
      const storage = await supabase.storage.from(BUCKET).remove([video.storage_path]);
      if (storage.error) { setError(storage.error.message); return; }
    }
    const result = await supabase.from("vault_videos").delete().eq("id", video.id);
    if (result.error) { setError(result.error.message); return; }
    setNotice("Video deleted."); await refreshVault();
  }

  async function handleSignOut() { try { await signOut(); router.replace("/login"); } catch { setError("Sign-out failed. Please retry."); } }

  if (!configured) return <div className="vault-empty"><LockKeyhole size={30}/><h1>Vault needs configuration</h1><p>Set the Supabase URL and publishable key in Vercel environment variables.</p></div>;
  if (authLoading || !user) return <div className="vault-empty"><LoaderCircle className="animate-spin" size={28}/><h1>Checking your session…</h1><p>Your gallery is only available after sign-in.</p></div>;
  if (!member) return <div className="vault-gate"><div className="vault-mark"><LockKeyhole size={28}/></div><div className="eyebrow">Private · Invite only · 18+</div><h1>Access is by invitation.</h1><p>Your account is signed in, but it has not been approved for this vault. Ask the owner to invite this exact email address. New registrations are approved only when a matching invite exists.</p><div className="vault-email">{user.email}</div><button className="btn-secondary mt-5" onClick={handleSignOut}><LogOut size={16}/> Sign out</button></div>;

  return <div className="vault-shell">
    <section className="vault-hero"><div className="vault-hero-glow"/><div className="vault-hero-content"><div className="eyebrow flex items-center gap-2"><ShieldCheck size={15}/> Private members space · 18+</div><h1>After hours.<br/><span>Only for us.</span></h1><p>A private, invite-only gallery for consenting adults. Curated videos, member profiles and favourites — no public uploads.</p><div className="mt-6 flex flex-wrap gap-3"><button className="btn-primary" onClick={() => setTab("gallery")}><Play size={16} fill="currentColor"/> Open gallery</button><button className="btn-secondary" onClick={() => setTab("profiles")}><Users size={16}/> Members</button></div></div><div className="vault-hero-art" aria-hidden="true"><div className="vault-orbit orbit-one"/><div className="vault-orbit orbit-two"/><div className="vault-glass-card"><Video size={38}/><span>PRIVATE COLLECTION</span><strong>18+</strong></div></div></section>

    <div className="vault-toolbar"><div className="flex flex-wrap gap-2">{([["gallery","Gallery"],["profiles","Profiles"],["account","My profile"]] as const).map(([id,label])=><button key={id} onClick={() => setTab(id)} className={"vault-tab " + (tab===id?"active":"")}>{label}</button>)}</div><div className="flex flex-wrap gap-2">{member.role === "admin" && <><button className="btn-secondary" onClick={() => setShowInvite(true)}><Users size={15}/> Invite friend</button><button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={16}/> Add video</button></>}<button className="btn-secondary !p-2.5" onClick={handleSignOut} title="Sign out" aria-label="Sign out"><LogOut size={16}/></button></div></div>
    {error && <div role="alert" className="vault-alert error">{error}</div>}{notice && <div role="status" className="vault-alert success">{notice}</div>}

    {tab === "gallery" && <section><div className="vault-gallery-heading"><div><div className="eyebrow">Your private collection</div><h2 className="section-title mt-1">The gallery <span className="muted text-base font-medium">({filtered.length})</span></h2></div><label className="vault-search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search your gallery…" aria-label="Search gallery"/></label></div><div className="mb-5 flex flex-wrap gap-2">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={"vault-chip "+(category===c?"active":"")}>{c}</button>)}</div>
      {filtered.length ? <div className="vault-grid">{filtered.map(video=><article className="vault-card" key={video.id}><button className="vault-thumb" onClick={()=>openVideo(video)} aria-label={"Play "+video.title}>{video.thumbnail_url ? <img src={video.thumbnail_url} alt="" loading="lazy"/> : <div className="vault-thumb-art"><Video size={34}/><span>18+ · PRIVATE</span></div>}<span className="vault-play"><Play size={20} fill="currentColor"/></span><span className="vault-card-category">{video.category}</span></button><div className="vault-card-info"><div className="flex items-start gap-2"><button className="min-w-0 flex-1 text-left" onClick={()=>openVideo(video)}><h3>{video.title}</h3><p>{video.description || "Private members collection"}</p></button><button className={"vault-fav "+(favorites.includes(video.id)?"is-fav":"")} onClick={()=>toggleFavorite(video)} aria-label={favorites.includes(video.id)?"Remove favourite":"Add favourite"}><Heart size={17} fill={favorites.includes(video.id)?"currentColor":"none"}/></button></div><div className="mt-3 flex items-center justify-between"><span className="muted text-xs">{new Date(video.created_at).toLocaleDateString()}</span>{member.role==="admin" && <button className="vault-delete" onClick={()=>deleteVideo(video)} aria-label={"Delete "+video.title}><Trash2 size={14}/></button>}</div></div></article>)}</div> : <div className="vault-empty"><Video size={30}/><h3>{search || category!=="All" ? "No matches found" : "Your gallery is ready"}</h3><p>{member.role==="admin" ? "Add a permitted embed or upload a small video to start your private collection." : "The owner hasn't added any videos yet. Check back later."}</p>{member.role==="admin" && <button className="btn-primary mt-3" onClick={()=>setShowAdd(true)}><Plus size={16}/> Add first video</button>}</div>}
    </section>}

    {tab === "profiles" && <section><div className="eyebrow">Members only</div><h2 className="section-title mt-1 mb-5">Your people</h2><div className="vault-profile-grid">{profiles.map(p=><article key={p.user_id} className="vault-profile-card"><div className="vault-avatar">{p.avatar_url ? <img src={p.avatar_url} alt=""/> : initial(p.display_name || "Member")}</div><h3>{p.display_name || "Vault member"}{p.user_id===user.id?" (you)":""}</h3><p>{p.bio || "A member of this private collection."}</p></article>)}</div></section>}

    {tab === "account" && <section className="vault-account-card"><div className="eyebrow">Account settings</div><h2 className="section-title mt-1">Your profile</h2><p className="muted mt-2 text-sm">Visible only to approved members of this vault.</p><form className="vault-form mt-6" onSubmit={saveProfile}><label>Display name<input className="field" value={profileName} onChange={e=>setProfileName(e.target.value)} maxLength={40} required/></label><label>Short bio<textarea className="field min-h-24" value={profileBio} onChange={e=>setProfileBio(e.target.value)} maxLength={240}/></label><label>Email<input className="field opacity-70" value={user.email || ""} disabled/></label><div className="flex flex-wrap items-center gap-3"><button className="btn-primary" disabled={busy}>{busy?<LoaderCircle size={16} className="animate-spin"/>:"Save profile"}</button><span className="muted text-xs"><ShieldCheck size={13} className="mr-1 inline"/> {member.role==="admin"?"Vault admin":"Approved member"}</span></div></form></section>}

    {activeVideo && <Player video={activeVideo} url={signedUrl} close={()=>{setActiveVideo(null);setSignedUrl("");}}/>}
    {showAdd && <div className="vault-modal-backdrop" onClick={()=>setShowAdd(false)}><section className="vault-form-modal" role="dialog" aria-modal="true" aria-label="Add video" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between gap-3"><div><div className="eyebrow">Admin only</div><h2 className="text-xl font-black">Add to the gallery</h2></div><button className="btn-secondary !p-2" onClick={()=>setShowAdd(false)} aria-label="Close"><X size={18}/></button></div><form className="vault-form mt-5" onSubmit={addVideo}>
      <label>Title<input className="field" value={title} onChange={e=>setTitle(e.target.value)} maxLength={140} required placeholder="Give this video a title"/></label><label>Category<input className="field" value={videoCategory} onChange={e=>setVideoCategory(e.target.value)} maxLength={60} required/></label><label>Description<textarea className="field min-h-20" value={description} onChange={e=>setDescription(e.target.value)} maxLength={1000}/></label><label>Thumbnail URL (optional)<input className="field" type="url" value={thumbUrl} onChange={e=>setThumbUrl(e.target.value)} placeholder="https://…"/></label>
      <div className="vault-source-switch"><button type="button" className={isEmbed?"active":""} onClick={()=>setIsEmbed(true)}>Permitted embed</button><button type="button" className={!isEmbed?"active":""} onClick={()=>setIsEmbed(false)}>Upload file</button></div>
      {isEmbed ? <label>Provider's official embed URL<input className="field" type="url" value={embedUrl} onChange={e=>setEmbedUrl(e.target.value)} placeholder="https://provider.example/embed/…" required/><span className="muted text-xs">Use the provider's official embed URL, not a scraped playback URL. Confirm embedding is allowed by its terms.</span></label> : <label>MP4 or WebM file<input className="field" type="file" accept="video/mp4,video/webm" onChange={e=>setFile(e.target.files?.[0] || null)} required/><span className="muted text-xs">Free-tier UI limit: 50 MB per file. Large videos should use a permitted embed.</span></label>}
      <label className="vault-check"><input type="checkbox" checked={rightsConfirmed} onChange={e=>setRightsConfirmed(e.target.checked)}/><span>I confirm I have permission to share this video, everyone depicted is 18+, and all depicted people consented to this content being shared.</span></label><button className="btn-primary w-full" disabled={busy}>{busy?<><LoaderCircle size={16} className="animate-spin"/> Saving…</>:<><UploadCloud size={16}/> Add private video</>}</button>
    </form></section></div>}

    {showInvite && <div className="vault-modal-backdrop" onClick={()=>setShowInvite(false)}><section className="vault-form-modal" role="dialog" aria-modal="true" aria-label="Invite friend" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between"><div><div className="eyebrow">Admin only</div><h2 className="text-xl font-black">Invite an adult friend</h2></div><button className="btn-secondary !p-2" onClick={()=>setShowInvite(false)} aria-label="Close"><X size={18}/></button></div><p className="muted mt-3 text-sm">Only invite people you know are adults. This creates an invite record; it does not send email. Your friend must register with the exact invited email.</p><form className="vault-form mt-5" onSubmit={inviteFriend}><label>Friend's email<input className="field" type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} required maxLength={254} placeholder="friend@example.com"/></label><button className="btn-primary w-full" disabled={busy}>{busy?<LoaderCircle size={16} className="animate-spin"/>:<><Users size={16}/> Save invitation</>}</button></form></section></div>}
  </div>;
}
