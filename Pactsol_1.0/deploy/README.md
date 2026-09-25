# Isolated dual-business website preview

Branch: `feature/dual-business-website`, based on WhatsApp branch commit `5fdfa14`.
The active Astro app is `Pactsol_1.0`; the repository-root `index.html` is legacy and is not this build's entry point.

## Prepared deployment targets

| Worker | Website content | Suggested eventual hostname |
| --- | --- | --- |
| pactsol-business-portal-dev | Combined homepage, /sourcing/, original buyer/supplier forms | pactsol.in (after preview acceptance) |
| pactsol-software-consultancy-dev | /software/, legal pages, root redirect | software.pactsol.in |

No custom-domain routes are enabled in these configs. Deploying them does not attach or replace the current domain. Both are static-assets Workers, with no D1 bindings, service bindings or secrets. They do not share the procurement data store. The software enquiry is a mailto link to hello@pactsol.in, not a submitted web form or a new database workflow.

## Preserved integrations

- Supplier form: https://tally.so/r/PdQrdB
- Procurement form: https://tally.so/r/lb2Mko
- Meta callback: https://pactsol-whatsapp-requirements-dev.mybizchat.workers.dev/webhooks/whatsapp
- Existing tally Worker: pactsol-tally-notifications-dev
- Existing WhatsApp Worker: pactsol-whatsapp-requirements-dev
- Existing D1: pactsol-operations-dev

No existing backend code, migration, config or callback is modified. Do not run migration commands for this website release. Do not change the existing Workers Builds branch to this branch; create separate build projects for the new names.

## Build and validate

From `Pactsol_1.0`, using the committed lockfile:

```sh
npm ci
export PUBLIC_PORTAL_ORIGIN=https://pactsol-business-portal-dev.mybizchat.workers.dev
export PUBLIC_SOFTWARE_ORIGIN=https://pactsol-software-consultancy-dev.mybizchat.workers.dev
npm run build:dual
npm run test:dual
```

These are proposed preview addresses, not proof of deployment. Verify the account's workers.dev subdomain in Cloudflare before building. For local checks use http://localhost:8787 and http://localhost:8788 respectively.

## Deploy from an authenticated Cloudflare environment

Confirm `wrangler whoami` shows the intended account first. The tool was not authenticated in the implementation workspace.

```sh
npx wrangler deploy --config deploy/wrangler.portal.jsonc
npx wrangler deploy --config deploy/wrangler.software.jsonc
```

If using Workers Builds, connect this branch separately for each new Worker. Set the build root to `Pactsol_1.0`, the two PUBLIC_* variables above, the build command to `npm run build:dual`, and the appropriate deploy command. No backend secrets are required.

## Preview checks

- Open both worker URLs; verify cross-site navigation and email enquiry.
- Check narrow mobile and desktop layouts and mobile menu keyboard access.
- Open the procurement and supplier pages: original Tally forms should load. Do not submit dummy records to the operational database.
- Verify no requests to the WhatsApp webhook or D1 occur from consultancy navigation.
- Unknown URLs must return 404. Development bundles intentionally use robots Disallow and X-Robots-Tag noindex.

## Production cutover (separate from development deploy)

Ordinary subdomains within the parent Cloudflare zone do not require Enterprise subdomain delegation. A Worker Custom Domain requires an active Cloudflare zone and a non-conflicting hostname. Cloudflare manages the DNS and certificate for that custom domain. The actual paid plan, current DNS records, zone status and account limits still require account inspection.

First inspect existing apex/www routes, existing CNAME records and Cloudflare build integrations; record a rollback plan. Attach software.pactsol.in to a production consultancy Worker and use production Worker names rather than reusing existing integration names. Rebuild with PUBLIC_PORTAL_ORIGIN=https://pactsol.in and PUBLIC_SOFTWARE_ORIGIN=https://software.pactsol.in. For production, remove development noindex headers, generate host-correct robots/sitemaps, redirect any duplicate portal /software/ URL to the software host, and preserve inbound sourcing fragment links. Review the revised service/privacy terms before publication. Deploy and verify software first, then switch apex routing. Keep the original website Worker available for immediate rollback.

## Verification performed

The Astro static build passed. The automated check validates local links/assets, original form IDs, single H1 per page, preview noindex, and lack of backend bindings. Cloudflare runtime and visual checks remain unverified: the local runtime initially rejected a future compatibility date (configs now use 2026-08-25), and the cloud browser access attempt stalled. No live domain, Worker, D1 or Meta setting was changed.
