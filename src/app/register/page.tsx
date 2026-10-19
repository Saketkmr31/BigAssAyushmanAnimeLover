"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, UserRoundPlus, Mail, LockKeyhole, LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import GoogleAuthButton from "@/components/GoogleAuthButton";

export default function RegisterPage() {
 const router = useRouter();
 const [username,setUsername] = useState("");
 const [email,setEmail] = useState("");
 const [password,setPassword] = useState("");
 const [confirmPassword,setConfirmPassword] = useState("");
 const [showPassword,setShowPassword] = useState(false);
 const [showConfirm,setShowConfirm] = useState(false);
 const [message,setMessage] = useState("");
 const [error,setError] = useState("");
 const [busy,setBusy] = useState(false);
 const enabled = isSupabaseConfigured();

 async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); setMessage(""); setError("");
  if (username.trim().length < 3) { setError("Username must be at least 3 characters."); return; }
  if (password.length < 8) { setError("Use a password with at least 8 characters."); return; }
  if (password !== confirmPassword) { setError("Passwords don't match. Please check them."); return; }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) { setError("Secure registration is not connected yet. No password is saved by this page."); return; }
  setBusy(true);
  try {
   const { data, error: authError } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
     data: { username: username.trim() },
     emailRedirectTo: `${window.location.origin}/login?verified=1`,
    },
   });
   if (authError) { setError(authError.message); return; }
   if (data.session) { router.replace("/profile"); router.refresh(); return; }
   setMessage("Account request received. Check your email for the confirmation link, then come back here to sign in.");
   setPassword(""); setConfirmPassword("");
  } catch { setError("Couldn't connect to the authentication service. Please retry."); }
  finally { setBusy(false); }
 }
 return <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#12121a] md:grid-cols-[.9fr_1.1fr]">
  <div className="hidden flex-col justify-between bg-gradient-to-br from-violet-950 via-[#211334] to-[#101016] p-9 md:flex"><div className="logo-mark"><span className="logo-icon">BA</span>BigAssAyushmanAnimeLover</div><div><div className="eyebrow">Start your anime journey</div><h1 className="mt-3 text-4xl font-black leading-tight">Make this world<br/>your own.</h1><p className="muted mt-4 leading-7">Create an account to start shaping your own anime space.</p><div className="mt-6 space-y-3 text-sm text-zinc-300"><p>✦ Keep an account for your profile</p><p>✦ Save favourites on this browser</p><p>✦ Get back into your anime discovery flow</p></div></div><span className="muted text-xs">No payment required to register</span></div>
  <div className="p-6 sm:p-10"><div className="mb-7 md:hidden"><div className="logo-mark"><span className="logo-icon">BA</span>BigAssAyushmanAnimeLover</div></div><div className="eyebrow">Join the community</div><h1 className="mt-2 text-3xl font-black">Create your account</h1><p className="muted mt-2 text-sm">Use your email address and create a strong password.</p>
  {!enabled && <div className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100"><strong className="block">One-time setup still needed</strong>The secure authentication provider is not connected to this deployment yet. The form is disabled until that connection is configured.</div>}
  <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
   <label className="block text-sm">Username<input className="field mt-2" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" title="Use letters, numbers, and underscores only" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Choose a username"/></label>
   <label className="block text-sm">Email<div className="relative mt-2"><Mail size={17} className="muted absolute left-3 top-3.5"/><input className="field pl-10" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
   <label className="block text-sm">Password<div className="relative mt-2"><LockKeyhole size={17} className="muted absolute left-3 top-3.5"/><input className="field pl-10 pr-12" required type={showPassword?"text":"password"} minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/><button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-3 muted" aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div><span className="mt-1 block text-xs muted">Use 8+ characters. Avoid passwords used on other sites.</span></label>
   <label className="block text-sm">Confirm password<div className="relative mt-2"><input className="field pr-12" required type={showConfirm?"text":"password"} minLength={8} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Type the password again"/><button type="button" onClick={()=>setShowConfirm(!showConfirm)} className="absolute right-3 top-3 muted" aria-label={showConfirm?"Hide confirmation password":"Show confirmation password"}>{showConfirm?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
   <label className="flex items-start gap-2 text-sm muted"><input className="mt-1" type="checkbox" required/><span>I agree to use only content I’m authorised to access and understand email confirmation may be required.</span></label>
   <button className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50" disabled={busy||!enabled} type="submit">{busy?<><LoaderCircle size={17} className="animate-spin"/> Creating account…</>:<><UserRoundPlus size={17}/> Create account</>}</button>
   {error&&<p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}
   {message&&<p role="status" className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p>}
  </form>
  <div className="my-5 flex items-center gap-3 text-xs muted"><span className="h-px flex-1 bg-white/10"/><span>OR</span><span className="h-px flex-1 bg-white/10"/></div>
  <GoogleAuthButton label="Sign up with Google" />
  <p className="muted mt-6 text-center text-sm">Already have an account? <Link className="text-violet-300 hover:text-violet-200" href="/login">Sign in</Link></p></div></div>;
}
