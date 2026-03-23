# V-SHIFT: Comprehensive Implementation Plan

## 1. Executive Summary

Build **V-SHIFT** — a browser-native, high-velocity tactical FPS — using **Three.js + Rapier.js (WASM)** on the frontend and a **Node.js WebSocket game server** on the backend (deployed to **Fly.io**). The game emphasizes mechanical purity: precise movement (B-hops, slides, air-strafing) and zero-RNG gunplay.

> [!IMPORTANT]
> **Scope: Solo + Bots AND Online Multiplayer**
> Phase 1 delivers both **solo play with bots** and **WebSocket-based online multiplayer** via room codes. We use simple WebSocket relay through Fly.io (NOT WebRTC P2P — much simpler). The host client runs authoritative game state; the server relays messages between players. This gives us multiplayer without the complexity of server-side physics or NAT traversal.

---

## 2. Asset Audit & Mapping

### What You Have

| Asset Category | Location | Format | Count | Usable? |
|---|---|---|---|---|
| **Player Models** | `assets/glTF/player-models/` | `.gltf` | 10 (Adventurer, Casual, Formal, Medieval, Punk, SciFi, **Soldier**, Suit, Witch, Worker) | ✅ Yes — use **Soldier** and **SciFi** as primary, others as unlockable skins |
| **Weapons** | `assets/glTF/weapons/` | `.gltf` | 40+ (Assault Rifles ×9, Sniper Rifles ×6, SMGs ×5, Shotguns ×6, Pistols ×6, Revolvers ×5, Bullpups ×3) | ✅ Yes — already converted from OBJ |
| **Weapon Accessories** | `assets/glTF/weapons/Accessories/` | `.gltf` | 15 (Scopes, Silencers, Grips, Bayonets, Bipod, Flashlight, Stock) | ✅ Yes — already converted from OBJ |
| **Nature/Environment** | `assets/glTF/nature-environment/` | `.gltf + .bin + textures` | 93 files (Trees: Birch ×5, Maple ×5, Dead ×10, Pine/Palm textures; Bushes ×6; Flowers ×5; Grass ×3; Rock textures) | ✅ Yes — use for arena decoration/cover objects |

### Asset Mapping to Game Concepts

| Game Concept (from idea.md) | Asset to Use | Notes |
|---|---|---|
| **V-44 Sabre** (Assault Rifle) | `assets/glTF/weapons/AssaultRifle_1.gltf` | Primary workhorse |
| **Bolt-88** (Sniper) | `assets/glTF/weapons/SniperRifle_1.gltf` | High-risk/reward |
| **Cinch-9** (SMG) | `assets/glTF/weapons/SubmachineGun_1.gltf` | Close-quarters slide-bys |
| **Breach-12** (Shotgun) | `assets/glTF/weapons/Shotgun_1.gltf` | Point-blank kinetic impact |
| **Player (The Kinetic)** | `Soldier.gltf` | Movement-focused archetype |
| **Player (The Static)** | `SciFi.gltf` | Anchor/sniper archetype |
| **Player (The Ghost)** | `Punk.gltf` | Flanker archetype |
| **Arena Cover/Obstacles** | Rocks, DeadTrees, Bushes | Procedurally scattered for arena geometry |
| **Arena Decoration** | BirchTrees, MaplesTrees, Flowers, Grass | Outer-ring decoration to frame the arena |

### What's Missing (Need to Create/Source)

| Missing Asset | Solution |
|---|---|
| **Arena Map Geometry** | Build procedurally with Three.js primitives (boxes, ramps, platforms) — fits the "Vector-Station" untextured art style perfectly |
| **Crosshair / HUD elements** | Create as HTML/CSS overlays (no 3D assets needed) |
| **Audio — Gunshots** | Generate with Web Audio API synthesis (punchy, retro-stylized) + free SFX from freesound.org |
| **Audio — B-hop success** | Synthesized "whoosh + click" combo |
| **Audio — Headshot "glass snap"** | Short high-frequency impact SFX |
| **Audio — Sliding** | Low-frequency sweep SFX |
| **Audio — Ambient** | Minimal drone/hum (fits Vector-Station aesthetic) |
| **Audio — UI sounds** | Click, hover, transition SFX |
| **Music — Menu BGM** | Synthwave/electronic loop (source or generate) |

