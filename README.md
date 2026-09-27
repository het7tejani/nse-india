# NSE Portfolio

A simple NSE-only portfolio tracker. Each user registers with an email ID and password; Supabase Auth and Postgres row-level security keep holdings private per user. NSE quotes come from the unofficial Yahoo Finance chart endpoint through `api/quote.js`. Prices refresh on load and every minute while the app is open. Delays and rate limits are possible; do not use for trading decisions.

## Supabase setup

A free project has been created at https://supabase.com/dashboard/project/xdvslpecgqcsulaewrlh under Het Tejani. Its generated database password is saved in the owner’s Vault, never in this repository.

The `holdings` table and four per-owner row-level security policies are installed and verified. Email/password signup and email confirmation are enabled.

After your Vercel deployment, go to Authentication > URL Configuration and set Site URL to your deployed Vercel URL. Add the exact deployed origin to Redirect URLs. This makes confirmation links return to the app. The default is currently localhost and must be replaced.
The project URL and browser-safe **publishable** key are preset as defaults in `api/config.js`. No service-role or secret key is used.

## Vercel deployment

Import this repository into Vercel (Framework Preset: Other; Root Directory: `./`). Leave Build Command and Output Directory empty. No environment variables are needed because the public project URL and publishable key are defaults in `api/config.js`. You may override them using `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` if moving to another project. Deploy, then test registering two separate users and verify each sees only its own holdings. GitHub changes deploy automatically after import.

`api/config.js` makes only the public URL and publishable key available to the browser. `api/quote.js` proxies prices. No paid API key or other environment variable is needed. The app never falls back to unprotected local storage.
