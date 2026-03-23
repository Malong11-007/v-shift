# V-SHIFT — Master Task List

> Every task is written so a junior dev can pick it up and execute it.
> Complete them **in order** — later tasks depend on earlier ones.

---

## Phase 0: Project Scaffolding
- [x] **0.1** Initialize Vite project in `v-shift/` root (`npx -y create-vite@latest ./ -- --template vanilla`)
- [x] **0.2** Install frontend dependencies: `three`, `@dimforge/rapier3d-compat`, `@fingerprintjs/fingerprintjs`
- [x] **0.3** Create the folder structure (`src/core/`, `src/physics/`, `src/entities/`, `src/weapons/`, `src/world/`, `src/net/`, `src/ui/`, `src/archetypes/`, `src/utils/`, `server/`, `public/audio/`, `public/fonts/`)
- [x] **0.4** Set up `vite.config.js` — configure WASM support for Rapier, alias `@/` to `src/`
- [x] **0.5** Create shell `index.html` with a `<canvas id="game-canvas">` and a `<div id="ui-root">` overlay
- [x] **0.6** Create `style.css` — set `body { margin: 0; overflow: hidden; }`, import a clean font (e.g. Inter from Google Fonts), define CSS variables for the game's color palette (dark bg, neon accent, white text)
- [x] **0.7** Create `src/main.js` — import Three.js, render a spinning cube to confirm setup works. Run `npm run dev` and verify in browser.

---