---

## 3. Technology Decisions

### Three.js + Rapier.js (Confirmed)

| Choice | Reasoning |
|---|---|
| **Three.js** (not Babylon.js) | Lighter footprint, better ecosystem for custom physics, more granular WebGL control, massive community. Perfect for the "Vector-Station" minimal art style. |
| **Rapier.js** (WASM physics) | Deterministic physics, excellent for movement-shooter mechanics. Rust-based WASM = near-native perf. Superior to Cannon.js/Ammo.js for this use case. |
| **Vite** (bundler) | Fast HMR, native ES modules, tree-shaking. Best DX for rapid iteration. |
| **Vanilla JS** (no framework) | Game loop doesn't benefit from React/Vue. DOM UI is minimal (menus/HUD). CSS + JS is fine. |
| **Web Audio API** | Native browser audio. No library needed for synthesized SFX. |

### Backend (Node.js on Fly.io)

| Choice | Reasoning |
|---|---|
| **Express.js** | REST API for leaderboard + HTTP endpoints. |
| **`ws` (WebSocket)** | Lightweight WebSocket server for real-time game relay. Runs alongside Express on the same port. |
| **SQLite** (via `better-sqlite3`) | File-based DB, zero config, perfect for Fly.io single-machine. |
| **FingerprintJS** (client-side) | Browser fingerprinting for rate limiting and anti-abuse. No auth needed. |
| **Rate limiter** | `express-rate-limit` + fingerprint-based throttling. |

---

## 4. Game Architecture

### 4.1 Core Game States

```
┌─────────────┐
│  BOOT/LOAD  │──▶ Load assets, init Three.js, init Rapier
└─────────────┘
       │
       ▼
┌──────────────┐
│ NAME SELECT  │──▶ (First boot only) Enter unique callsign
└──────────────┘
       │
       ▼
┌─────────────┐
│  MAIN MENU  │──▶ Play, Settings, Leaderboard, Credits
└─────────────┘
       │
       ▼ (Play)
┌──────────────┐
│ MODE SELECT  │──▶ Solo (vs Bots) / Create Room / Join Room (code)
└──────────────┘
       │
       ▼
┌──────────────┐
│ CLASS SELECT │──▶ Choose Neural Archetype + Loadout
└──────────────┘
       │
       ▼
┌──────────────┐
│    LOBBY     │──▶ (Multiplayer only) Wait for players, show who's joined
└──────────────┘
       │
       ▼
┌─────────────┐
│   IN-GAME   │──▶ Core gameplay loop (spawn → move → fight → die → respawn)
└─────────────┘
       │
       ▼ (Match End)
┌──────────────┐
│  SCOREBOARD  │──▶ Match stats, submit to leaderboard
└──────────────┘
       │
       ▼
┌─────────────┐
│  MAIN MENU  │  (loop)
└─────────────┘
```

### 4.2 Frontend File Structure

