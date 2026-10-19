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

In Supabase **Authentication → URL Configuration**, set the Site URL to `https://bigass-ayushman-anime-lover.vercel.app` and add that URL plus `http://localhost:3000` to the allowed redirect URLs. Use an email address you can access for registration tests; when email confirmation is enabled, click the email link before signing in.

## Implemented
- Responsive home, browse, A–Z, anime detail, watch UI, profile, login and registration pages
- AniList-backed anime metadata API with an hourly cache and demo fallback catalogue
- Supabase Auth email/password registration and sign-in, email confirmation, sign-out, password reset and session state
- Browser-local bookmarks and recently viewed history

## Current limitations
- AniList provides anime metadata and artwork, not video streams. The player is a UI preview until an authorized media provider or licensed video files are configured.
- Bookmarks/history currently live in browser local storage; they do not sync across devices yet.
- This is an independent fan project; it does not mirror private catalogues or protected video sources.
