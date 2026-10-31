# SLAP — manual Railway server + Vercel frontend deployment

Updated 2026-10-31 after autonomous deployment preflight. **Local preflight PASS; public deployment NOT TESTED.** No login, service/project creation, purchase, Git push or external deployment performed. Human launch commands/checklist: [../DEPLOY-NOW.md](../DEPLOY-NOW.md).

## Real entry points and package layout

Frontend source `public/index.html` → `public/main.mjs`, native ESM/import map/Three, no Vite/dev proxy. `build-production.mjs` assembles static `dist/`; `package-vercel.mjs` emits Build Output API v3 `.vercel/output/static` + config.json. Vercel runs no simulation/function. Actual game server is `server.mjs` with `/ws` and `/health`; generated `release/railway/package.json` starts `node Slap/game/server.mjs` via `npm start`.

`npm.cmd run package:server` now produces **release/railway**, not the historical release/server directory. It includes both collision/nav layouts, exact unchanged game modules/public assets, Bopling/world GLBs and required environment helper. Its own `package.json`/v3 lockfile come from `deployment/server.package*.json`: exactly three pinned runtime dependencies (`ws`, `three`, `@fontsource/dm-sans`). No local file:../.. link, parent node_modules, Playwright or Vite dependency. Node **22.x**, locally verified **22.18.0** / npm **10.9.3**. The parent still supplies local development/build tooling; do not run the parent's game start command.

Railway package has `railway.json` (source deployment/railway.json): Railpack, direct `node Slap/game/server.mjs`, /health, 60 s health timeout, three ON_FAILURE retries, overlap 0 and draining 10 s. **No Dockerfile is included or changed.** Existing project Dockerfile remains untouched. Runtime needs one region/one replica and App Sleep/Serverless disabled; in-memory rooms are not shared and reset on restart. Platform build, quotas and Linux OS signal delivery remain unverified until actual hosting.

## Required variables and network behavior

| Location | Variable | Purpose |
| --- | --- | --- |
| Railway | NODE_ENV | Set `production`; empty origin allowlist then denies all WSS handshakes |
| Railway | PORT | Railway port; checklist sets 8897 and domain target same port; app honors supplied PORT |
| Railway | SLAP_ALLOWED_ORIGINS | Exact approved frontend HTTP(S) origins, comma-separated; production should use HTTPS alias(es), no paths/credentials/wildcards |
| Local frontend build | SLAP_SERVER_URL | **Actual public HTTPS Railway origin**, no /ws/path/query/credentials. Public configuration, not a secret |
| Local development only | PTB_PORT | Existing fallback below PORT |

CLI startup validates PORT rather than silently falling back. Listener binds 0.0.0.0. /health returns 200 when ready, 503 during shutdown. Health is not restricted by browser Origin (Railway healthcheck works). Browser traffic is HTTPS frontend assets + WSS /ws on backend. No cross-origin HTTP API is needed; WebSocket Origin is checked on upgrade, not via Access-Control-Allow-Origin. Production without SLAP_ALLOWED_ORIGINS is intentionally health-ready but **closed to WebSocket clients**, permitting first domain/bootstrap before Vercel alias exists. Set the exact Vercel alias after frontend deployment and wait for Railway redeploy.

The frontend endpoint resolver derives ws/wss from configured HTTP/HTTPS origin, refuses credentials/paths and prevents HTTPS → insecure WS mixed content. Client uses existing same-seat resume and a 1.2 s reconnect delay, 15 s server disconnect grace. 10 total room seats/participants, 4 KiB inbound message bound, existing rate/buffer caps. Protocol unchanged. Test clients and isolated package agree snapshots and reconnect; no gameplay module was modified.

SIGTERM/SIGINT handlers close WebSockets with 1012, stop admission/simulation timers and drain HTTP, with force cleanup after one second. close is idempotent and listen errors reject. Local handler test exits 0; real Railway Linux signals/edge routing are NOT TESTED. Rooms cannot survive restart; finish matches before server updates. No claim of lossless or zero-downtime room migration.

## Safe local commands

```powershell
Set-Location 'G:\Floor is Lava\Slap\game'
npm.cmd run package:server
npm.cmd ci --omit=dev --ignore-scripts --prefix release/railway
npm.cmd test
npm.cmd run build
npm.cmd run test:production
npm.cmd run preflight:isolated
```

`test:production` builds only `release/preflight/frontend` for its loopback endpoint. Isolated preflight copies the prepared package to a unique OS temp directory, clean-installs production-only dependencies, runs the real CLI, and uses a local self-signed certificate/TLS terminator and two real Chrome contexts. It verifies exact case-sensitive static paths, WSS Origin rejection, ten participants, shared snapshots, same-seat reconnect, mobile viewport and graceful shutdown. It does not install a trust certificate or change browser security in the shipped app. TLS verification exceptions exist only in this local QA script. `deployment/local-cert.ps1` generates its ignored short-lived test certificate. All required runtime dependencies resolve inside the isolated temp package; no parent repository fallback.