## Phase 1: Asset Verification
- [ ] **1.1** Verify player models load: write a quick test in `main.js` that loads [Soldier.gltf](file:///Users/danyaljaved/random/v-shift/assets/glTF/player-models/Soldier.gltf) from `assets/glTF/player-models/` into the scene
- [ ] **1.2** Verify weapons load as `.gltf` — test one from each category:
  - `AssaultRifle_1.gltf`, `SniperRifle_1.gltf`, `SubmachineGun_1.gltf`, `Shotgun_1.gltf`
- [ ] **1.3** Verify accessories load: `Scope_1.gltf`, `Silencer_1.gltf`

---

## Phase 2: Core Engine
- [x] **2.1** Create `src/core/Engine.js`
  - Init `THREE.WebGLRenderer` (antialias, pixel ratio, resize handler)
  - Init `THREE.Scene` + `THREE.PerspectiveCamera` (FOV: 90 default)
  - Create the render loop with `requestAnimationFrame`
  - Export a singleton engine instance
- [x] **2.2** Create `src/core/GameState.js`
  - Finite state machine with states: `LOADING`, `NAME_SELECT`, `MAIN_MENU`, `MODE_SELECT`, `CLASS_SELECT`, `LOBBY`, `PLAYING`, `PAUSED`, `SCOREBOARD`
  - `transition(newState)` method with enter/exit hooks
  - Emit events so UI can listen for state changes
- [x] **2.3** Create `src/core/InputManager.js`
  - Pointer Lock API integration (request on click, release on Escape)
  - Track: mouse delta (X/Y), keys currently held (Map), mouse buttons
  - Expose `isKeyDown(key)`, `getMouseDelta()`, `isMouseDown(button)`
  - Fire custom events: `onShoot`, `onJump`, `onCrouch`, `onWeaponSwitch(slot)`
- [x] **2.4** Create `src/core/AssetLoader.js`
  - Wrapper around `THREE.GLTFLoader`
  - `loadModel(path)` → returns Promise\<THREE.Group\>
  - `loadAll(manifest[])` → loads all assets with a progress callback (0–100%)
  - Cache loaded assets in a Map to avoid re-loads
- [x] **2.5** Wire everything together in `main.js`:
  - Boot → init Engine → init GameState → transition to `LOADING` → load a test asset → transition to `MAIN_MENU`
  - Verify the state transitions work by logging to console

---

## Phase 3: Physics World
- [x] **3.1** Create `src/physics/PhysicsWorld.js`
  - Import and init Rapier WASM module
  - Create physics `World` with gravity `(0, -30, 0)` (stronger than real = snappy feel)
  - Fixed timestep loop (60Hz) decoupled from render loop
  - Helper to create static colliders (boxes, planes) for arena geometry
  - Helper to create dynamic rigid bodies (for player capsule)
- [x] **3.2** Create `src/physics/KineticEngine.js`
  - Implement the movement pipeline. Input: key states + physics body. Output: velocity changes applied to rigid body.
  - **Ground movement**: Apply acceleration in look direction when W/S/A/D held. Apply friction when no keys held.
  - **Jumping**: On Space press while grounded → apply upward impulse
  - **B-hop ("Perfect Link")**: If Space is pressed within 3 frames (~50ms at 60fps) of landing, skip ground friction and multiply velocity by 1.05×
  - **Cinch Sliding**: If Ctrl pressed while speed > threshold → enter slide state, reduce friction coeff to 0.05, apply gravity-based acceleration on slopes
  - **Air-strafing**: While airborne, A/D + mouse movement adds velocity perpendicular to current direction (Quake-style)
- [x] **3.3** Create `src/physics/Collision.js`
  - Raycast function for hitscan weapons: `castRay(origin, direction, maxDist)` → returns `{ hit: bool, point: Vec3, normal: Vec3, entity: Entity }`
  - Ground detection: short downward raycast from player feet → `isGrounded()` bool

---

## Phase 4: Arena / World
- [x] **4.1** Create `src/world/Arena.js`
  - Build a medium-sized arena from Three.js primitives (boxes, ramps, platforms)
  - Design: Rectangular base (~80×60 units) with ramps, elevated platforms, cover walls, a central column
  - Use MeshStandardMaterial with flat colors (white, light gray, accent color) — "Vector-Station" style
  - Register all geometry as static Rapier colliders
- [x] **4.2** Create `src/world/Skybox.js`
  - Gradient sky using a large sphere with a ShaderMaterial (top: dark blue/purple, bottom: near-black)
  - Add subtle animated grid lines or particle dust for atmosphere
- [x] **4.3** Create `src/world/Decorations.js`
  - Load a subset of nature assets (DeadTrees, rocks)
  - Strip textures, apply flat monochrome material to match the art style
  - Scatter around arena edges (outside the playable area) as visual framing

---

## Phase 5: Player Controller
- [x] **5.1** Create `src/entities/Player.js`
  - First-person camera controller attached to a Rapier capsule rigid body
  - Apply KineticEngine movement each physics tick
  - Mouse look: apply deltaX to yaw (rotate body), deltaY to pitch (rotate camera only, clamp ±89°)
  - Properties: `health` (100), `speed`, `isAlive`, `currentWeapon`
  - Methods: `takeDamage(amount)`, `die()`, `respawn(spawnPoint)`
- [x] **5.2** Implement spawn system
  - Define 4–6 spawn points on the arena
  - On respawn: pick random spawn furthest from enemies, reset health, 3-second invulnerability
- [x] **5.3** Implement archetype modifiers
  - Create `src/archetypes/ArchetypeData.js` — data file with stats for Kinetic, Static, Ghost
  - Modify Player.js to read archetype and apply: 
    - Kinetic: `bhopWindow = 5 frames` instead of 3
    - Static: flinch multiplier = 0.5
    - Ghost: slide sound volume = 0

---

## Phase 6: Weapons System
- [x] **6.1** Create `src/weapons/WeaponData.js` — JSON-style config for ALL 6 weapons:
  ```
  Sidearm:     { type: 'semi',  damage: { body: 28, head: 70 },  magSize: 12, reloadTime: 1.5s, cost: 0,    killReward: 300  }
  Cinch9:      { type: 'auto',  damage: { body: 15, head: 38 },  magSize: 35, reloadTime: 1.8s, cost: 1500, killReward: 600  }
  Breach12:    { type: 'pump',  damage: { body: 12×8, head: 18×8 }, magSize: 6,  reloadTime: 0.5s/shell, cost: 1800, killReward: 900  }
  V44Sabre:    { type: 'auto',  damage: { body: 22, head: 88 },  magSize: 30, reloadTime: 2.2s, cost: 2700, killReward: 300  }
  Bolt88:      { type: 'bolt',  damage: { body: 100, head: 150 }, magSize: 5,  reloadTime: 3.5s, cost: 4750, killReward: 100  }
  Knife:       { type: 'melee', damage: { slash: 50, backstab: 150 }, cost: 0, killReward: 1500 }
  ```
- [x] **6.2** Create `src/entities/WeaponSystem.js`
  - Manages: current weapon, ammo, reload state, fire rate timer
  - On fire: cast ray from camera center, determine hit type (body/head), apply damage, apply recoil offset
  - Recoil recovery: camera smoothly returns to pre-shot position between shots
  - Weapon switching: number keys 1–6, short equip animation (lerp weapon model position)
  - Move speed penalty: each weapon has a `moveSpeedMultiplier` applied while equipped
- [ ] **6.3** Create individual weapon files (`Sidearm.js`, `V44Sabre.js`, `Bolt88.js`, `Cinch9.js`, `Breach12.js`, `Knife.js`)
  - Each loads its `.gltf` model (Knife = simple geometric model, no asset needed)
  - Positions the model in first-person view (bottom-right of camera)
  - Defines unique recoil pattern array (sequence of [dx, dy] offsets)
- [ ] **6.4** Implement Breach-12 shotgun pellet spread
  - Fire 8 rays in a fixed cone pattern (not random!)
  - Each ray evaluates body/head independently
- [ ] **6.5** Implement Knife mechanics
  - Left click: front slash (50 damage, short range ~2m)
  - Right click: lunge stab (50 damage front, **150 damage from behind** = instant kill)
  - Fastest equip speed, 100% movement speed
- [x] **6.6** Create `src/entities/Grenade.js`
  - Base projectile: thrown with arc physics (Rapier rigid body), bounces off walls
  - **Flash Grenade**: on detonation, players looking at it within 15m get white-screened for 2s. Uses dot-product to check facing direction.
  - **Smoke Grenade**: blooms into opaque particle sphere (~5m radius) lasting 8s. Blocks raycasts through it.
  - **Kinetic Grenade**: explodes with physics impulse (no damage). Pushes all rigid bodies within 8m. Force = inverseProportion(distance). Can self-boost!
  - Throw with G key, cycle with mouse scroll while holding G
- [x] **6.7** Create `src/entities/Spike.js`
  - Spke carried by one attacker (random or volunteered)
  - `E` to plant at designated site (3.5s channel, progress bar on HUD, interruptible by damage)
  - Once planted: 40s fuse, beeping SFX that accelerates, visible timer on HUD for all players
  - Defenders defuse with `E` (5s channel, same interruptible rules)
  - Spike sites: 2 per arena, marked with holographic indicators

---

## Phase 7a: Round & Economy System
- [x] **7a.1** Create `src/game/RoundManager.js`
  - Round state machine: `FREEZE_TIME` (10s) → `LIVE` (90s) → `ROUND_END` (5s) → next round
  - Win conditions: team eliminated, spike detonated, spike defused, timer expires (defenders win)
  - Track round count, half-time swap (after round 6), match end (first to 7)
  - Overtime: if 6-6, play 3 extra rounds (first to 8)
- [x] **7a.2** Create `src/game/EconomyManager.js`
  - Track cash per player. Starting cash: $800 (pistol rounds 1 & 7), else carry over
  - Kill rewards: see `WeaponData.js` killReward field. Headshot bonus: +$100
  - Round win: +$3250. Round loss: $1400/$1900/$2400/$2900 (escalating consecutive losses)
  - First Blood: +$200. Clutch (last alive, win round): +$500
  - Spike plant/defuse: +$300 to the player who did it
  - Max cash cap: $9000
- [x] **7a.3** Create `src/ui/BuyMenu.js`
  - Shown during freeze time, press `B` to open
  - Grid layout: Pistols | SMGs | Rifles | Snipers | Utility | Armor
  - Each item shows: name, cost, stats preview. Items you can't afford are greyed out.
  - Quick-buy: number key shortcuts (e.g., B-4-1 = buy V-44 Sabre)
  - Show team economy summary: "Your team can full buy" / "Eco recommended"
- [x] **7a.4** Create `src/game/MatchManager.js`
  - Manages game mode rules:
    - **Competitive**: teams, rounds, economy, spike
    - **Deathmatch**: FFA, no economy, instant respawn, 10-min timer
    - **Gun Game**: start with Bolt-88, each kill downgrades weapon, knife kill = win
  - Handles mode selection from ModeSelect.js

---

## Phase 7b: Feedback & Juice System
- [x] **7b.1** Create `src/game/FeedbackSystem.js`
  - Register on every hit/kill event. Determine feedback level:
  - **Body shot**: white hit marker (×), soft "thwack" SFX, `+damage` number
  - **Headshot**: red hit marker + skull, glass snap SFX, "HEADSHOT" text, 1-frame white flash
  - **Headshot kill**: gold marker, combined SFX, "HEADSHOT KILL" gold text, screen shake
  - **Knife kill**: "HUMILIATION" text, melee slash SFX
  - **Wallbang**: blue hit marker, muffled SFX, "WALLBANG" label
- [x] **7b.2** Implement multi-kill tracker
  - Track kills within 3-second windows. Announce:
  - 2: "DOUBLE KILL" | 3: "TRIPLE KILL" | 4: "QUAD KILL" | 5: "RAMPAGE" | full team: "ACE"
  - Each escalation gets louder audio + bigger visual
- [x] **7b.3** Implement movement reward labels
  - Slide Kill, Airshot, No Scope, Blind Kill (through smoke), 360° Kill
  - Track and display in kill feed with special label
  - B-hop chain: display combo counter ("×3 PERFECT CHAIN"), speed lines at ×5+, "SPEED DEMON" at ×10+
- [x] **7b.4** Create `src/game/Ragdoll.js`
  - On player death: replace model with ragdoll (Rapier rigid bodies on limbs)
  - Apply force in direction of killing shot. Shotgun = exaggerated launch.
  - Bodies persist until round end
- [x] **7b.5** Implement camera effects
  - Low health (<20hp): heartbeat SFX + screen pulse + desaturation
  - Killed: slow-mo camera pull-back (0.5s), zoom on killer
  - Final kill of match: instant slow-mo replay (2s)
  - Spike planted: heartbeat tick sound, intensifies near detonation
- [x] **7b.6** Implement end-of-match awards
  - Calculate from match stats: MVP, Sharpshooter (headshot %), Speed Demon (avg velocity), Anchor (most survives), Humiliator (knife kills), Chain Master (best B-hop chain), Eco Warrior (kills on eco rounds)
  - Display as award cards on end-of-match scoreboard

---

## Phase 7c: Bot AI (Solo Mode)
- [x] **7.1** Create `src/entities/Bot.js`
  - Simple state machine: `PATROL` → `CHASE` → `ATTACK` → `PATROL`
  - Load `SciFi.gltf` or `Soldier.gltf` as the bot's visible model
  - Movement: walk between random waypoints (PATROL), run toward player when in line-of-sight (CHASE)
  - Attack: fire at player with randomized accuracy (hit chance ~30-50% for fair gameplay)
  - Health: 100hp, respawns 5 seconds after death
- [x] **7.2** Implement bot spawning
  - Spawn 3-5 bots at match start
  - Assign random archetypes for visual variety (use different player models)
- [x] **7.3** Implement bot navigation
  - Simple raycasting-based navigation (no navmesh needed for Phase 1)
  - Bots walk toward waypoints, stop when they hit a wall, pick new waypoint

---

## Phase 8: Networking (Multiplayer)
- [ ] **8.1** Create `src/net/NetMessages.js`
  - Define message type constants: `CREATE_ROOM`, `JOIN_ROOM`, `PLAYER_STATE`, `PLAYER_SHOOT`, `PLAYER_HIT`, `PLAYER_DIED`, `START_MATCH`, `LEAVE_ROOM`, etc.
  - Helper functions: `encode(type, data)` → JSON string, `decode(raw)` → `{ type, data }`
- [ ] **8.2** Create `src/net/NetworkManager.js`
  - Singleton WebSocket client
  - Methods: `connect(serverUrl)`, `disconnect()`, `send(type, data)`
  - Event emitter: `on('message', handler)`, `on('disconnect', handler)`
  - Auto-reconnect logic with exponential backoff (3 attempts)
- [ ] **8.3** Create `src/net/RoomManager.js` (client-side)
  - `createRoom(name, maxPlayers)` → sends `CREATE_ROOM`, waits for `ROOM_CREATED` with room code
  - `joinRoom(code, playerName)` → sends `JOIN_ROOM`, waits for confirmation
  - `startMatch()` → host only, sends `START_MATCH`
  - Track room state: connected players list, isHost flag
- [ ] **8.4** Create `src/entities/RemotePlayer.js`
  - Renders a third-person player model (loaded from `assets/glTF/player-models/`)
  - Update position/rotation from network state snapshots
  - Interpolation: smooth between last two received positions (lerp over network tick interval)
- [ ] **8.5** Create `src/net/Interpolation.js`
  - Buffer of last N state snapshots per remote player
  - Interpolate between `t-1` and `t` snapshots at render time
  - Handle packet loss: if no update in 200ms, extrapolate using last known velocity
- [ ] **8.6** Integrate networking into game loop
  - **Solo mode**: no network, bots only (existing flow)
  - **Multiplayer mode**: connect to server → create/join room → lobby → match
  - Local player sends `PLAYER_STATE` at 20Hz (every 3 frames at 60fps)
  - On receiving `PLAYER_STATE` from server → update corresponding `RemotePlayer`
  - On `PLAYER_SHOOT` → play weapon fire SFX + visual tracer on remote player
  - On `PLAYER_HIT` / `PLAYER_DIED` → update HUD kill feed

## Phase 9: HUD (Heads-Up Display)
- [x] **9.1** Create `src/ui/HUD.js` — renders as HTML/CSS overlay on `#ui-root`
  - **Crosshair**: SVG-based, centered, changes color on enemy hover
  - **Health bar**: Bottom-left, segmented bar (red when <30)
  - **Ammo counter**: Bottom-right, `current / max` with reload indicator
  - [ ] **Speed-o-meter**: Top-right, shows velocity in units/sec (glows when B-hop chain is active)
  - [ ] **B-hop chain counter**: Center-top, shows combo count (e.g., "×3 PERFECT"), fades after 2s
  - **Kill feed**: Top-right, scrolling list of recent kills (`You → Bot_3 [V-44 Sabre]`)
- [x] **9.2** Implement damage indicators
  - Red vignette flash when taking damage
  - [ ] Directional damage markers (red arrows pointing toward damage source)
- [x] **9.3** Implement kill notification
  - Big center-screen text on kill: `+100` with the weapon icon
  - Headshot: special "HEADSHOT" text + glass-snap sound

---

## Phase 10: UI Screens
- [x] **10.1** Create `src/ui/LoadingScreen.js`
  - Full-screen dark background
  - Centered V-SHIFT logo (text-based, stylized with CSS)
  - Progress bar + percentage text
  - Tip text that cycles (e.g., *"B-hop within 3 frames for a Perfect Link"*)
- [x] **10.1b** Create `src/ui/NameSelect.js`
  - Shown on first boot (no callsign in localStorage)
  - Input field: "Enter your callsign" (3-16 chars, alphanumeric + underscores)
  - Real-time availability check via `GET /api/name/check/:name`
  - On confirm: register via `POST /api/name/register`, save to localStorage
  - Skip on subsequent visits (name already stored)
- [x] **10.2** Create `src/ui/MainMenu.js`
  - Full-screen with animated 3D background (slowly rotating arena in the Three.js scene)
  - V-SHIFT title with glow/pulse animation
  - Buttons: **PLAY**, **SETTINGS**, **LEADERBOARD**, **CREDITS**
  - Button hover effects (scale + glow)
- [x] **10.3** Create `src/ui/ModeSelect.js`
  - Three big cards: **SOLO** (vs Bots) / **CREATE ROOM** / **JOIN ROOM**
  - Solo: immediately transitions to Class Select
  - Create Room: shows room name input + max players dropdown → creates room → shows room code → transitions to Lobby
  - Join Room: shows room code input (4 chars) → joins → transitions to Lobby
- [x] **10.4** Create `src/ui/Lobby.js`
  - Shows room code prominently ("Share this code: AXRF")
  - List of connected players with their chosen archetype
  - Host sees a **START MATCH** button (enabled when ≥2 players)
  - Non-host sees "Waiting for host to start..."
- [x] **10.5** Create `src/ui/ClassSelect.js`
  - Three archetype cards side-by-side (Kinetic / Static / Ghost)
  - Each card shows: name, icon, description, stat modifiers
  - Below: weapon loadout selector (4 weapon slots, click to pick)
  - "DEPLOY" button at bottom
- [x] **10.6** Create `src/ui/Settings.js`
  - Accessible from Main Menu AND Pause Menu
  - **Controls** (sensitivity slider 0.1–5.0, invert Y toggle), **Video** (FOV slider 60–120), **Audio** (master/SFX/music volume sliders), **Keybinds** (click to rebind), **Network** (player name input)
  - Save to `localStorage` on change, load on boot
- [x] **10.7** Create `src/ui/Scoreboard.js`
  - In-match: press Tab to see table of all players (you + bots/remote players): Name, Kills, Deaths, Score
  - End-of-match: full-screen overlay with final stats, "Submit Score" button
- [x] **10.8** Create `src/ui/Leaderboard.js`
  - Fetches top 100 from `GET /api/leaderboard`
  - Table: Rank, Name, Score, K/D, Archetype, Date
  - Highlight current player's entry (matched by fingerprint)
- [x] **10.9** Create Pause Menu
  - Triggered by Escape key (releases pointer lock)
  - Options: Resume, Settings, Quit to Main Menu
  - Dark semi-transparent overlay

---

## Phase 11: Audio System
- [x] **11.1** Create `src/core/AudioManager.js`
  - Singleton wrapper around `AudioContext`
  - Methods: `playSound(name)`, `setVolume(category, value)`, `playMusic(name)`
  - Categories: `master`, `sfx`, `music`
  - Respect user's volume settings from localStorage
- [ ] **11.2** Synthesize weapon SFX using Web Audio API
  - [x] **Assault Rifle**: Short burst of noise + low-pass filter + quick decay
  - [x] **Sniper**: Low boom + high crack, longer tail
  - [x] **SMG**: Very short, clicky burst (higher pitch than AR)
  - [x] **Shotgun**: Wide noise burst + delay reverb
  - Store synthesis functions in `src/audio/WeaponSFX.js`
- [x] **11.3** Synthesize movement SFX
  - **B-hop success**: Quick ascending "whoosh" (frequency sweep 200→800Hz, 100ms)
  - **Cinch Slide**: Low rumble (50Hz noise, sustained while sliding)
  - **Footsteps**: Alternating soft clicks at walk pace
  - **Jump**: Short "hup" burst
- [x] **11.4** Synthesize UI & feedback SFX
  - **Headshot "glass snap"**: High-frequency burst (3kHz+) with fast decay
  - **Kill confirm**: Satisfying "ding" (800Hz sine, 200ms)
  - **Button hover**: Soft tick
  - **Button click**: Short snap
  - **Damage taken**: Low thud
- [ ] **11.5** Add ambient audio
  - Background hum/drone: Low-frequency oscillator (subtle, loops)
  - Optional: source a synthwave menu track from a free music library

---

## Phase 12: Backend Server
- [ ] **12.1** Initialize server project
  - `mkdir server && cd server && npm init -y`
  - Install: `express`, `ws`, `better-sqlite3`, `express-rate-limit`, `cors`, `helmet`, `uuid`
- [ ] **12.2** Create `server/index.js`
  - Express app with `helmet`, `cors`, `express.json()`
  - Create HTTP server, attach `ws.WebSocketServer` to it
  - Mount REST routes and WebSocket handler, start on `PORT` env var (default 3000)
- [ ] **12.3** Create `server/db.js`
  - Init SQLite database at `./data/vshift.db`
  - Create `scores` table (schema from implementation plan)
  - Export helpers: `insertScore(data)`, `getTopScores(limit)`, `getPlayerScores(fingerprint)`
- [ ] **12.4** Create `server/GameRoom.js`
  - Class: `GameRoom { code, hostWs, players: Map, state: 'lobby'|'playing'|'ended', maxPlayers, createdAt }`
  - Methods: `addPlayer(ws, name)`, `removePlayer(ws)`, `broadcast(message, excludeWs?)`, `startMatch()`, `endMatch()`
  - Auto-close if empty for 60 seconds
- [ ] **12.5** Create `server/RoomManager.js`
  - Manages all active GameRoom instances in a Map
  - `createRoom(hostWs, name, maxPlayers)` → generates 4-char uppercase code, returns room
  - `joinRoom(code, ws, playerName)` → adds player to room
  - `removePlayer(ws)` → finds player's room, removes them, closes room if empty
  - `getPublicRooms()` → returns list of joinable rooms (not full, in lobby state)
  - Limit: max 20 rooms, max 8 players/room
- [ ] **12.6** Create `server/wsHandler.js`
  - On WebSocket `connection`: store ws ref
  - On `message`: parse JSON, route by type:
    - `CREATE_ROOM` → RoomManager.createRoom → send `ROOM_CREATED` back
    - `JOIN_ROOM` → RoomManager.joinRoom → broadcast `PLAYER_JOINED` to room
    - `PLAYER_STATE` / `PLAYER_SHOOT` / `PLAYER_HIT` / `PLAYER_DIED` → broadcast to all other players in room
    - `START_MATCH` → only if sender is host → broadcast `MATCH_STARTED`
    - `LEAVE_ROOM` → RoomManager.removePlayer
  - On `close`: RoomManager.removePlayer, broadcast `PLAYER_LEFT`
- [ ] **12.7** Create `server/routes/leaderboard.js`
  - `GET /api/leaderboard` → return top 100 scores
  - `POST /api/leaderboard` → validate body, insert into DB
  - `GET /api/leaderboard/:fingerprint` → return that player's scores
- [ ] **12.8** Create `server/routes/rooms.js`
  - `GET /api/rooms` → return list of public rooms (code, name, playerCount, maxPlayers)
- [ ] **12.8b** Create `server/routes/names.js`
  - `GET /api/name/check/:name` → return `{ available: true/false }`
  - `POST /api/name/register` → body `{ fingerprint, callsign }` → insert into `players` table, return success
  - Validate: 3-16 chars, alphanumeric + underscores, case-insensitive uniqueness
- [ ] **12.9** Create `server/routes/health.js`
  - `GET /api/health` → return `{ status: 'ok', rooms: activeCount, timestamp: Date.now() }`
- [ ] **12.10** Create `server/middleware/rateLimit.js`
  - Global: 60 req/min per IP
  - Score submission: 10 req/hour per fingerprint
- [ ] **12.11** Create `server/middleware/validate.js`
  - Validate score submissions: name (3-20 chars, alphanumeric), kills/deaths >= 0, archetype in allowed list, duration 60-900s
- [ ] **12.12** Create `server/Dockerfile`
  - Node 20 alpine, copy files, `npm ci --production`, expose port, `CMD ["node", "index.js"]`
- [ ] **12.13** Create `server/fly.toml`
  - App name, region, internal port, auto-stop, health check path
- [ ] **12.14** Test locally: start server, test REST with curl, test WebSocket with `wscat` (create room, join room, relay messages)

---

## Phase 13: Frontend ↔ Backend Integration
- [ ] **13.1** Create `src/utils/Fingerprint.js`
  - On boot: generate fingerprint using `@fingerprintjs/fingerprintjs`
  - Cache the visitorId in memory
- [ ] **13.2** Create `src/utils/API.js`
  - `submitScore(data)` → POST to `/api/leaderboard` with fingerprint
  - `getLeaderboard()` → GET `/api/leaderboard`
  - `getMyScores()` → GET `/api/leaderboard/:fingerprint`
  - `getRooms()` → GET `/api/rooms`
  - Handle errors gracefully (show toast on failure, don't crash game)
- [ ] **13.3** Wire up Leaderboard UI to API
- [ ] **13.4** Wire up end-of-match Scoreboard to submit score
- [ ] **13.5** Wire up Mode Select → NetworkManager → RoomManager → Lobby flow
- [ ] **13.6** Test full multiplayer flow in two browser tabs: create room → join → lobby → start → play → scoreboard

---

## Phase 14: Polish & Juice
- [ ] **14.1** Add weapon bob/sway animation (weapon model moves slightly when walking/looking)
- [ ] **14.2** Add screen shake on shotgun fire
- [ ] **14.3** Add bullet tracer visuals (thin line from gun to hit point, fades quickly)
- [ ] **14.4** Add muzzle flash (point light + sprite at gun barrel, 1 frame)
- [ ] **14.5** Add kill streak announcements ("Double Kill", "Triple Kill")
- [ ] **14.6** Add hit markers (small X on crosshair when hitting an enemy)
- [ ] **14.7** Smooth camera transitions between game states (menu → gameplay)
- [ ] **14.8** FPS counter / debug overlay (toggle with F3)
- [ ] **14.9** Performance optimization pass: frustum culling, LOD for distant objects

---

## Phase 15: Deployment
- [ ] **15.1** Deploy backend to Fly.io: `fly launch` then `fly deploy` from `server/` directory
- [ ] **15.2** Update `src/utils/API.js` and `NetworkManager.js` to point to production server URL
- [ ] **15.3** Build frontend: `npm run build` → static files in `dist/`
- [ ] **15.4** Deploy frontend to Vercel/Netlify/GH Pages
- [ ] **15.5** End-to-end test: solo match + multiplayer match in production, submit scores, verify leaderboard
- [ ] **15.6** Test on Chrome, Firefox, Edge — verify WebGL, WASM, WebSocket, Pointer Lock

---

> **Total tasks: ~115** | Estimated time: 8-12 weeks for a solo developer
