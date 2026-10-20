# BigAssAyushmanAnimeLover

Responsive anime discovery catalogue built with Next.js App Router, React, TypeScript, Tailwind CSS and AniList's public GraphQL metadata API.

## Production
- Website: https://bigass-ayushman-anime-lover.vercel.app
- Source: https://github.com/Saketkmr31/BigAssAyushmanAnimeLover

## Run locally on Windows
1. Install Node.js 20.9+.
2. Optional: copy `.env.example` to `.env.local` to override the project's public Supabase URL and publishable key.
3. Open PowerShell in the project folder and run:
   ```powershell
   npm install
   npm run dev
   ```
4. Open http://localhost:3000

## Authentication
The login, registration, sign-out, password-reset, email-confirmation and session flows use Supabase Auth. The project has a dedicated Supabase project, and its URL plus **publishable** key are configured as public client defaults in `src/lib/supabase.ts`. These values are intended to be visible in browser code. Never put a Supabase secret/service-role key into browser code.

In Supabase **Authentication → URL Configuration**, set the Site URL to `https://bigass-ayushman-anime-lover.vercel.app` and add these allowed redirect URLs:

- `https://bigass-ayushman-anime-lover.vercel.app/auth/callback`
- `http://localhost:3000/auth/callback`

For Google sign-in, create a **Web application** OAuth client in [Google Cloud Console](https://console.cloud.google.com/auth/clients). Add `https://bigass-ayushman-anime-lover.vercel.app` (and `http://localhost:3000` for local testing) as authorized JavaScript origins. Set the authorized redirect URI to the Supabase Auth callback URL shown in **Supabase → Authentication → Sign In / Providers → Google**; for this project, the project callback normally takes the form `https://msbcpayagcbfgdcgokih.supabase.co/auth/v1/callback`. Then enable Google and enter the Google OAuth client ID and client secret in the Supabase provider settings. These provider credentials are required; application code cannot manufacture them.

Use an email address you can access for registration tests. When email confirmation is enabled, click the email link before signing in.

## Implemented
- Responsive home, browse, A–Z, anime detail, watch UI, profile, login and registration pages
- AniList-backed anime metadata API with an hourly cache and demo fallback catalogue
- Supabase Auth email/password registration and sign-in, email confirmation, sign-out, password reset and session state
- Browser-local bookmarks and recently viewed history

## Current limitations
- AniList provides anime metadata, official provider links and some trailer IDs, not full-episode streams. The watch page can embed a listed YouTube trailer as a clearly labelled preview; full-episode playback requires an approved, licensed source registered in `authorized_episode_sources`.
- Bookmarks/history currently live in browser local storage; they do not sync across devices yet.
- This is an independent fan project; it does not mirror private catalogues or protected video sources.
