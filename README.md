# BigAssAyushmanAnimeLover

Responsive anime catalogue built with Next.js App Router, React, TypeScript, Tailwind CSS and AniList's public GraphQL metadata API.

## Run on Windows
1. Extract the ZIP.
2. Open PowerShell in the extracted `BigAssAyushmanAnimeLover-Next` folder.
3. Run:
   ```powershell
   npm install
   npm run dev
   ```
4. Open http://localhost:3000

Requirements: Node.js 20.9+ and npm. Your Node 24 installation is suitable.

## Implemented
- Responsive desktop/mobile shell, with the wider desktop content layout
- Home, browse, A–Z, anime detail, watch UI, login/register and profile pages
- `/api/anime` server route connected to AniList GraphQL for titles, cover art, synopsis, genres, scores, format, status and year
- One-hour metadata cache and fallback demo titles when AniList is unavailable
- Search against AniList from the API route; catalogue filters for the currently loaded results
- Bookmark controls on anime posters; browser-local bookmarks and recently viewed history
- Episode navigation and subtitle/quality controls in the player UI

## Honest limitations
- AniList provides anime metadata and artwork, **not video streams**. The player is a UI preview and will not play episodes until an authorized media source is configured.
- Login and registration are demo forms, not real authentication. Do not enter or store real passwords. A proper auth provider and database are required for accounts and cross-device sync.
- Bookmarks and history are saved only in the current browser's local storage; they are not synced to an account.
- The catalogue loads a page of popular results; it is not a full offline mirror of any streaming website's private catalogue or backend.
- REA captures informed the visible UI research only. This project does not extract private databases, protected streams, or proprietary source code.

## Data provider
AniList GraphQL API: https://docs.anilist.co/guide/graphql/ . Check current API terms and rate limits before public/commercial deployment. Metadata is cached for an hour; if the provider is temporarily unavailable, the app uses a small offline fallback catalogue.
