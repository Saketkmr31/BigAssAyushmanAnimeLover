# BigAssAyushmanAnimeLover

Responsive anime discovery catalogue built with Next.js App Router, React, TypeScript, Tailwind CSS and AniList's public GraphQL metadata API.

## Production
- Website: https://bigass-ayushman-anime-lover.vercel.app
- Source: https://github.com/Saketkmr31/BigAssAyushmanAnimeLover

## Run locally on Windows
1. Install Node.js 20.9+.
2. Copy `.env.example` to `.env.local` and add your Supabase Project URL and publishable key (see the authentication section).
3. Open PowerShell in the project folder and run:
   ```powershell
   npm install
   npm run dev
   ```
4. Open http://localhost:3000

## Authentication setup (required for real accounts)
The login, registration, sign-out, password-reset, email-confirmation and session UI is implemented with Supabase Auth. It will remain disabled until the project URL and publishable key are configured in Vercel.

1. Create a project at https://database.new.
2. In Supabase, open **Project Settings → API Keys** (or the **Connect** dialog) and copy the Project URL and **publishable** key. Do not use a secret/service-role key in the browser.
3. In Vercel, open the `bigass-ayushman-anime-lover` project → **Settings → Environment Variables**. Add these for Production, Preview and Development:
   - `NEXT_PUBLIC_SUPABASE_URL` = project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = publishable key
4. In Supabase **Authentication → URL Configuration**, set the Site URL to `https://bigass-ayushman-anime-lover.vercel.app` and add that URL plus `http://localhost:3000` to the allowed redirect URLs.
5. Redeploy the Vercel production deployment so the environment variables are applied.
6. Test registration with an email you can access. If email confirmation is enabled, click the link in that inbox before signing in.

## Implemented
- Responsive home, browse, A–Z, anime detail, watch UI, profile, login and registration pages
- AniList-backed anime metadata API with an hourly cache and demo fallback catalogue
- Supabase Auth email/password registration and sign-in, email confirmation, sign-out and password reset flow (activates after the environment keys above are configured)
- Browser-local bookmarks and recently viewed history

## Current limitations
- AniList provides anime metadata and artwork, not video streams. The player is a UI preview until an authorized media provider or licensed video files are configured.
- Bookmarks/history currently live in the browser's local storage; they do not yet sync across devices.
- This is an independent fan project; it does not mirror private catalogues or protected video sources.
