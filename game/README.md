# SLAP · Pass the Bomb

Existing multiplayer browser game with shrinking floating city, authoritative bomb passing, Easy/Hard bots and two deterministic city variants.

Run `npm start` **here**. Gameplay preview (not production-preflight server): http://localhost:8902 ; Wi-Fi http://192.168.1.191:8902 (CLI default remains 8897) . Lobby and `/network` show current IP. PTB_PORT overrides; binds 0.0.0.0 and WebSocket follows page host/protocol. Older previews remain; use 8902 for the final QA build.

Install with `npm ci` at `G:\Floor is Lava` first, Node >=22.18. Parent start launches another game. Keep Slap/game, Slap/bopling, Slap/world-assets and parent node_modules together when migrating.

Create/join five-character room, select bots/difficulty/carriers, ready and start. WASD, C walk, Shift sprint, Space jump, E/click slap, Q dash. Click for pointer lock, mouse/trackpad look, LAN drag fallback. Touch: left joystick/outer-zone sprint, right look and separated action buttons. Spectators orbit/pan/zoom or follow. Settings include sensitivity, reduced shake, Light graphics, music/SFX.

- `npm run build`: module/data/art/music checks.
- `npm test`: 53 automated tests, serial workers.
- `npm run test:controls`: pointer lock/LAN fallback/native multitouch/orientations.
- `npm run test:animation`: finite skinned states.
- `npm run test:deadline`: presentation audit + three-client full match/rematch.
- `npm run test:browser`: same current three-client full match.
- `npm run test:visual`: UI/lighting/audio and 2/5/10 participant desktop observations.
- `npm run test:feel`: camera/grounding + default layout escape stress.
- `node check-escape.mjs 73129` and `node check-escape.mjs 94063`: both physical escape suites.
- `npm run build:layouts`: both collision/nav variants after deliberate layout/clearance changes.
- `node preview-check.mjs`: ready/assets check (set PTB_URL to http://localhost:8902 for current QA preview).

Read [portable handoff](../HANDOFF.md), [canonical memory](../BRAIN.md) and [validation](VALIDATION.md). Source art unchanged; new GetUp is animation-only. Public release needs real-phone/WebKit/thermal/WAN QA and HTTPS/WSS hosting. No push/deploy performed.

Production preparation: npm run build:production (requires SLAP_SERVER_URL), npm run package:vercel, npm run package:server. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact manual commands, named environment variables and separate persistent server setup. npm run test:release runs the four-case full matrix; node release-matrix.mjs --final-only runs the final two-client Hard regression; npm run test:production checks split-origin output and reconnect. Public release readiness remains NO until real-device/TLS/WAN signoff. No external deployment.


Deployment preflight: [DEPLOY NOW](../DEPLOY-NOW.md). Current server upload is release/railway with its own pinned production lockfile and Railpack config. Old release/server and placeholder frontend outputs are historical recovery only; old dist/.vercel output was preserved outside upload paths. No configured public frontend exists until a real HTTPS backend passes the build health gate. See DEPLOYMENT.md. No gameplay changes in this preflight.