To build the real frontend, first provision the real server manually via DEPLOY-NOW. Then in game:

```powershell
# Set SLAP_SERVER_URL to the actual public Railway HTTPS origin in this shell.
npm.cmd run build:production
npm.cmd run package:vercel
# Human-only, not executed by agent:
npx.cmd --yes vercel@65.9.0 login
npx.cmd --yes vercel@65.9.0 link
npx.cmd --yes vercel@65.9.0 deploy --prebuilt --prod
# After setting backend SLAP_ALLOWED_ORIGINS to actual frontend alias:
node deployment/check-public.mjs $frontendOrigin
```

The production CLI build requires valid public DNS HTTPS origin AND a successful genuine SLAP /health response with normal TLS validation. Missing/local/IP/example/test/insecure/credential-bearing targets fail **before modifying output**. Vercel packaging independently revalidates runtime-config and static paths/sizes. There is intentionally **no configured dist/.vercel/output now**, because no real Railway origin exists. Structural/clean static builds were verified in separate non-deployable local TLS staging. A production build cannot honestly be declared configured or publicly connected yet.

## Preserve artifacts / rollback

Original cinematic dist/.vercel output used a placeholder hostname. They are preserved under `archive/deployment-artifacts/*-dist` / `*-output`, outside active upload paths. Original `release/server` remains unchanged for historical recovery, with its known local file-link issue; do not upload it. Prior source/docs snapshot: `archive/deployment-preflight-2026-10-31`. Existing cinematic backup remains `archive/pre-cinematic`.

Builders preserve an existing destination by renaming it to a uniquely named `archive/deployment-artifacts/` directory before writing a new artifact; they never recursively delete working output. Game/.vercel project linkage stays in place while only output is replaced. release/railway is the only server folder for current upload. It has .railwayignore and no auth files/test PFX. Archive and generated directories are ignored. Preserve known-good Railway/Vercel deployment IDs after first successful public signoff; detailed provider rollback steps are in DEPLOY-NOW.

## Concrete results / limits

Automated suite **53/53 PASS** (48 unchanged gameplay checks + five deployment checks). Native ESM build **21 modules PASS**, four original art hashes and soundtrack unchanged. Plain split-origin production browser match/reconnect/rematch PASS. Clean isolated production install/start/HTTPS/WSS/rooms/reconnect/mobile/handler smoke PASS with zero captured browser/asset errors. CLI help/version only verified: Railway **5.71.0**, Vercel **65.9.0**, compatible with local Node. Cached npm CLIs avoid global installs; no auth command executed, no agent/MCP configuration installed. No GitHub Actions or GitHub account needed by this upload path; provider account verification/eligibility is NOT TESTED.

Static staging: **611 files, ~50.5 MB total**, largest collision file **11.22 MB**, within conservative 100 MB total/file preflight budget; no private key/.env/.npmrc files. Relative imports, required assets and mobile viewport passed; local TLS server enforces Linux-style filename case. Observed ten-participant backend working set ~386 MiB / peak ~391 MiB on Windows. This is a short sample, not a room-capacity/soak guarantee or a Railway memory-billing measurement. Leave headroom and check provider metrics/caps. Do not scale multiple replicas for in-memory rooms.

**NOT TESTED:** actual Railway Railpack/Linux image, real public HTTPS certificate/WSS/edge timeout/WAN, real cellular iOS/Android/Safari, provider account quotas/billing, real OS signal delivery and long multi-room/thermal soak. These require the human hosting/account/device steps. No fabricated public URL or configured production build is supplied.

Official references checked 2026-10-31: [Railway CLI upload/path root](https://docs.railway.com/cli/up), [config as code](https://docs.railway.com/config-as-code/reference), [variables](https://docs.railway.com/cli/variables), [deployment teardown](https://docs.railway.com/deployments/deployment-teardown), [Railway rollback](https://docs.railway.com/deployments/deployment-actions), [Vercel Build Output API](https://vercel.com/docs/build-output-api), [CLI prebuilt deploy](https://vercel.com/docs/cli/deploy), [limits](https://vercel.com/docs/limits). Provider limits/retention can change; recheck if the actual account rejects an upload.


Railway startCommand runs Node directly (`node Slap/game/server.mjs`) so the tested process handles platform signals without an npm wrapper. `npm start` remains the identical local convenience alias. Public Linux signal delivery remains NOT TESTED.
