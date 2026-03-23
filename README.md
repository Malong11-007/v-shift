# V-SHIFT

V-SHIFT is a browser-native tactical FPS prototype built with **Three.js** and **Rapier.js**.  
It includes:
- High-mobility FPS movement
- Bot enemies
- Round/match systems
- Frontend-first architecture with a Node/WebSocket server scaffold

## Tech Stack

- Frontend: Vite, Vanilla JS, Three.js, Rapier (WASM)
- Testing: Vitest, Playwright
- Backend scaffold: Node.js, Express, ws, sql.js

## Project Structure

```text
src/
  core/        # Engine, game state, input, audio
  entities/    # Player, Bot, weapons integration
  physics/     # Rapier world, movement, raycasts
  game/        # Round/match/economy/feedback systems
  world/       # Arena, skybox, decorations
  ui/          # Menu, HUD, mode/class/lobby screens
server/        # Express + websocket server scaffold
e2e/           # End-to-end tests
```

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Install

```bash
npm ci
```

### Run Development Client

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Run Tests

```bash
npm run test -- --run
```

## Current Gameplay Notes

- Bots now respect round flow and do not run combat AI during `FREEZE_TIME`.
- Bots also have a short spawn protection shooting delay to reduce immediate aggression when entering live gameplay.

## Existing Design/Planning Docs

- `implementation_plan.md`
- `game_design_deep_dive.md`
- `task.md`
- `idea.md`
- `bug.md`
