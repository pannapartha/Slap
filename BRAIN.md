# SLAP — canonical project memory

Updated 2026-10-31, deployment preflight. Work only in existing Slap/game. Preserve approved UI, soundtrack, source Bopling and Bop Kingdom assets, networking architecture and city layouts. No external deployment, push or account creation authorized. Current deployment preflight is complete locally (53 tests, isolated production HTTPS/WSS smoke); gameplay/cinematic baseline remains unchanged. Public deployment remains blocked on real-device and actual HTTPS/WSS hosting signoff. HANDOFF.md is portable context; game/VALIDATION.md holds evidence; game/DEPLOYMENT.md gives manual release commands.

## Latest deployment preflight — overrides historical packaging statements

No deployment/login/purchase/Git push occurred. Root DEPLOY-NOW.md is the exact human checklist. Current upload folder is game/release/railway, with independent pinned manifest/lock (only ws/three/DM Sans), Node 22.x, Railpack config with direct Node entry Slap/game/server.mjs (npm start local alias). Historical game/release/server remains intact but contains a local file dependency; do not upload it. Existing example dist/.vercel output was preserved under game/archive/deployment-artifacts, leaving no active deployable placeholder. Rebuilds archive existing output instead of deleting it.

Only deployment transport/startup changed in server.mjs: validated PORT/allowlist, bind 0.0.0.0, production default-deny WSS without SLAP_ALLOWED_ORIGINS, readiness during shutdown, idempotent graceful 1012 close/SIGTERM-SIGINT/listen errors. Room protocol/capacity/gameplay unchanged. Frontend production CLI now requires a real public HTTPS DNS SLAP_SERVER_URL and genuine /health; package guard rejects local/IP/example/test/credential URLs. Without actual Railway origin there is deliberately no configured dist/.vercel/output. This is a human deployment prerequisite, not an invented URL.

53/53 tests PASS; 21-module/art/audio build PASS; clean isolated NODE_ENV=production package with no dev/parent dependencies PASS; two real Chrome clients over local HTTPS/WSS load case-sensitive assets, join/start ten participants, agree snapshots and reconnect; allowed/denied origins and graceful handler PASS. Static 611 files ~50.5 MB, largest 11.22 MB; local Windows backend peak ~391 MiB, short sample only. Public Railway/Vercel build/TLS/WAN, real cellular phone/Safari, account quotas and Linux OS signal delivery NOT TESTED. Local QA uses ignored self-signed cert, never shipped/trusted globally. CLI help/version only checked/cached: Railway 5.71.0, Vercel 65.9.0.

NEXT is HUMAN ONLY: follow DEPLOY-NOW from login, provision persistent one-replica/app-sleep-off Railway service, get actual domain, set real build variable, deploy Vercel prebuilt, set exact SLAP_ALLOWED_ORIGINS, run check-public and cellular match. No agent should log in/deploy merely on a resume request. Secrets never go in client/config URLs/log reports. Detailed evidence and changed files in HANDOFF/game/DEPLOYMENT/game/VALIDATION.
## Locked rules

2–10 participants, humans plus optional Easy/Hard bots. Host selects 1–3 Slappers, capped at alive minus one. Server runs 60 Hz, snapshots 20 Hz. Random distinct carriers share a randomized 10–17 s fuse. Range/facing-validated slap transfers immediately. Tagged player recovers over 2.0 s: .6 s natural fall excerpt, .15 s down, 1.1 s natural Getting Up excerpt, .15 s settle. Both excerpts play at 1x; no late-fuse shortcut. Recovery/protection prevent stacking and lock movement/actions.

At expiry current Slappers freeze at exact positions; 90 ticks/1.5 s later only those Slappers explode simultaneously. Innocents receive distance-sensitive reactions. One outer ring per elimination; all names announced; 300 ticks/5 s controllable warning. Large danger banner follows each player's current doomed-ring occupancy; safe players receive subtle notice. Chunks and props drop; authoritative boundary shrinks. A player stranded outside the new boundary falls, never teleports inward.

Every participant, including spectators, then shares a paused ascent: first 150 ticks/2.5 s, later 90 ticks/1.5 s. All bodies, actions, cooldown ages and animation mixers pause. Next fuse starts after handback. External three-quarter camera shows city, underside, falling rings and pooled orange/white exhaust; smooth safe entry/return, saved spectator view. No sustained camera shake. Collision remains island-local; presentation altitude is interpolated analytically. Gravity 9.81*(6371/(6371+h))^2 with km altitude; final duel .50g at 2638.9546 km. Constant jump impulse. Winner alternates VictoryA/B; same-room rematch.

Bopling visual scale .50/~1.20 m; capsule radius .30, step .52. Walk .9/run 1.8/sprint 3.8 m/s; carrier exactly 1.15x selected speed. Dash 1.7 m/.22 s/4 s. Jump 5.4. Acceleration/turn smoothing retained. Third-person follow 2.8 m, .9 focus, 70 degrees. Pointer lock/drag/wheel fallback; simultaneous native touch movement/look/actions; independent spectator orbit/pan/zoom/Frame Island.