```
v-shift/
├── assets/                    # Existing assets (all glTF)
│   └── glTF/                  # Player models, weapons, environment
├── public/
│   ├── audio/                 # [NEW] SFX and music files
│   └── fonts/                 # [NEW] Custom game fonts
├── src/
│   ├── main.js                # Entry point, game state machine
│   ├── core/
│   │   ├── Engine.js          # Three.js + Rapier init, render loop
│   │   ├── InputManager.js    # Raw input capture, pointer lock
│   │   ├── AssetLoader.js     # GLTF/GLB loader with progress
│   │   ├── AudioManager.js    # Web Audio API wrapper
│   │   └── GameState.js       # State machine (menu, playing, paused, etc.)
│   ├── physics/
│   │   ├── PhysicsWorld.js    # Rapier world setup, fixed timestep
│   │   ├── KineticEngine.js   # B-hop, slide, air-strafe logic
│   │   └── Collision.js       # Raycasting for bullets, ground detection
│   ├── entities/
│   │   ├── Player.js          # First-person player controller
│   │   ├── RemotePlayer.js    # Networked player ghost (interpolated)
│   │   ├── WeaponSystem.js    # Weapon switching, recoil, firing
│   │   ├── Projectile.js      # Hitscan + visual tracers
│   │   ├── Grenade.js         # [NEW] Flash, Smoke, Kinetic projectiles
│   │   ├── Spike.js           # [NEW] Plant/defuse mechanic
│   │   └── Bot.js             # Simple AI for solo mode
│   ├── weapons/
│   │   ├── WeaponData.js      # Weapon stats, recoil patterns (data-driven)
│   │   ├── Sidearm.js         # [NEW] Free pistol
│   │   ├── V44Sabre.js        # Assault rifle behavior
│   │   ├── Bolt88.js          # Sniper behavior
│   │   ├── Cinch9.js          # SMG behavior
│   │   ├── Breach12.js        # Shotgun behavior
│   │   └── Knife.js           # [NEW] Melee: slash + backstab
│   ├── world/
│   │   ├── Arena.js           # Map geometry (procedural primitives)
│   │   ├── Skybox.js          # Minimal gradient skybox
│   │   └── Decorations.js     # Scatter trees/rocks around arena edges
│   ├── net/
│   │   ├── NetworkManager.js  # [NEW] WebSocket client, connect/disconnect
│   │   ├── RoomManager.js     # [NEW] Create/join rooms, lobby state
│   │   ├── NetMessages.js     # [NEW] Message types + serialization
│   │   └── Interpolation.js   # [NEW] Smooth remote player movement
│   ├── game/
│   │   ├── RoundManager.js    # [NEW] Round lifecycle: freeze → live → end
│   │   ├── EconomyManager.js  # [NEW] Cash, buy menu logic
│   │   ├── MatchManager.js    # [NEW] Match lifecycle, game mode rules
│   │   ├── FeedbackSystem.js  # [NEW] Hit markers, multi-kills, awards
│   │   └── Ragdoll.js         # [NEW] Death ragdoll physics
│   ├── ui/
│   │   ├── HUD.js             # Crosshair, health, ammo, speed, economy
│   │   ├── BuyMenu.js         # [NEW] Weapon/utility purchase screen
│   │   ├── MainMenu.js        # Start screen with options
│   │   ├── ModeSelect.js      # [NEW] Solo / Create Room / Join Room
│   │   ├── Lobby.js           # [NEW] Pre-match waiting room (MP)
│   │   ├── ClassSelect.js     # Archetype + loadout picker
│   │   ├── Scoreboard.js      # In-match + end-match scoreboard
│   │   ├── Settings.js        # Sensitivity, volume, FOV, keybinds
│   │   ├── Leaderboard.js     # Global leaderboard (fetched from API)
│   │   └── LoadingScreen.js   # Asset loading progress
│   ├── archetypes/
│   │   ├── ArchetypeData.js   # Neural Archetype stats (data-driven)
│   │   ├── Kinetic.js         # +2 frame B-hop window
│   │   ├── Static.js          # -50% visual flinch
│   │   └── Ghost.js           # Silent slides
│   └── utils/
│       ├── MathUtils.js       # Lerp, clamp, vector helpers
│       ├── Fingerprint.js     # Browser fingerprint generation
│       └── API.js             # Backend communication
├── server/
│   ├── index.js               # Express + WebSocket server entry
│   ├── db.js                  # SQLite setup + queries
│   ├── GameRoom.js            # [NEW] Room state: players, lifecycle
│   ├── RoomManager.js         # [NEW] Create/join/destroy rooms
│   ├── wsHandler.js           # [NEW] WebSocket message routing
│   ├── routes/
│   │   ├── leaderboard.js     # GET/POST leaderboard
│   │   ├── rooms.js           # [NEW] GET available rooms
│   │   └── health.js          # Health check for Fly.io
│   ├── middleware/
│   │   ├── rateLimit.js       # Rate limiting + fingerprint throttle
│   │   └── validate.js        # Input validation
│   ├── fly.toml               # Fly.io deployment config
│   └── Dockerfile             # Container config
├── index.html                 # Shell HTML
├── style.css                  # Global styles
├── package.json
└── vite.config.js
```

