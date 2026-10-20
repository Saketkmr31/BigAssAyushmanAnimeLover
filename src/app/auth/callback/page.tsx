"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function safeNextPath(candidate: string | null) {
  return candidate && candidate.startsWith("/") && !candidate.startsWith("//") ? candidate : "/profile";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function finishSignIn() {
      const params = new URLSearchParams(window.location.search);
      const providerError = params.get("error_description") || params.get("error");
      if (providerError) {
        if (alive) setError(providerError);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (alive) setError("Authentication is not configured for this site.");
        return;
      }

      try {
        // Supabase's browser client exchanges the OAuth code or restores the token
        // from the URL during initialization because detectSessionInUrl is enabled.
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (!alive) return;
        if (sessionError) {
          setError(sessionError.message);
          return;
        }
        if (data.session?.user) {
          router.replace(safeNextPath(params.get("next")));
          router.refresh();
          return;
        }
        setError("Google returned to the site, but no signed-in session was created. Check the Google provider credentials and Supabase redirect URLs.");
      } catch {
        if (alive) setError("Could not complete Google sign-in. Please check the provider setup and try again.");
      }
    }

    void finishSignIn();
    return () => { alive = false; };
  }, [router]);

  return <div className="mx-auto max-w-xl surface p-8 text-center sm:p-10">
    <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15 text-violet-300">
      {error ? <ShieldCheck size={25}/> : <LoaderCircle size={25} className="animate-spin"/>}
    </div>
    <h1 className="mt-5 text-2xl font-black">{error ? "Google sign-in needs attention" : "Completing sign-in…"}</h1>
    <p className="muted mt-3 text-sm leading-6">{error || "Verifying your account securely with Supabase Auth."}</p>
    {error && <div className="mt-6 flex flex-wrap justify-center gap-3">
      <Link className="btn-primary" href="/login">Back to sign in</Link>
      <Link className="btn-secondary" href="/">Home</Link>
    </div>}
  </div>;
}
