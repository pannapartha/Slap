# Deployment preflight — 2026-10-31 (current)

No gameplay/animation/physics/UI/music/bot/cinematic changes. No login, purchase, Git push or hosted deployment. Human instructions: ../DEPLOY-NOW.md; full architecture/commands: DEPLOYMENT.md. **Local preflight PASS; public release NOT CONFIGURED.**

| Category | Result |
| --- | --- |
| Existing + deployment tests | **PASS 53/53**, evidence/preflight-all-tests.log (48 baseline + five deployment checks) |
| Native ESM/data/source art/audio build | **PASS**, preflight-build.log; 21 runtime modules, original art/audio preserved |
| Portable production lock/install | **PASS**, clean isolated npm ci --omit=dev; exactly three runtime dependencies, no file links/dev tools/parent fallback |
| Startup / network / protocol | **PASS locally**, real packaged NODE_ENV=production entry, PORT, 0.0.0.0, health, exact Origin allowlist/default deny, max 10 seats, graceful 1012/idempotent close/listen-error handling |
| Split server browser checks | **PASS**, preflight-split-browser.log: separate-origin two-browser real-fuse match/reconnect/rematch; preflight-isolated-tls.json: local self-signed HTTPS frontend + WSS TLS proxy + isolated actual CLI, ten participants, equal snapshots, reconnect and mobile viewport/buttons, zero captured errors |
| Static paths/limits | **PASS**, case-sensitive requested assets and module imports, 611 files/~50.5 MB, largest 11.22 MB, no private configuration/keys in artifact; preflight-static-assets.json |
| Configured public frontend output | **BLOCKED / NOT CONFIGURED**: real Railway origin is absent. Missing/example/local targets fail before output. Old placeholder dist/.vercel were preserved outside upload locations, not published |
| CLI prep | **PASS**, Railway 5.71.0 / Vercel 65.9.0 help/version checked/cached; no auth command executed. Prepared Railpack config and pinned package |
| Public Railway/Vercel build/network | **NOT TESTED**: no service/account/project mutation or real public domain |
| Real cellular phone / Safari / thermal/audio | **NOT TESTED** in this preflight; mobile emulation is not a handset |
| Linux OS signal delivery / Docker | **NOT TESTED**; emitted the actual Node SIGTERM handler locally, observed close 1012 / exit 0. Original Dockerfile unchanged |

Evidence: preflight-isolated-tls.json/.log, preflight-isolated-install.log, preflight-package.log, preflight-install.log, preflight-fail-closed.json and CLI help/version logs. Local ten-participant backend peak ~391 MiB on Windows, short sample only; leave headroom and verify hosted metrics/limits. Production packages exclude the ignored local self-signed QA PFX; no trust-store installation. No secrets added/exposed.

Fixed deployment blockers: portable lockfile replaces accidental local file:../.. dependency; real HTTPS/health build gate replaces publishable example URL; output preservation replaces destructive regeneration; production origin default deny; validated startup/PORT and graceful shutdown. Normal browser network loss resumes the same seat; server redeploy still resets in-memory rooms as designed. Current source hashes show gameplay/character/camera/nav modules unchanged.

Remaining human actions: Railway/Vercel login and account eligibility, provision real server/domain, build with actual SLAP_SERVER_URL, set exact frontend SLAP_ALLOWED_ORIGINS, public checker and cellular match/rematch. No new local code blocker found. Historical gameplay evidence below remains valid for that pass; its example-package statements are superseded by this preflight.

---
# SLAP — cinematic publication validation

2026-10-31. Working preview http://localhost:8902 ; LAN http://192.168.1.191:8902 . No external deployment or push. See ../HANDOFF.md for portable source map and DEPLOYMENT.md for manual hosting commands. Previous release snapshot is archive/pre-cinematic; its 37-test results are historical.

## Current results

