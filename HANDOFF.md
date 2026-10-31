# SLAP — Pass the Bomb: portable handoff

Updated 2026-10-31 after deployment preflight; cinematic baseline retained below. Root `G:\Floor is Lava\Slap`; runtime `game/`. Work continues in the existing game. No external deploy, push, credentials or source character/city rebuild. Public readiness **NO**. This file supersedes old 1.1/.3 s recovery and movable 3.2 s ascent rules. Original release documents/packages preserved in `game/archive/pre-cinematic/`.

## Latest deployment preflight — overrides historical packaging statements

No deployment/login/purchase/Git push occurred. Root DEPLOY-NOW.md is the exact human checklist. Current upload folder is game/release/railway, with independent pinned manifest/lock (only ws/three/DM Sans), Node 22.x, Railpack config with direct Node entry Slap/game/server.mjs (npm start local alias). Historical game/release/server remains intact but contains a local file dependency; do not upload it. Existing example dist/.vercel output was preserved under game/archive/deployment-artifacts, leaving no active deployable placeholder. Rebuilds archive existing output instead of deleting it.

Only deployment transport/startup changed in server.mjs: validated PORT/allowlist, bind 0.0.0.0, production default-deny WSS without SLAP_ALLOWED_ORIGINS, readiness during shutdown, idempotent graceful 1012 close/SIGTERM-SIGINT/listen errors. Room protocol/capacity/gameplay unchanged. Frontend production CLI now requires a real public HTTPS DNS SLAP_SERVER_URL and genuine /health; package guard rejects local/IP/example/test/credential URLs. Without actual Railway origin there is deliberately no configured dist/.vercel/output. This is a human deployment prerequisite, not an invented URL.

53/53 tests PASS; 21-module/art/audio build PASS; clean isolated NODE_ENV=production package with no dev/parent dependencies PASS; two real Chrome clients over local HTTPS/WSS load case-sensitive assets, join/start ten participants, agree snapshots and reconnect; allowed/denied origins and graceful handler PASS. Static 611 files ~50.5 MB, largest 11.22 MB; local Windows backend peak ~391 MiB, short sample only. Public Railway/Vercel build/TLS/WAN, real cellular phone/Safari, account quotas and Linux OS signal delivery NOT TESTED. Local QA uses ignored self-signed cert, never shipped/trusted globally. CLI help/version only checked/cached: Railway 5.71.0, Vercel 65.9.0.

NEXT is HUMAN ONLY: follow DEPLOY-NOW from login, provision persistent one-replica/app-sleep-off Railway service, get actual domain, set real build variable, deploy Vercel prebuilt, set exact SLAP_ALLOWED_ORIGINS, run check-public and cellular match. No agent should log in/deploy merely on a resume request. Secrets never go in client/config URLs/log reports. Detailed evidence and changed files in HANDOFF/game/DEPLOYMENT/game/VALIDATION.
## Scope and locked game rules

Floating toy-city multiplayer party game, 2–10 humans plus optional bots. Preserve approved menu/music, original Bopling rig/art, castle/nine physical rings, two seeded city layouts, rooms and architecture. Host chooses Easy/Hard and 1–3 Slappers, capped at alive minus one. One randomized 10–17 s shared fuse; distinct random carriers. Spatial beeps/whole-body red pulse intensify with urgency.

Server validates slap range 1.8 m, facing cosine .35, cooldown .52 s and immunity. Ownership transfers immediately. Recipient cannot move/jump/slap during **2 s** recovery: TagFall .6 + Down .15 + GetUp 1.1 + settle .15. Source excerpts play at 1x. NO .3 s late-fuse shortcut. Protection prevents stacking. Previous carrier loses 1.15x speed immediately.

At zero freeze carriers at exact positions. After 90 ticks/1.5 s explode them together; only frozen carriers die from blasts. Innocents can stumble/knock down. Announce all eliminated names. Highlight one outermost ring per elimination, 300 ticks/5 s controllable escape warning. Only players currently over doomed rings get large warning; safe players subtle notice. Body-blocking grace during evacuation. Chunks/props fall and collision boundary shrinks. A survivor left on detached ground falls; never clamp them back onto safety.

