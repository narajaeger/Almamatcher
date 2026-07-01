# iPaymu Premium Payment — Setup

Server-side integration so the API key never ships in the app bundle.

## 1. Run the migration
In Supabase SQL editor, run `supabase/migrations/20260629_premium_orders.sql`
(creates `public.premium_orders`).

## 2. Set Edge Function secrets
```bash
supabase secrets set \
  IPAYMU_VA=1179008818576244 \
  IPAYMU_API_KEY=F7F67BED-50CF-4903-AFE4-DDD92E3B12DA \
  IPAYMU_MODE=production \
  APP_URL=https://YOUR-NETLIFY-URL.netlify.app
```
- `IPAYMU_MODE`: use `sandbox` while testing, `production` when live.
- `APP_URL`: your deployed web origin (used for return/cancel redirects).
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected
  automatically by Supabase — do not set them yourself.

## 3. Deploy the functions
```bash
supabase functions deploy ipaymu-create-payment
supabase functions deploy ipaymu-callback --no-verify-jwt
```
`--no-verify-jwt` on the callback is required so iPaymu's server can reach it.

## 4. Set the iPaymu notify/callback URL
The app sends `notifyUrl` automatically, but also set it in the iPaymu dashboard
as a fallback:
`https://ekczgiofqbroyufrgizr.supabase.co/functions/v1/ipaymu-callback`

## How it works
1. App calls `ipaymu-create-payment` with `{ plan }` → function decides the price,
   inserts a `premium_orders` row (status `pending`), asks iPaymu for a payment
   page, returns its URL.
2. User pays on iPaymu's hosted page.
3. iPaymu POSTs to `ipaymu-callback`; the function re-verifies via iPaymu's
   *Check Transaction* API and, only if paid, sets `is_premium=true` +
   `premium_until` using the service_role key. Re-purchases extend the period.

## ⚠️ Security note
The API key above was shared in plain text. If this channel isn't private,
rotate the key in the iPaymu dashboard and update the `IPAYMU_API_KEY` secret.
Premium can only be granted by the callback (service_role); the
`prevent_premium_self_grant` DB trigger blocks any client-side attempt.