| Check | Result and evidence under evidence/ |
| --- | --- |
| Automated tests | **48/48 PASS**, cinematic-unit.log; simulation/socket/navigation/spawn/camera plus new full-capsule wall/ceiling/tunneling, real stair jump/dash, edge/rail support, non-hovering nav, chest-height slap sight, roof evacuation, 2 s late-fuse recovery, paused ascent timeline/cooldowns and camera cleanup |
| Build/source preservation | **PASS**, cinematic-build.log; 21 runtime modules, both datasets/GetUp present, four original character/city BLEND/GLB hashes unchanged, approved soundtrack exact copy |
| Worst-start physical escapes | **384/384 PASS**, cinematic-escape-73129.log / -94063.log and deadline-escape-physical-SEED.json. 192 starts per seed, every 1–3-ring removal across nine ring counts; includes .65 s initial knockdown, no jump/dash. Maximum 4.7833 / 4.8833 s, unchanged 5 s limit |
| Graph connectivity | **PASS**, cinematic-nav-SEED.log / escape-paths-SEED.json. No unreachable valid cells, outer-ring nonempty guard. Worst 14.4426 / 15.2485 m; sprint time + .4 s reaction <5 s. Nav/physical tests are separate |
| Full normal-clock matrix | **4/4 PASS on final source**, cinematic-matrix-final.log / release-matrix.json; see table below. Both multiplayer snapshot streams identical |
| Complete rematch / alternating dances | **PASS on final source**, cinematic-complete-rematch.log / deadline-match-report.json. Three concurrent Chrome clients, 3,012 compared snapshots, keyboard transfer/remote moving slap/full get-up, first winner VictoryA, complete Easy rematch VictoryB, final duel .50g, music loop and one replacement. Initial passing setup/rematch human-seat parking explicitly documented |
| Cinematic/color browser fixture | **PASS on final source**; cinematic-browser.json / cinematic-browser-final.log. Two real Chrome pages, one touch landscape emulation; fixture changes positions/first fuse/ownership explicitly recorded, separate from normal-clock matrix |
| Native controls | **PASS**, cinematic-controls.log / third-person-controls-report.json; pointer lock/mouse/WASD, wall restore, true LAN HTTP drag/wheel fallback, three simultaneous touch IDs for move+look+actions, portrait/landscape |
| Animation/presentation | **PASS**, cinematic-animation.log / cinematic-presentation.log. Actual 65-bone finite skin poses, moving lower/upper masks, 20 s idle no restarts, held Air/Fall, natural Hit/Down/GetUp/settle 1x excerpts, dances |
| Camera/grounding | **PASS**, unit 4,224 samples plus cinematic-feel.log / pass1 browser wall/corner/sole/shadow checks. New camera temporal sphere sweep and cinematic entry/return safety unit checks pass |
| Visual/audio/UI | **PASS**, cinematic-visual.log. Music decoding/loop/one source/urgency/duck/settings, targeted per-player warning, shadows, replicated atmosphere, names/arrows, desktop/touch HUD. Physical listening NOT VERIFIED |
| Split production networking | **PASS on final source**, cinematic-production.log / release-production-test.json. Built static frontend on separate origin from persistent server; two browsers, real-fuse match, seat reconnect, agreed winner/rematch, Origin rejection. Final source repeat PASS |
| Server package | **PASS**, cinematic-server-package/lock/install/smoke.log; pinned install with zero audit vulnerabilities, standalone ephemeral /health 200, package source/navigation match current runtime |
| Public-HTTPS build / Vercel static output | Historical packaging PASS only; superseded by current preflight. Those example artifacts are quarantined/preserved. Current configured public output is blocked until real Railway origin exists |
| Current preview | **PASS**, cinematic-preview-check.log; 8902 ready, /health, /network, music, GetUp and alternate collision load; no captured page errors |
| Real phone / Safari / thermal soak | **NOT VERIFIED**; native Chrome touch emulation is not a handset |
| Public TLS / WSS / WAN deployment | **NOT VERIFIED**; no actual public backend/frontend provisioned |
| Docker | **NOT TESTED**; unavailable on this PC |

## Confirmed bugs fixed

Full vertical segment-to-triangle capsule replaces incomplete sampled contacts; all surfaces now block airborne motion with small-step/binary first contact, including ceilings. Rounded ground support follows real upper faces and edge contacts continuously, including shallow rail faces. Nav stores actual-radius foot height and separately checks clearance, avoiding hovering starts. Supported-height shortcut checks and grounded waypoint advancement prevent facade cuts after roof descent. Render extrapolation is constrained and camera motion checked between frames.

The new all-surface collider initially made a small courtyard floor change block a foot-level slap sight test. Sight is now a small chest-level sphere path; range/direction/ownership/protection remain authoritative. Added real-height regression. The keyboard-driven browser test exposed this issue; it was not a cosmetic-only fix.