All clients/spectators then see the same **first 2.5 s, later 1.5 s** external ascent. Freeze all bodies/input/actions/cooldown ages and animation mixers. Next fuse starts after camera handback. Camera safely travels to a three-quarter whole-island/underside view and returns to saved survivor orientation or spectator view. Three existing engines get charge/flash, orange/white flames, pooled downward trails, underside light and ignition whoosh; clouds/horizon move. No continuous camera shake. Gameplay geometry stays island-local. Gravity `9.81*(6371/(6371+h))^2`, h km, final duel .50g at 2638.9546 km. Constant jump impulse.

Winner alternates VictoryA/VictoryB. Same-room rematch switches city seed and clears effects/readiness. Spectators have closer aerial Frame Island reset, free orbit/pan/zoom/pinch and survivor follow; camera collision remains active.

Scale .50/~1.20 m, capsule .30 radius/.52 step. Walk .9, run 1.8, sprint 3.8 m/s, carrier multiplier 1.15, dash 1.7 m/.22 s/4 s, jump 5.4; acceleration 10/deceleration 16/turn 16. Third person 2.8 m/.9 focus/70 FOV, local building fade, geometry/terrain/player collision. Desktop pointer lock plus drag/wheel fallback; mobile simultaneous joystick/look/actions. Preserve reduced-shake/settings/HUD.

Eight READY-screen color presets: Orange, Sky Blue, Mint, Lavender, Pink, Yellow, Turquoise, Purple. Server validates integer 0–7, invalid defaults Orange. Local persistence, live preview and replication through elimination/rematch, varied bots. Optional READY selection lasts 6.5 s or Ready click; match start closes immediately. Coral material mask preserves cream face/features/eyes/lavender belly; cached red overlay visible on every preset. No per-frame materials.

## Architecture and folder map

Native browser ESM, Three.js 0.186.1, Node HTTP/ws 8.22. 60 Hz authoritative simulation, complete 20 Hz snapshots. In-memory single-process rooms. Clients send sequenced inputs, predict/interpolate and drive animation from authoritative action/time state. No new engine or networking rewrite.

```text
Slap/
  BRAIN.md                 short canonical memory
  HANDOFF.md               this portable source map
  bopling/                 original Bopling.blend + Bopling.glb
  world-assets/            BopKingdom.blend/.glb, collision, manifest, viewer/
  mixamo/                  supplied FBX clips
  game/
    server.mjs             HTTP, /health, /network, /ws, rooms/seats/settings
    simulation.mjs         Match/RULES, physics/phases/timers/gravity/tags
    bots.mjs, spawn.mjs    shared-physics navigation and separated random spawns
    navigation*.json       ten ring-count grids per city seed
    public/
      main.mjs             loading/lobby, actors, prediction, HUD, presentation
      arena.mjs            triangle capsule/ground/camera queries + navigation
      ascent.mjs           safe cinematic paths, flame/light/pooled trails
      character-options.mjs colors, validation and recovery timing
      animation.mjs        mixer, masks, prepared clips/support probes
      character-polish.mjs cached material color/red pulse uniforms
      controls.mjs, follow-camera.mjs desktop/touch/spectator and follow safety
      city-layout.mjs, city-presentation.mjs deterministic placements/batching
      visuals.mjs, fx.mjs, movement-fx.mjs, audio.mjs, player-markers.mjs
      index.html, style.css, connection.mjs, runtime-config.js
      arena*.bin[.gz], camera-terrain.bin, animations/GetUp.glb, audio/
    tests/, *-browser.mjs, cinematic-browser.mjs, release-matrix.mjs
    build-collision.mjs, build-navigation.mjs, check-build.mjs
    build-production.mjs, package-server.mjs, package-vercel.mjs, Dockerfile
    VALIDATION.md, DEPLOYMENT.md, evidence/, archive/
    dist/, release/server/, .vercel/output/ generated and ignored
```

