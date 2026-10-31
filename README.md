# SLAP — Pass the Bomb

Multiplayer 3D browser party game: Boplings pass timed bombs in a shrinking floating toy city. Up to ten humans/bots, authoritative WebSocket server, third-person desktop/touch controls, spectators and rematches.

## Run from a fresh clone

Node **22.x**. No files from a parent project are required.

```sh
npm ci
npm start
```

Open the printed port (default http://localhost:8897). `npm test` runs the automated suite; `npm run build` checks runtime modules, navigation and exact asset integrity. Browser QA requires installed Chrome. Gameplay and source art are preserved.

## Deploy this repository

**Railway:** connect `pannapartha/Slap`, branch `main`, repository root `/`. Root `railway.json` selects Railpack, validates the build and launches `node game/server.mjs`. Set `NODE_ENV=production`, `PORT=8897`, and later `SLAP_ALLOWED_ORIGINS` to the exact Vercel HTTPS origin. Configure one instance/region and disable App Sleep. HTTP `/health`, WebSocket `/ws`. Rooms reset on restart.

**Vercel:** import the same repository, root directory `/`, framework Other. Root `vercel.json` uses `npm ci`, `npm run build:production`, output `game/dist`. Set **SLAP_SERVER_URL** to the real Railway HTTPS origin first; the build validates its health/TLS and refuses example/local URLs. After deployment, allow the actual Vercel production alias on Railway. No WebSocket server runs on Vercel.

Share the Vercel production alias, then test desktop and a cellular phone in one room. See [deployment details](game/DEPLOYMENT.md), [human checklist](DEPLOY-NOW.md), [handoff](HANDOFF.md) and [validation](game/VALIDATION.md).

The repository includes required GLBs, collision/navigation data and approved runtime audio. Local Blender/FBX authoring files, reference media, caches, secrets, recordings and generated release packages are intentionally excluded and remain on the author's PC. Regenerating character assets requires those local authoring sources; running/deploying the game does not.