---

## 5. Proposed Changes (Complete Feature List)

### Features KEPT from idea.md
- ✅ B-hop with tight frame window
- ✅ Cinch Sliding with downhill momentum
- ✅ Air-strafing
- ✅ 4 weapons with fixed recoil patterns (V-44 Sabre, Bolt-88, Cinch-9, Breach-12)
- ✅ 3 Neural Archetypes (Kinetic, Static, Ghost)
- ✅ Vector-Station art style (clean, untextured geometry)
- ✅ glTF/GLB assets
- ✅ Fly.io backend
- ✅ Browser-native, no download

> [!NOTE]
> Full game design details (weapon stats, economy values, feedback tables) are in [game_design_deep_dive.md](file:///Users/danyaljaved/.gemini/antigravity/brain/a847d089-564d-4b32-b7ad-c35b6ced5480/game_design_deep_dive.md)

### Features ADDED (for a complete game)
- 🆕 **Player Callsign** — unique name entry on first boot
- 🆕 **Round-Based Competitive Mode** — 13 rounds, freeze time, half-time side swap, overtime
- 🆕 **Economy System** — cash per round, kill rewards, loss bonuses, buy menu
- 🆕 **Spike Plant/Defuse** — CS-style objective: attackers plant, defenders defuse
- 🆕 **Buy Menu** — weapons, armor, utility, accessible during freeze time
- 🆕 **3 Utility Grenades** — Flash, Smoke, and Kinetic (physics-push, unique to V-SHIFT)
- 🆕 **2 Extra Weapons** — Sidearm (pistol, free) + Knife (melee, backstab = instant kill)
- 🆕 **3 Game Modes** — Competitive (default), Deathmatch (casual), Gun Game (party)
- 🆕 **Layered Hit Feedback** — different visuals/audio for body, headshot, wallbang, knife
- 🆕 **Multi-Kill Announcements** — Double, Triple, Quad, Rampage, Ace
- 🆕 **Movement Reward System** — slide kills, airshots, no-scopes, B-hop chains
- 🆕 **Ragdoll Death Physics** — directional force, shotgun launches, persistent bodies
- 🆕 **End-of-Match Awards** — MVP, Sharpshooter, Speed Demon, Anchor, etc.
- 🆕 **WebSocket Multiplayer** — create/join rooms via room codes
- 🆕 **Full UI Suite** — Main Menu, Loading, Mode Select, Lobby, Class Select, Settings, Scoreboard, Leaderboard, Pause, Buy Menu
- 🆕 **Audio System** — synthesized weapon SFX, movement SFX, announcements, ambient
- 🆕 **Bot AI** — patrol/chase/attack for solo mode

### Features REMOVED / DEFERRED
- ❌ **WebRTC P2P** → Replaced with simpler WebSocket relay (same result, easier implementation)
- ❌ **Havok Physics** → Using Rapier.js instead (better WASM integration, open source)
- ❌ **Babylon.js** → Using Three.js (lighter, more control for custom physics)
- ~~❌ **OBJ → GLB conversion**~~ → ✅ Already done by user

---

## 6. Backend Design

### REST API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Health check | None |
| `GET` | `/api/leaderboard` | Top 100 scores | None |
| `POST` | `/api/leaderboard` | Submit score | Fingerprint |
| `GET` | `/api/leaderboard/:fingerprint` | Player's own scores | Fingerprint |
| `GET` | `/api/rooms` | List active public rooms | None |
| `GET` | `/api/name/check/:name` | Check if callsign is available | None |
| `POST` | `/api/name/register` | Register callsign to fingerprint | Fingerprint |

### WebSocket Protocol (Game Relay)

The server acts as a **message relay** — it does NOT run game physics. The **room host** (first player to create the room) runs authoritative game state and broadcasts it.

| Message (Client → Server) | Description |
|---|---|
| `CREATE_ROOM { name, maxPlayers }` | Host creates a room, gets back a 4-char room code |
| `JOIN_ROOM { code, playerName }` | Player joins an existing room |
| `PLAYER_STATE { pos, rot, vel, hp, weapon }` | Sent every tick (~20Hz) by each player |
| `PLAYER_SHOOT { origin, dir, weaponId }` | Player fired a weapon |
| `PLAYER_HIT { targetId, damage }` | Host confirms a hit |
| `PLAYER_DIED { playerId, killerId }` | Host confirms a kill |
| `CHAT { message }` | Chat message |
| `START_MATCH` | Host starts the match from lobby |
| `LEAVE_ROOM` | Player disconnects |

| Message (Server → Client) | Description |
|---|---|
| `ROOM_CREATED { code }` | Confirm room creation |
| `PLAYER_JOINED { id, name }` | New player entered |
| `PLAYER_LEFT { id }` | Player disconnected |
| `GAME_STATE { players[] }` | Relayed state snapshot |
| `MATCH_STARTED` | Match has begun |
| `MATCH_ENDED { scores[] }` | Final scores |

### Anti-Abuse Strategy

1. **Browser Fingerprint** (via `@fingerprintjs/fingerprintjs`) — unique visitor ID without login
2. **Rate Limiting** — max 10 score submissions per fingerprint per hour
3. **Score Validation** — server-side sanity checks (max kills, min match duration, etc.)
4. **IP Rate Limiting** — max 60 requests/min per IP via `express-rate-limit`
5. **Room limits** — max 8 players/room, max 20 active rooms per server, rooms auto-close after 15min idle

### Database Schema (SQLite)

```sql
CREATE TABLE players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT UNIQUE NOT NULL,
  callsign TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT NOT NULL,
  kills INTEGER NOT NULL,
  deaths INTEGER NOT NULL,
  score INTEGER NOT NULL,
  archetype TEXT NOT NULL,
  match_duration_seconds INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scores_score ON scores(score DESC);
CREATE INDEX idx_scores_fingerprint ON scores(fingerprint);
```

---

## 7. Verification Plan

### Automated / Dev Verification
1. **Asset Verification** — Load one weapon and one player model in Three.js scene, verify they render correctly
2. **Dev Server** — Run `npm run dev`, open in browser, verify Three.js scene renders
3. **Physics** — Verify player can move, jump, and collide with arena geometry
4. **Weapons** — Verify all 4 weapons fire, switch, and display recoil patterns
5. **Backend** — Run `node server/index.js`, hit `GET /api/health`, verify 200 response
6. **Leaderboard** — `POST /api/leaderboard` with test data, then `GET` and verify it appears
7. **Multiplayer** — Open two browser tabs, create room in tab 1, join with code in tab 2, verify both players see each other moving

### Manual Verification (User Testing)
1. **Movement Feel** — User plays and confirms B-hop, slide, and air-strafe feel responsive and rewarding
2. **UI Flow** — Main Menu → Mode Select → Class Select → (Lobby) → In-Game → Scoreboard → Main Menu
3. **Multiplayer** — Two browsers, create + join room, play a match, verify kill/death sync
4. **Audio** — Confirm weapon sounds, B-hop feedback, and UI sounds play correctly
5. **Settings** — Change sensitivity/FOV/volume, verify they persist across page reloads
6. **Leaderboard** — Complete a match, verify score submits and appears on leaderboard screen
7. **Browser Compatibility** — Test on Chrome and Firefox (minimum)

---

## 8. Decisions (All Resolved)

| # | Decision | Resolution |
|---|---|---|
| 1 | Scope | ✅ Solo+Bots AND WebSocket multiplayer in Phase 1 |
| 2 | Engine | ✅ Three.js + Rapier.js |
| 3 | Asset conversion | ✅ Already done by user |
| 4 | Multiplayer model | ✅ Host-authoritative WebSocket relay via Fly.io |
| 5 | Audio | ✅ Web Audio API synthesis + source free music for menu |
| 6 | Nature assets | ✅ Option (B): Strip textures, render as flat-colored geometry |
| 7 | Player models | ✅ Used for bots, enemies, and remote players |