Parent `G:\Floor is Lava` supplies package/lock/node_modules and contains other games. **Do not use parent npm start**: it launches another game. Static server resolves vendor dependencies two levels above game. Transfer parent package/lock with Slap for a new PC. Node >=22.18; current executable `G:\Nodejs\node.exe`. Browser scripts use installed Chrome via Playwright.

Two deterministic shared layouts **73129/94063**, 32 homes/eight parked climbable cars, unchanged original city. Random initial choice, alternating rematch. Matching transforms/collision/nav preloaded before readiness; snapshots gated until ready. Default `arena.bin`/`navigation.json`; alternate `arena-94063.bin`/`navigation-94063.json`. No arbitrary procedural seeds. Rebuild BOTH navigation sets after changing shared capsule behavior; both collision+nav after transforms/geometry.

Collision now uses exact vertical segment-to-triangle capsule distance, .08 m horizontal and .06 m vertical substeps, per-triangle penetration comparison and binary first contact. Walkable faces/edges provide rounded foot support without changing visual art. Shallow edge contacts must remain continuous. Grounded support, jump/ceiling, render extrapolation and bots share collider. Nav height must use actual .30 capsule; larger clearance must not invent a hovering foot pose. Shortcut support checks must use rounded groundHeight, not center-point floor. Preserve reversible connected escape paths and the nonempty outer-ring guard in build-navigation.

## Asset and animation references

Original `bopling/Bopling.blend`, `bopling/Bopling.glb`, `world-assets/BopKingdom.blend`, `world-assets/BopKingdom.glb` retain baseline hashes. `world-assets/manifest.json`, `BopKingdom-collision.glb` and `viewer/environment.js` supply environment. Original 65-bone Mixamo rig preserved; no weapon. Mixamo mappings:

| FBX | Runtime |
| --- | --- |
| Idle (2).fbx | Idle |
| Running.fbx | Run |
| Walking (3).fbx | Walk |
| Jumping (1).fbx | Jump/held Air/Fall/Land |
| Stable Sword Outward Slash (1).fbx | trimmed Slap |
| Tripping.fbx | Hit/TagFall/Down/Stagger |
| Threatening.fbx | Panic |
| Loser.fbx | Elimination |
| Chicken Dance.fbx | VictoryA |
| Swing Dancing.fbx | short VictoryB |
| Getting Up (5).fbx | GetUp |

GetUp is animation-only `game/public/animations/GetUp.glb`, exported by `game/import-get-up.py` from supplied FBX onto same rig without saving original BLEND. Loader renames Animation to GetUp. Original clip 2.7 s; runtime natural rising excerpt 1.6–2.7, Hit .85–1.45. PrepareAnimations strips conflicting constant bindings/horizontal hips travel, holds airborne poses and preserves vertical support, syncs lower/base layers. Moving slap upper mask preserves legs, ~.15–.25 s fades. No full planted-foot IK.

Blender executable here `G:\Cenzer TV\work\runtime\blender-4.2.0-windows-x64\blender.exe`; import script has PC-specific root. Approved soundtrack root `hf_20261030_143857_e6bcbf78-3839-4c39-986c-6f8b91c404b1.m4a`, exact copy `game/public/audio/slap-theme.m4a`. One cached ~31.693 s crossfaded loop, urgency/duck/settings retained. No replacement soundtrack.

## Start and reproduce QA

```powershell
Set-Location 'G:\Floor is Lava'
npm ci
Set-Location 'G:\Floor is Lava\Slap\game'
$env:PTB_PORT='8902'
npm start
# Another terminal in game:
npm test
npm run build
node check-escape.mjs 73129
node check-escape.mjs 94063
node release-matrix.mjs
node cinematic-browser.mjs
node controls-browser.mjs
node deadline-presentation.mjs
node animation-check.mjs
node visual-browser.mjs
node pass1-browser.mjs
node release-production-test.mjs
```