Tagged recovery now 2.0 s with real 1x fall/rise excerpts, brief down/settle and no near-fuse shortcut. Ascent holds bodies/actions/mixers/cooldown ages 2.5/1.5 s; no next fuse before handback. Stranded survivors fall rather than being rescued by the old edge clamp. Stronger pooled exhaust/flash/light/ignition and explosion flash/shockwave, closer collision-aware spectator, eight validated replicated body colors. Thruster light/trails explicitly clear after cinematic and on rematch.

## Actual visual and performance checks

Reviewed actual READY desktop/mobile renders, chosen fall/get-up source pose sheets, whole-island ascent/underside/bright orange-white exhaust and returned gameplay screenshots. cinematic-transition.webm is actual captured WebGL canvas at 30 fps, **no HUD/audio track**. Cinematic browser fixture inspects both survivor and eliminated spectator views, safe camera state, replicated color selections and all eight red pulse uniforms/material counts. A shader-uniform check is not a physical-phone visual signoff.

PC RTX4070 Laptop Chrome, ten participants: approximately 115 FPS desktop Standard / 133 FPS emulated phone viewport Light in cinematic-visual.log. These are short QA samples with other audits running, not handset measurements. Pooled cinematic exhaust uses six cones, 126 desktop/54 mobile trail instances and one non-shadow light. Final ascent sampling: desktop 321 frames, median 5.6 ms / p95 11.2 ms / max 27.6 ms; emulated touch 341 frames, median 5.6 / p95 11.2 / max 38.9 ms. Collected during capture/other QA; screenshot/recording overhead included. Cleanup confirms light intensity 0 and trails hidden on both clients. Do not infer stable mobile 60 FPS from desktop emulation.

## Evidence honesty

Early capsule/nav development produced failed physical escape runs (118/101, then 25/16, 5/1, 2/2, finally 0/1); fixed before current 384/384 acceptance. Prior generated logs/failed screenshots may remain. Current named physical logs and JSON above supersede them. Legacy three-client combat fixture required synchronization fixes: wait for actual approach/facing, sample the brief moving slap across rendered frames rather than one late frame. Fixture updates do not relax collision, 5 s escape or authoritative game-rule assertions.

Human seats in the normal-clock matrix are browser-automated and idle after lobby setup; bots run normally, no parked protected humans, teleports, fuse overrides or forced outcomes. Rematch validation there ends at the next live round. The separate complete-rematch suite exercises VictoryB and music replacement. Passing browser runs have zero captured errors/missing requested assets; this is bounded evidence, not proof over arbitrary scenes/devices.

## Release verdict

**Production readiness: NO.** Local acceptance and packaging do not verify actual public multiplayer. Remaining required signoff: real Android/iPhone controls/camera/recovery/spectator/audio and Light-mode thermal soak; actual persistent HTTPS/WSS host, correct allowed origins, public WAN match/reconnect/rematch. Limited two-seed city pool, no full planted-foot IK, in-memory room loss on restart and one-instance/affinity hosting remain known constraints. No new assets, UI redesign or architecture migration.


## Final-source normal-clock matrix

| Humans | Bots | Difficulty | Slappers | Match seconds | Identical paired snapshots | Max grounded navigation pause | Result |
| ---: | ---: | --- | ---: | ---: | ---: | ---: | --- |
| 1 | 9 | Easy | 1 | 198.83 | single client | .95 s | PASS |
| 1 | 9 | Hard | 3 | 69.17 | single client | 1.07 s | PASS |
| 2 | 8 | Easy | 2 | 113.75 | 1,900 | 1.38 s | PASS |
| 2 | 8 | Hard | 3 | 64.57 | 1,043 | .43 s | PASS |

All ten valid separated spawns, identical city plans, exact 90-tick freeze→blast and 300-tick warning→detach, exploding IDs equal frozen IDs, final winner and same-room alternate-layout rematch to next live round. No forced outcomes or shortened fuses in these cases. No permanent bot stall observed in this bounded audit. Complete-rematch suite independently reaches VictoryB.


Final visual acceptance: `evidence/cinematic-color-render-sheet.png` contains actual GPU-rendered base/red-peak pairs for all eight colors, inspected after the final coral-head pulse mask correction; cream face and eyes remain readable. `cinematic-color-render.log` PASS, zero browser/shader errors. The material-only correction followed the full gameplay matrix and does not change simulation/networking. Rebuilt static/Vercel packages and copied this exact shader into the installed server package afterward. Source art hashes remain unchanged.

