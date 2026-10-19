"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function GoogleAuthButton({label="Continue with Google"}:{label?:string}) {
 const router=useRouter();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 async function signIn() {
  setError("");
  const supabase=getSupabaseBrowserClient();
  if(!supabase){setError("Authentication is not configured yet.");return;}
  setBusy(true);
  try {
   const {error:oauthError}=await supabase.auth.signInWithOAuth({
    provider:"google",
    options:{redirectTo:window.location.origin+"/profile",queryParams:{access_type:"offline",prompt:"select_account"}}
   });
   if(oauthError) {
    const msg=oauthError.message.toLowerCase();
    setError(msg.includes("provider")||msg.includes("disabled")?"Google sign-in needs to be enabled in Supabase Authentication → Providers first.":oauthError.message);
   }
  } catch {
   setError("Google sign-in could not start. Check the provider setup and try again.");
  } finally {
   setBusy(false);
  }
 }
 return <div className="mt-4">
  <button type="button" onClick={signIn} disabled={busy} className="btn-secondary w-full disabled:opacity-50">
   {busy?<LoaderCircle size={17} className="animate-spin"/>:<span className="grid h-5 w-5 place-items-center rounded-full bg-white text-sm font-black text-zinc-900">G</span>}
   {busy?"Connecting to Google…":label}
  </button>
  {error&&<p role="alert" className="mt-2 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-xs text-amber-100">{error}</p>}
 </div>;
}