CLI default 8897, PORT overrides PTB_PORT. Server factory default 8894; tests use port 0. Binds 0.0.0.0. `/network` shows real LAN URL; phone must share Wi-Fi. Latest preview intended **http://localhost:8902**, LAN **http://192.168.1.191:8902**; ready/resources/network verified with final navigation. Older previews through 8901 are stale authoritative versions; do not use them to validate this pass. Firewall changes were not made. If LAN fails, allow Node inbound for Private network/current port; verify IP and same Wi-Fi first.

For collider/layout regeneration:
```powershell
node build-collision.mjs 73129
node build-navigation.mjs 73129
node build-collision.mjs 94063
node build-navigation.mjs 94063
```

## Gameplay/cinematic baseline verification

48/48 automated tests PASS with final source/navigation; 21-module build and four art/source hashes/music copy PASS. Both physical escape audits PASS: 384/384, maxima 4.7833/4.8833 s including .65 s down delay, unchanged 5 s limit. No invalid outer-ring graph collapse or unreachable valid cells. Native-touch/desktop controls, actual 65-bone animation/held airborne/natural recovery, visual/audio/HUD and camera/grounding suites PASS.

Final-source normal-clock ten-player matrix all four PASS: 1 human/9 Easy/1 Slapper 198.83 s; 1/9 Hard/3 69.17 s; 2/8 Easy/2 113.75 s, 1,900 identical shared snapshots; 2/8 Hard/3 64.57 s, 1,043 shared snapshots. Every case validates exact freeze/explosion/warning/rings, winner and alternate-layout same-room rematch to next live round. No fuse overrides, protected parking, teleports or forced outcome; human browser seats idle after UI setup. Max measured grounded bot pause .95/1.07/1.38/.43 s; no permanent stalls observed.

Final-source separate three-client suite PASS: keyboard approach/pass, remote moving slap over locomotion, full GetUp, touch joystick+jump/dash, reduced shake, three simultaneous frozen blasts/three rings, spectator orbit, complete first winner and Easy rematch to VictoryB, .50g final duel and one continuous music voice/replacement. 3,012 shared snapshots, zero browser errors. Initial combat placement and unattended rematch human-seat parking are explicit test fixtures, not evidence of three people manually playing.

Final-source two-client cinematic/color/cleanup fixture PASS, zero errors/missing assets. Ascent desktop/touch-emulation p95 11.2 ms; max 27.6/38.9 ms during recording/QA, not physical-phone timing. Server package pinned install (zero audit vulnerabilities), standalone /health and exact current-source/navigation copy PASS. Final-source split-origin production real-fuse match/reconnect/rematch/Origin rejection PASS. Public-HTTPS example build and Vercel static package PASS; example remains test-only, not a service. See game/VALIDATION.md for final acceptance and evidence names; do not cite older failed development logs as passes.

Reviewed actual READY desktop/mobile colors, natural source pose sheets, whole-island ascent/underside/bright exhaust and returned gameplay screenshots. game/evidence/cinematic-transition.webm is actual 30 fps WebGL canvas, no HUD/audio track. Ten-player PC samples ~115 desktop/~133 emulated phone-viewport FPS on RTX4070 Laptop, not handset performance.

## Current production handoff and next action

Local deployment preflight COMPLETE; public release NOT CONFIGURED/NOT TESTED. Canonical current commands/config/limits: game/DEPLOYMENT.md; ten-minute human sequence: root DEPLOY-NOW.md. Current server package release/railway has no Dockerfile/native/dev dependencies, only three pinned runtime packages and own v3 lock. It respects production PORT and exact Origin allowlist; initial production empty allowlist intentionally rejects WSS until Vercel alias is known. Set NODE_ENV=production, PORT (checklist 8897/domain same port), SLAP_ALLOWED_ORIGINS on Railway. Set SLAP_SERVER_URL only in local frontend build shell to actual HTTPS backend; production build verifies /health and TLS before output. Local PTB_PORT remains development fallback.

