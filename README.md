# NSE Portfolio

A simple NSE-only portfolio tracker. Each user registers with an email ID and password; Supabase Auth and Postgres row-level security keep holdings private per user. Search suggestions come from Yahoo Finance and show NSE equities only. A selected symbol is stored with its `.NS` suffix, and NSE quotes come from the unofficial Yahoo Finance chart endpoint through `api/quote.js`. Existing symbol-only holdings remain until edited. Prices refresh on load and every minute while the app is open. Delays and rate limits are possible; do not use for trading decisions.

## Supabase setup

A free project has been created at https://supabase.com/dashboard/project/xdvslpecgqcsulaewrlh under Het Tejani. Its generated database password is saved in the owner’s Vault, never in this repository.

The `holdings` table and four per-owner row-level security policies are installed and verified. Email/password signup and email confirmation are enabled.

After your Vercel deployment, go to Authentication > URL Configuration and set Site URL to your deployed Vercel URL. Add the exact deployed origin to Redirect URLs. This makes confirmation links return to the app. The default is currently localhost and must be replaced.
The project URL and browser-safe **publishable** key are preset as defaults in `api/config.js`. No service-role or secret key is used.

## Vercel deployment

Import this repository into Vercel (Framework Preset: Other; Root Directory: `./`). Leave Build Command and Output Directory empty. No environment variables are needed because the public project URL and publishable key are defaults in `api/config.js`. You may override them using `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` if moving to another project. Deploy, then test registering two separate users and verify each sees only its own holdings. GitHub changes deploy automatically after import.

`api/config.js` makes only the public URL and publishable key available to the browser. `api/quote.js` proxies prices. No paid API key or other environment variable is needed. The app never falls back to unprotected local storage.

## Updating existing installations

Before users add stocks with the new picker, run this once in the Supabase SQL Editor to allow full NSE tickers:

```sql
alter table public.holdings drop constraint if exists holdings_symbol_check;
alter table public.holdings add constraint holdings_symbol_check check (symbol ~ '^[A-Z0-9][A-Z0-9&-]{0,19}(\.NS)?$');
```

Older holdings are never remapped automatically; edit an invalid ticker with the picker. This migration is already installed on the supplied project.


## Portfolio history migration

The supplied Supabase project already has owner-isolated `sales` and `portfolio_snapshots` tables and the atomic `sell_holding` function. For another Supabase project, install these tables and function with equivalent owner-only RLS before deploying this version. The function source is in `remaining-migration.sql` (the supplied project has already run it). Sales cannot exceed the held quantity and are recorded with the cost basis at the time of sale. The function takes both the inventory change and sale in one transaction. Partial sells keep the remaining quantity at its original per-share buy price. The sales table does not allow direct INSERT from clients, so all writes use a SECURITY DEFINER function with owner checks.

Sector labels are best-effort Yahoo Finance search metadata; unmatched tickers display `Unclassified`. Breakdown percentages use invested value, while current values show priced holdings. The chart accumulates at most one sampled value per trading day when the app is open during market hours and all holdings have current-day quotes; it cannot reconstruct values before this feature was installed or while the app is closed. It shows sampled portfolio value, not a closing price or trade-adjusted return. The quote UI updates without a page reload every 60 seconds while the tab is visible and the weekday NSE window (09:15-15:30 IST) is open; exchange holidays are not known to this clock, so a market-closed holiday still yields last available quotes. Outside that window, there is no polling; the latest close remains visible.
