"use client";
import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient, isGoogleProviderEnabled } from "@/lib/supabase";

function explainGoogleError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("provider") || text.includes("disabled")) {
    return "Google sign-in is disabled in Supabase. Enable Google under Authentication → Sign In / Providers and add the Google OAuth client ID and secret.";
  }
  if (text.includes("redirect") || text.includes("url") || text.includes("allow list") || text.includes("allowlist")) {
    return "The Google callback URL is not allowed by Supabase. Add this site's /auth/callback URL under Authentication → URL Configuration → Redirect URLs.";
  }
  return message;
}

export default function GoogleAuthButton({ label = "Continue with Google" }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Authentication is not configured yet.");
      return;
    }

    setBusy(true);
    try {
      const providerEnabled = await isGoogleProviderEnabled();
      if (providerEnabled === false) {
        setError("Google sign-in is not enabled in this Supabase project yet. The site cannot enable it without the Google OAuth client ID and client secret.");
        return;
      }
      const redirectTo = new URL("/auth/callback?next=%2Fprofile", window.location.origin).toString();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (oauthError) setError(explainGoogleError(oauthError.message));
    } catch (oauthError) {
      const message = oauthError instanceof Error ? oauthError.message : "Google sign-in could not start.";
      setError(explainGoogleError(message));
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-4">
    <button type="button" onClick={signIn} disabled={busy} className="btn-secondary w-full disabled:opacity-50">
      {busy ? <LoaderCircle size={17} className="animate-spin"/> : <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-sm font-black text-zinc-900">G</span>}
      {busy ? "Connecting to Google…" : label}
    </button>
    {error && <p role="alert" className="mt-2 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-xs text-amber-100">{error}</p>}
  </div>;
}