Previous frontend/server artifacts have been preserved, not deleted. Original placeholder dist/.vercel output was moved to archive/deployment-artifacts so a direct prebuilt upload cannot publish it. Historical release/server remains unchanged and must not be uploaded. Active configured frontend output will exist only after a real backend URL passes validation. Tests stage local endpoints only inside release/preflight. Quotas, real Linux Railpack build, public certificate/WSS, actual WAN/cellular, real phone/Safari/thermal and actual Linux OS SIGTERM delivery still require human signoff. Graceful handler was emitted/tested in the isolated Windows process; no public OS delivery claim.

Exact next action when human is home: Set-Location 'G:\Floor is Lava\Slap\game\release\railway'; & 'G:\Nodejs\npx.cmd' --yes @railway/cli@5.71.0 login (login only). Then follow DEPLOY-NOW A–G; do not run auth/deploy autonomously. Provider account verification/billing eligibility must be handled by the human; no purchase authorized. Keep one instance/region and App Sleep off, leave memory headroom above ~391 MiB observed peak, finish active matches before redeploy because rooms reset. Share the actual Vercel production alias only after check-public and cellular tests. No invented public URLs.

## Deployment-preflight changed files and evidence

Changed deployment/runtime boundary only: game/server.mjs, build-production.mjs, package-server.mjs, package-vercel.mjs, release-production-test.mjs, package.json, .gitignore, README.md. New game/deployment/{origin.mjs,artifacts.mjs,check-public.mjs,static-audit.mjs,railway.json,server.package.json,server.package-lock.json,local-cert.ps1}; new game/deployment-preflight.mjs and tests/deployment.test.mjs. Updated root BRAIN.md/HANDOFF.md, new root DEPLOY-NOW.md, game/DEPLOYMENT.md/VALIDATION.md. No changes to game mechanics, physics, bots, character animation, UI, soundtrack, cinematics or source art; baseline source/art/audio hashes checked. No new runtime dependency.

Evidence: game/evidence/preflight-all-tests.log (53/53), preflight-build.log (21 modules/art/audio), preflight-split-browser.log (plain separate-origin full smoke), preflight-isolated-tls.json/.log (clean isolated package + HTTPS/WSS/reconnect/case-sensitive assets/mobile/handler/memory), preflight-isolated-install.log, preflight-package.log, preflight-install.log, preflight-static-assets.json, preflight-fail-closed.json and CLI help/version logs. OS temp isolated package is retained at path recorded in report. Private local QA PFX is ignored and absent from upload packages. No hosted/public connectivity claim. Source/docs backup at game/archive/deployment-preflight-2026-10-31; preserved working outputs at archive/deployment-artifacts. Original Dockerfile unchanged.
## Exact changed files in this cinematic pass

Runtime: `game/server.mjs`, `simulation.mjs`, `bots.mjs`; `game/public/animation.mjs`, `arena.mjs`, `audio.mjs`, `character-polish.mjs`, `controls.mjs`, `follow-camera.mjs`, `fx.mjs`, `index.html`, `main.mjs`, `movement-fx.mjs`, `player-markers.mjs`, `style.css`; new `public/ascent.mjs`, `public/character-options.mjs`. Data/build: `game/navigation.json`, `navigation-94063.json`, `build-navigation.mjs`. QA: `game/tests/cinematic.test.mjs` (new), `tests/deadline.test.mjs`, `tests/pass1.test.mjs`, `tests/release.test.mjs`, `deadline-presentation.mjs`, `deadline-match.mjs`, `controls-browser.mjs`, `cinematic-browser.mjs` (new), `inspect-recovery.mjs` (new); actual reports/screenshots/video under `game/evidence/`. Documentation: `BRAIN.md`, `HANDOFF.md`, `game/VALIDATION.md`, `game/DEPLOYMENT.md`, `game/README.md`. Generated ignored packages under dist/release/.vercel. Original character, world art and approved audio files unchanged. Temporary debug helper removed.



