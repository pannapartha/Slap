# DEPLOY NOW — SLAP (about 10 minutes hands-on, plus provider build/login waits)

Prepared 2026-10-31. Nothing has been deployed or logged in by the agent. Use one PowerShell window. No GitHub account, Actions or repository push is required. Account access/verification and any billing decision remain yours. Do not purchase anything automatically. Finish active matches before server updates: rooms are memory-only and reset on restart.

CURRENT BLOCKER/FALLBACK: Do not retry hosting GitHub OAuth signup. GitHub source is already published. Use an EXISTING Railway account via email login (or existing Render account) and the local package, plus the existing Vercel CLI account/project slap. No new account/purchase is authorized. Railway CLI is currently unauthenticated; Vercel is authenticated. Backend public HTTPS URL is still required before the frontend can be built. Direct CLI uploads do not require Git repository linking.
## A. Railway: log in and upload the prepared server

```powershell
Set-Location 'G:\Floor is Lava\Slap\game\release\railway'
function rly { & npx.cmd --yes @railway/cli@5.71.0 @args; if($LASTEXITCODE){throw 'Railway command failed; stop and check logs'} }
function vcl { & npx.cmd --yes vercel@65.9.0 @args; if($LASTEXITCODE){throw 'Vercel command failed; stop and check logs'} }
rly login
rly init --name slap
rly add --service slap-server --variables NODE_ENV=production --variables PORT=8897
rly up . --path-as-root --no-gitignore --service slap-server
rly domain --service slap-server --port 8897
```

If using an existing Railway project, run `rly link` and select its project/environment/service instead of `init`/`add`. The explicit `.` + `--path-as-root` uploads only this self-contained package, not the parent repository. `--no-gitignore` is needed because the generated release folder is ignored. The package's `.railwayignore` excludes local dependencies/configuration. In Railway Settings keep **one replica, one region, Serverless/App Sleep off**. No Docker setup is needed. Observed local ten-player server peak was ~391 MiB; leave memory headroom and check Railway metrics/limits. Do not assume a 512 MiB cap is comfortably sufficient.

## B. Get the real domain and check HTTPS

Copy the generated HTTPS service origin printed by `domain` (also Service → Settings → Networking).

```powershell
$env:SLAP_SERVER_URL=Read-Host 'Paste the actual Railway HTTPS origin, without /ws or /health'
Invoke-RestMethod "$env:SLAP_SERVER_URL/health"
```

Require `ok: true` and game `PASS THE BOMB`, with a valid public TLS certificate. This is the persistent backend URL, not the URL to share with players. WSS uses this same hostname at `/ws`. Until section C sets the frontend origin, production WebSockets intentionally reject connections.

## C. Build and deploy the Vercel static frontend

```powershell
Set-Location 'G:\Floor is Lava\Slap'
npm.cmd run build:production
if($LASTEXITCODE){throw 'Build failed; do not deploy'}
npm.cmd run package:vercel
if($LASTEXITCODE){throw 'Packaging failed; do not deploy'}
vcl login
vcl link
vcl deploy --prebuilt --prod
$frontendOrigin=Read-Host 'Paste the Vercel Aliased/Production HTTPS origin printed above'
Push-Location 'G:\Floor is Lava\Slap\game\release\railway'
rly variable set "SLAP_ALLOWED_ORIGINS=$frontendOrigin" --service slap-server
Pop-Location
# Wait for Railway's variable-change deployment to become healthy, then:
node game/deployment/check-public.mjs "$frontendOrigin"
```

Choose the intended Vercel account/project, framework Other if asked. Use the **stable production alias** from `Aliased:` / Project → Domains. The backend allowlist must match the exact origin people visit; other deployment/preview URLs are rejected unless explicitly added comma-separated. No trailing path. `SLAP_SERVER_URL` is a **local build-time variable**, baked into runtime-config.js; setting it after upload cannot fix an old build. The public check verifies HTTPS, the baked backend URL and two WSS create/join connections. Never disable TLS validation to make it pass. `check-public` does not replace the phone test.

## D. Desktop + cellular phone (minutes 5–10)

Open `$frontendOrigin` on desktop. Turn **phone Wi-Fi OFF**, open the same URL over cellular, and join the desktop's room code. Use eight bots/three Slappers for a ten-participant check. Confirm synchronized movement/pass, red pulse/beeps, jump/slap/dash with touch look, freeze/blast, ring warning/ascent, spectator and winner/rematch. Desktop DevTools → Network → WS must show **101** and `wss://` at the Railway hostname, with no mixed-content or asset errors. A separate 15-minute phone thermal/audio soak is still required for final device signoff.

## E. If a step fails

- **Railway build/start:** `rly logs --service slap-server` from release/railway. Confirm Node 22, `npm start`, PORT 8897, bind 0.0.0.0 and `/health`. This package has its own lockfile; never upload the parent game or use archived old packages. Check OOM/resource messages.
- **WSS 401:** exact `SLAP_ALLOWED_ORIGINS` mismatch or unset; update it and wait for redeploy. HTTP CORS headers are not the WebSocket fix.
- **WSS 502/timeout:** check Railway service/domain target port, healthy deployment, one replica and App Sleep off. Domain certificate must be valid.
- **Frontend login wall:** check Vercel Production Deployment Protection; a public game must be accessible to cellular players without your account. Never put a bypass token in the client.
- **Frontend/404/stale backend:** repeat build + package + Vercel deploy using the real `$env:SLAP_SERVER_URL`. Do not run an unconfigured `vercel deploy --prebuilt`; old placeholder output has been preserved outside the upload location.
- Do not paste auth tokens, cookies, full environment listings or private keys into chat/log reports.

## F. Record and submit the public URL

Share the **Vercel production alias** with players. Copy it from `Aliased:` or Vercel → Project → Domains. Send that URL back in this chat with the Railway `/health` URL, public-check PASS/FAIL, phone/browser used and any exact error (no tokens). Record the same facts in `game/VALIDATION.md` / `HANDOFF.md`. No public URL exists yet.

## G. Roll back

Save the last healthy Vercel production deployment URL/ID before later updates. Run `vcl rollback <that-previous-deployment-url-or-id>` from game to restore it. For Railway open Service → Deployments → last known-good deployment → ⋯ → **Rollback**; it restores that deployment's image and variables if retained. CLI 5.71 has no `railway rollback` command; `redeploy` is not a substitute for selecting an older good version. Recheck origin settings and `check-public` afterward. Rooms reset. On a first failed deployment with no healthy predecessor, remove/stop the failed service deployment in the dashboard and fix locally; do not claim a rollback target exists.

Sources: [Railway upload](https://docs.railway.com/cli/up), [domains](https://docs.railway.com/cli/domain), [rollback](https://docs.railway.com/deployments/deployment-actions), [Vercel prebuilt deployment](https://vercel.com/docs/cli/deploy). Detailed local audit: game/DEPLOYMENT.md.


