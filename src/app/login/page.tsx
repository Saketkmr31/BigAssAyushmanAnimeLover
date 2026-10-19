"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

function safeNextPath() {
  if (typeof window === "undefined") return "/profile";
  const candidate = new URLSearchParams(window.location.search).get("next");
  return candidate && candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : "/profile";
}

export default function LoginPage() {
 const router = useRouter();
 const { user, configured } = useAuth();
 const [show, setShow] = useState(false);
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [message, setMessage] = useState("");
 const [error, setError] = useState("");
 const [busy, setBusy] = useState(false);
 const [emailVerified, setEmailVerified] = useState(false);
 const [passwordUpdated, setPasswordUpdated] = useState(false);
 useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  setEmailVerified(params.get("verified") === "1");
  setPasswordUpdated(params.get("passwordUpdated") === "1");
 }, []);
 useEffect(() => { if (user) router.replace(safeNextPath()); }, [user, router]);
 const enabled = isSupabaseConfigured();

 async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); setMessage(""); setError("");
  const supabase = getSupabaseBrowserClient();
  if (!supabase) { setError("Secure login is not connected yet. The site owner must finish the one-time Supabase setup before accounts can be created."); return; }
  setBusy(true);
  try {
   const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
   if (authError) {
    const text = authError.message.toLowerCase().includes("invalid login credentials") ? "Email/password is incorrect, or you still need to confirm your email." : authError.message;
    setError(text); return;
   }
   router.replace(safeNextPath()); router.refresh();
  } catch { setError("Couldn't connect to the authentication service. Please retry."); }
  finally { setBusy(false); }
 }
 return <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#12121a] md:grid-cols-2">
  <div className="hidden flex-col justify-between bg-gradient-to-br from-violet-950 via-[#211334] to-[#101016] p-9 md:flex"><div className="logo-mark"><span className="logo-icon">BA</span>BigAssAyushmanAnimeLover</div><div><div className="eyebrow">Your anime corner</div><h1 className="mt-3 text-4xl font-black leading-tight">Your watchlist.<br/>Your world.</h1><p className="muted mt-4 leading-7">Sign in to keep your favourites and viewing progress together on this account.</p></div><span className="muted text-xs">A fan-made anime discovery project</span></div>
  <div className="p-6 sm:p-10"><div className="mb-7 md:hidden"><div className="logo-mark"><span className="logo-icon">BA</span>BigAssAyushmanAnimeLover</div></div><div className="mb-7 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-300"><LockKeyhole/></div><h2 className="text-2xl font-black">Welcome back</h2><p className="muted mt-2 text-sm">Sign in with your email and password.</p>
  {!enabled && <div className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100"><strong className="block">Login setup in progress</strong>The secure authentication provider has not been connected to this deployment yet. No password is saved by this page. Account sign-in will activate after the one-time setup.</div>}
  {passwordUpdated && <p role="status" className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">Password updated successfully. Sign in with your new password.</p>}
  {emailVerified && <p role="status" className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">Email confirmed. You can now sign in.</p>}
  <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
   <label className="block text-sm">Email address<div className="relative mt-2"><Mail size={17} className="muted absolute left-3 top-3.5"/><input className="field pl-10" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
   <label className="block text-sm">Password<div className="relative mt-2"><input className="field pr-12" type={show?"text":"password"} required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3 muted" aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
   <div className="flex items-center justify-between text-sm"><label className="flex items-center gap-2 muted"><input type="checkbox"/> Remember me</label><Link className="text-violet-300 hover:text-violet-200" href="/forgot-password">Forgot password?</Link></div>
   <button className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={busy||!enabled}>{busy?<><LoaderCircle size={17} className="animate-spin"/> Signing in…</>:"Sign in"}</button>
   {error&&<p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
   {message&&<p role="status" className="rounded-xl border border-violet-400/30 bg-violet-500/10 p-3 text-sm text-violet-200">{message}</p>}
  </form>
  <div className="mt-6 flex items-start gap-2 text-xs muted"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-violet-300"/><span>Passwords are handled by the authentication provider, not stored by this website's own code.</span></div>
  <p className="mt-5 text-center text-sm muted">New here? <Link className="text-violet-300 hover:text-violet-200" href="/register">Create an account</Link></p></div></div>;
}
