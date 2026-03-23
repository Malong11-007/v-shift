# GAME DESIGN DOCUMENT: V-SHIFT

## 1. PROJECT OVERVIEW
* **Title:** V-SHIFT
* **Genre:** High-Velocity Tactical First-Person Shooter (FPS)
* **Platform:** Web Browser (Desktop / Mouse & Keyboard required)
* **Target Audience:** Competitive FPS players, movement-shooter enthusiasts (e.g., Titanfall, Apex, CS:GO surfers), and players with low-end hardware.
* **Elevator Pitch:** A browser-native, instantly accessible tactical FPS where movement is the ultimate skill gap. No downloads, no ability bloat—just pure mechanical mastery, B-hops, and frame-perfect gunplay.

## 2. CORE GAMEPLAY LOOP
1. **Spawn:** Player spawns in the arena with full access to the arsenal.
2. **Accelerate:** Player utilizes map geometry, B-hops, and slides to build kinetic momentum.
3. **Engage:** Player engages in high-speed, low-time-to-kill (TTK) gunfights.
4. **Master:** Player learns the precise recoil patterns and map flow to optimize their routes and reaction times.

## 3. MECHANICS & KINETIC ENGINE
The game’s core identity is "Mechanical Purity." The physics engine must prioritize responsiveness over realism.

### 3.1 Movement
* **The "Perfect Link" B-Hop:** If a jump is triggered within a tight 3-frame window of landing, the player bypasses ground friction, preserving and slightly multiplying their velocity.
* **Cinch Sliding:** Initiated by crouching while sprinting. Sliding downhill drastically reduces the friction coefficient, converting gravity into forward momentum.
* **Air-Strafing:** Smooth aerial directional control that rewards tracking the mouse with the corresponding strafe key (A/D).

### 3.2 Gunplay (Zero-RNG)
Weapons have learnable, fixed recoil patterns to reward muscle memory.
* **V-44 Sabre (Assault Rifle):** Consistent, midrange workhorse. "7" shape recoil.
* **Bolt-88 (Sniper):** High-risk, high-reward. Instant center-point accuracy.
* **Cinch-9 (SMG):** High fire rate, high vertical kick. Designed for close-quarters slide-bys.
* **Breach-12 (Shotgun):** Fixed pellet spread. Maximum kinetic impact at point-blank.

### 3.3 Neural Archetypes (Lightweight Classes)
Subtle physics/utility tweaks rather than "magic" abilities.
* **The Kinetic:** +2 frames to the B-hop window. (Beginner friendly).
* **The Static:** -50% visual flinch when taking damage. (Anchor/Sniper).
* **The Ghost:** 100% silent slides. (Flanker).

## 4. ART & AUDIO DIRECTION
* **Visual Style:** "Vector-Station." Clean, high-contrast, untextured geometry (think *Superhot* meets *Mirror's Edge*). This ensures maximum visibility and keeps rendering costs ultra-low for the browser.
* **Asset Format:** 100% `.glb` files (glTF Binary) exported from Blender. 
* **Audio:** Snappy and punchy. Distinct audio cues for a successful B-hop, headshots ("glass snap"), and sliding. 

## 5. TECHNICAL ARCHITECTURE
The tech stack is optimized for rapid iteration, zero hosting costs for the frontend, and scale-to-zero backend costs.

### 5.1 Frontend (The Client)
* **Hosting:** GitHub Pages (100% Free, static hosting).
* **Game Engine:** Babylon.js (or Three.js + Rapier.js). Chosen for its native JavaScript API and high-performance WebGL/WebGPU rendering.
* **Physics:** Havok Physics (via Babylon.js WASM integration) for deterministic, high-tick-rate movement.
* **Input Handling:** Custom raw-mouse-input listeners to emulate sub-tick responsiveness, bypassing standard browser input lag.

### 5.2 Backend (The Server)
* **Hosting:** Fly.io (Pay-as-you-go, scales to zero when idle).
* **Networking Protocol:** WebRTC for Peer-to-Peer (P2P) connections (lowest latency), with WebSockets used strictly for the initial player handshake.
* **Signaling Server:** A lightweight Node.js server hosted on Fly.io to connect players instantly via custom room URLs (e.g., `vshift.io/room/vector`).
