"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export default function ResetPasswordPage() {
 const router = useRouter();
 const [password,setPassword] = useState("");
 const [confirm,setConfirm] = useState("");
 const [show,setShow] = useState(false);
 const [ready,setReady] = useState(false);
 const [busy,setBusy] = useState(false);
 const [message,setMessage] = useState("");
 const [error,setError] = useState("");
 const enabled = isSupabaseConfigured();
 useEffect(()=>{
  const supabase=getSupabaseBrowserClient();
  if(!supabase){setReady(false);return;}
  let alive=true;
  supabase.auth.getSession().then(({data})=>{if(alive)setReady(Boolean(data.session));}).catch(()=>{if(alive)setReady(false);});
  const {data}=supabase.auth.onAuthStateChange((event,session)=>{if(!alive)return;if(event==="PASSWORD_RECOVERY"||session)setReady(true);});
  return()=>{alive=false;data.subscription.unsubscribe();};
 },[]);
 async function handleSubmit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setMessage("");setError("");
  if(password.length<8){setError("Use at least 8 characters.");return;}
  if(password!==confirm){setError("Passwords don't match.");return;}
  const supabase=getSupabaseBrowserClient();if(!supabase){setError("Authentication is not configured yet.");return;}
  setBusy(true);
  try{const {error:authError}=await supabase.auth.updateUser({password});if(authError){setError(authError.message);return;}setMessage("Password updated. Taking you to sign in…");setPassword("");setConfirm("");setTimeout(()=>router.replace("/login?passwordUpdated=1"),900);}
  catch{setError("The reset link may have expired. Request another link and try again.");}
  finally{setBusy(false);}
 }
 return <div className="surface mx-auto max-w-lg p-6 sm:p-9"><div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-300"><KeyRound/></div><div className="eyebrow">Account recovery</div><h1 className="mt-2 text-3xl font-black">Set a new password</h1><p className="muted mt-2 text-sm">Choose a strong password you haven't used elsewhere.</p>
 {!enabled&&<p className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">Authentication setup is still pending.</p>}
 {enabled&&!ready&&<p role="status" className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">Open this page from the latest password reset email link. If the link has expired, request another one.</p>}
 <form className="mt-7 space-y-4" onSubmit={handleSubmit}><label className="block text-sm">New password<div className="relative mt-2"><input className="field pr-12" required minLength={8} type={show?"text":"password"} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-3 muted" aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label><label className="block text-sm">Confirm new password<input className="field mt-2" required minLength={8} type={show?"text":"password"} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Type it again"/></label><button className="btn-primary w-full disabled:opacity-50" disabled={!enabled||!ready||busy} type="submit">{busy?<><LoaderCircle size={17} className="animate-spin"/> Saving password…</>:"Update password"}</button>{error&&<p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}{message&&<p role="status" className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p>}</form><p className="muted mt-6 text-center text-sm"><Link className="text-violet-300" href="/login">Back to sign in</Link></p></div>;
}