Eight validated integer body presets 0–7: Orange, Sky Blue, Mint, Lavender, Pink, Yellow, Turquoise, Purple. Optional READY-screen live preview auto-dismisses after 6.5 s; game start closes it immediately. Selection stored locally, replicated by server, retained through elimination/rematch; bots varied. Coral-body shader mask preserves cream features, eyes, lavender belly and toy polish. Cached uniforms provide strong red carrier overlay on every preset; no material allocation per frame.

## Technical decisions

Native browser ESM/Three 0.186.1, persistent Node HTTP/ws process. Shared arena exact segment-to-triangle capsule tests, small horizontal/vertical substeps, ceiling resolution and continuous rounded support at platform edges. Grounded walking and airborne motion use the same collider as bots and prediction; render interpolation constrained. Slap sight is a chest-height sphere line, so small floor-height differences cannot falsely block a valid pass. Roof shortcuts preserve destination height and are only advanced while grounded. Both deterministic layouts 73129/94063 require rebuilt navigation after collider changes. Preserve connected public paths; no teleporting bots. Worst-case physical escape audit is mandatory, not replaced by graph distance checks.

65 original Mixamo bones/source BLEND+GLB unchanged. Animation-only public/animations/GetUp.glb derives from mixamo/Getting Up (5).fbx. TagFall uses Hit .85–1.45 s; RecoverRise uses GetUp 1.6–2.7 s, omitting source seated pre-roll. Existing held Air/Fall, lower locomotion + upper slap, smooth fades and support probes remain; no full foot IK. Character colors change uniforms, not rig or geometry.

Ascent presentation is public/ascent.mjs; three original nozzle positions, six flame cones, pooled trails (126 desktop/54 mobile), one precompiled non-shadow light. Camera path sphere-sweeps geometry and players. Explosion flash/shockwave complements existing fire/sparks/debris/15 s smoke. Existing AAC retained with music duck and new ignition/whoosh synthesis. Spectator closer and collision-constrained. Nameplates, pavement, shadows and approved menu preserved.

## Evidence / release policy

Latest unit result 48/48 PASS, including ceiling/tunneling, real stair jump/dash, paused timelines, late-fuse full recovery, safe cinematic paths, stranded fall and prop-edge microsteps. 384/384 physical worst-start escapes PASS across both rebuilt layouts (4.7833/4.8833 s maximum including .65 s down delay). Final-source four-case normal-clock matrix and three-client complete match/rematch PASS (3,012 shared snapshots, VictoryA/B and .50g). See VALIDATION for exact evidence. Two-client cinematic/color fixture, seven native touch/desktop groups, animation/presentation, visual/audio and camera suites passed. Evidence distinguishes deliberate fixtures from untouched full matches.

Previous working dist/server package and documents preserved under game/archive/pre-cinematic. Do not ship an example server origin. Vercel serves static frontend only; continuous in-memory simulation needs persistent HTTPS/WSS hosting. Environment names: SLAP_SERVER_URL, SLAP_ALLOWED_ORIGINS, PORT; PTB_PORT optional locally. No credentials needed by game code. Rooms require one process/affinity; restart loses rooms.

Public readiness NO. Physical Android/iPhone/Safari, handset audio/thermal soak, public TLS/WAN and Docker execution NOT VERIFIED. Do not call emulated phone viewport a real phone. Complete local final QA, update all four documents, then provision hosting only with user approval and run real-device/public multiplayer signoff.



Gameplay preview remains http://localhost:8902 (LAN http://192.168.1.191:8902); it is not the isolated production-preflight server. Historical cinematic checks passed. Deployment next action and artifact locations are the latest preflight section above and DEPLOY-NOW, not the old example packages. No new local deployment code blocker remains; actual public account/domain/device signoff is still required.

Final visual check: inspected actual eight-color base/red-peak GPU sheet. Coral head uses full red pulse while cream facial features/eyes retain gentler response. Shader-only adjustment followed gameplay matrix; GPU compile/render and rebuilt packages PASS, no simulation change.




## GitHub publication — 2026-10-31
Latest user authorization supersedes the earlier no-push/no-deploy preflight restriction. Target pannapartha/Slap, main. GitHub login completed as pannapartha with repository admin/write access. No SLAP files were tracked in the parent repository; a separate SLAP Git repository preserves that unrelated parent history. Root manifest/lock now make this project standalone; server/build resolve installed dependencies instead of requiring the parent game. Root railway.json/vercel.json configure repository-root deployments. Runtime integrity metadata replaces dependencies on local Blender/source-audio files; those authoring files remain intact locally and are excluded from upload. Root README is canonical for fresh clones. 53 automated tests and local build pass. Real public deployment still needs provider setup/real backend URL; do not invent one or purchase services.

Current hosting blocker: GitHub repo is published; hosting GitHub OAuth signup must not be retried (user reports signups disabled). Existing Vercel account/project slap can use direct CLI. Backend still needs an existing Railway or Render account login, or its running public HTTPS URL. No service purchase/new signup authorized. Use direct deployment, not repository OAuth linking, until provider access is resolved. A legacy test fixture reference was made portable for fresh clones; gameplay unchanged.
