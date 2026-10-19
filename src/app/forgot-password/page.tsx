"use client";
import Link from "next/link";
import { useState } from "react";
import { Mail, LoaderCircle, KeyRound } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export default function ForgotPasswordPage() {
 const [email,setEmail] = useState("");
 const [message,setMessage] = useState("");
 const [error,setError] = useState("");
 const [busy,setBusy] = useState(false);
 const enabled = isSupabaseConfigured();
 async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); setMessage(""); setError("");
  const supabase = getSupabaseBrowserClient();
  if (!supabase) { setError("Password recovery will activate after the secure authentication provider is connected."); return; }
  setBusy(true);
  try {
   const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
   if (resetError) { setError(resetError.message); return; }
   setMessage("If an account exists for this email, a password reset link will arrive shortly. Check your inbox and spam folder.");
  } catch { setError("Couldn't send the reset email just now. Please try again."); }
  finally { setBusy(false); }
 }
 return <div className="surface mx-auto max-w-lg p-6 sm:p-9"><div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-300"><KeyRound/></div><div className="eyebrow">Account recovery</div><h1 className="mt-2 text-3xl font-black">Forgot password?</h1><p className="muted mt-2 text-sm">We'll send a secure reset link to your account email.</p>
 {!enabled&&<p className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">Password recovery will activate after one-time authentication setup.</p>}
 <form className="mt-7 space-y-4" onSubmit={handleSubmit}><label className="block text-sm">Email address<div className="relative mt-2"><Mail size={17} className="muted absolute left-3 top-3.5"/><input className="field pl-10" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label><button className="btn-primary w-full disabled:opacity-50" disabled={busy||!enabled} type="submit">{busy?<><LoaderCircle size={17} className="animate-spin"/> Sending link…</>:"Send reset link"}</button>{error&&<p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}{message&&<p role="status" className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p>}</form>
 <p className="muted mt-6 text-center text-sm"><Link className="text-violet-300" href="/login">Back to sign in</Link></p></div>;
}
