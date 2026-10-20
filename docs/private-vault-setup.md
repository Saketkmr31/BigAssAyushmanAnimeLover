# Private adult vault setup

This branch adds a private invite-only gallery to the existing Next.js + Supabase + Vercel project.

## Included
- /vault private gallery, search/categories, favorites, member profiles and account profile.
- Admin-only video add/delete and invite workflows.
- Private Storage bucket; uploaded media is served via short-lived signed URLs.
- RLS-protected tables: vault_members, vault_videos, vault_favorites, vault_profiles and vault_invites.
- Auth trigger grants membership only when a new account registers with a pending invited email.

## One-time admin bootstrap
Register and confirm your own email first. Then open Supabase SQL Editor for project msbcpayagcbfgdcgokih and run this query, replacing the email with the exact address on your account:

    insert into public.vault_members (user_id, role, display_name)
    select id, 'admin', coalesce(nullif(raw_user_meta_data->>'username',''), split_part(email,'@',1))
    from auth.users
    where lower(email) = lower('YOUR_EMAIL_HERE')
    on conflict (user_id) do update set role = 'admin';

    insert into public.vault_profiles (user_id, display_name)
    select id, coalesce(nullif(raw_user_meta_data->>'username',''), split_part(email,'@',1))
    from auth.users
    where lower(email) = lower('YOUR_EMAIL_HERE')
    on conflict (user_id) do nothing;

Sign out and sign in again on /vault. Use Invite friend to add friends' email addresses. The invite workflow does not send email; privately share /register and tell each invited friend to register with the exact invited email. The database trigger grants membership on account creation.

## Video and free-tier constraints
- Only use a provider's official embed URL when its terms allow embedding and the video is lawful to share. Do not scrape streams or bypass access controls.
- UI upload limit is 50 MB per file to fit free-tier constraints. Long videos will not fit this approach; use a provider-approved embed.
- Uploaded files are private. MP4/WebM are supported. No transcoding is performed, and bandwidth/storage can exceed free quotas.
- Never upload intimate content without permission. Everyone depicted must be an adult and have consented to the sharing.

## Deployment
Vercel should deploy this branch when merged. Keep only Supabase publishable keys in NEXT_PUBLIC variables; never expose a secret/service-role key in browser code. Configure Supabase Auth Site URL and redirect URLs for the production domain.