Final shader verification: coral head area now shares the body's strong red peak; cream features/eyes retain their gentler pulse. Actual eight-color base/red-peak GPU contact sheet inspected, no shader/browser errors (`game/color-render-check.mjs`, new QA helper, `evidence/cinematic-color-render-sheet.png` / .log). This last material-only change followed the completed gameplay matrix; production and server-package shader copies were refreshed and build/art checks passed. All requested local work complete. Public readiness remains NO for the explicit real-device/TLS/WAN signoffs above.




## GitHub publication — current work
User authorized publishing and deployment to https://github.com/pannapartha/Slap. GitHub CLI now authenticated as pannapartha, with push/admin rights. SLAP had no tracked parent-project history, so its independent repository preserves the parent Floor is Lava history. Root package/lock supports npm ci/start/build/test without parent files. Root Railway/Vercel configs use repository root, direct node game/server.mjs and game/dist frontend output. Runtime GLBs/audio/collision/nav included; FBX/BLEND/reference videos/cache/generated archives/secrets excluded but kept on disk. Seven runtime asset integrity hashes are versioned; JSON/JS hashes normalize LF for portable checkouts. Next: push main, connect provider projects to this repository and set real runtime origins after backend hosting is available. Vercel account already available; Railway requires sign-in. No paid purchase authorized.

## Hosting authentication blocker — direct deployment fallback
Latest user instruction: stop GitHub OAuth signup attempts; use existing hosting accounts or direct CLI deployment. GitHub publication succeeded at pannapartha/Slap main. Vercel project slap exists under the existing signed-in account; Git linking was rejected by that account's GitHub integration, so do not retry GitHub OAuth. Railway sign-in attempt was stopped; no hosting project or paid service created. Use an existing Railway/Render account with email login/direct CLI; once its real backend HTTPS origin is available, build and deploy frontend via existing Vercel CLI account. No placeholder backend or frontend-only broken deployment. Standalone fresh-clone build passes; one legacy navigation-test fixture path was corrected to the tracked seeded report, with no gameplay change.

Direct CLI fallback: hosting GitHub OAuth is blocked and must not be retried. Vercel project slap exists and now uses Node 22.x, root install/build commands and game/dist output. It is not Git-linked, but direct CLI prebuilt deployment needs no Git integration. From repository root, build with the real SLAP_SERVER_URL, then npm run package:vercel produces ROOT .vercel/output to match the existing project link; deploy there with Vercel CLI. Backend current package game/release/railway is refreshed, ready for direct Railway CLI upload after existing-account email login. Existing Render may instead deploy the public repository without GitHub signup. No new account/purchase, fake URL, frontend-only deployment or gameplay change.

Final fresh-clone verification: all 53 tests and 21-module/seven-runtime-asset integrity build passed from a clone of the pushed repository, with its own npm lock/dependencies. Vercel remote project settings verified Node 22.x, npm ci, npm run build:production and game/dist; no Git link. Repository is published; deployment remains blocked solely on existing backend hosting login/URL. User asked for direct CLI fallback and prohibited further GitHub OAuth signup attempts. No further hosting auth process is running. Existing-account email login is the next human step; no tokens should be pasted in chat.

## Render fallback — current deployment path
Railway is ABANDONED per user instruction; do not retry its signup/login. No existing Render CLI credentials or RENDER_API_KEY were available. Official Render CLI 2.34.0 was downloaded locally under ignored game/release/tools/render and its published SHA256 verified. Render CLI login has opened the existing-account dashboard authorization flow; requires user sign-in and Authorize CLI. Do not commit authorization codes or tokens. Root render.yaml is prepared for a Node Web Service that builds/launches the packaged server, PORT 10000, bind 0.0.0.0, /health and /ws; no gameplay/asset rebuild. Template defaults to a free preview to avoid a paid purchase; free instances may idle and are not a final always-on guarantee. Vercel project slap remains configured/authorized for direct CLI deployment once the actual Render HTTPS backend is available.
