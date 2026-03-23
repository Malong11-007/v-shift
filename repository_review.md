# Repository Review: V-SHIFT

## 1) Snapshot

The repository has a solid base architecture for a prototype FPS:
- clear folder structure
- modular game systems
- deterministic round/match managers
- working unit/integration tests via Vitest

The code is readable and feature-oriented, but there are gameplay pacing and validation gaps that make the game *feel* less alive than intended.

## 2) Code & Architecture Review

### Strengths
- **Good separation of concerns**  
  Core (`src/core`), gameplay (`src/game`), entities (`src/entities`), and world (`src/world`) are clearly split.
- **Practical finite-state flow**  
  `GameState` + `RoundManager` provide a controllable game loop model.
- **Usable test harness already exists**  
  Existing tests assert behavior in economy/round/match/physics systems.
- **Prototype speed**  
  Vanilla + Vite + Three.js keeps iteration fast.

### Main Technical Risks
- **Global coupling (`window.*`)**  
  Multiple modules depend on global singleton state, increasing hidden dependencies and making regressions easier.
- **Gameplay logic mixed with rendering concerns**  
  Entity update loops currently own too many responsibilities.
- **Incomplete backend-client integration**  
  Multiplayer/server pieces exist but are not a complete production flow yet.

## 3) Tests Review (Are tests useless?)

Short answer: **No, they are not useless**, but they are **insufficient for gameplay confidence**.

### What’s currently good
- Tests validate important manager logic (economy, round transitions, match setup).
- Integration tests cover player/weapon interactions at a basic level.

### What’s missing
- Bot behavior tests (combat timing, AI gating, fairness)
- Spawn safety / early-match pacing tests
- More true end-to-end scenarios

### What was improved in this change
- Added focused bot tests to validate:
  - bots do not run combat AI during freeze phase
  - bots respect an initial spawn-protection shooting delay

## 4) Gameplay Flow Review (Why game feels dead / unfair)

Your feedback is valid:
- immediate pressure from bots feels unfair
- little breathing room when entering a round
- flow lacks readable escalation (calm → tension → combat)

### Fix implemented now (minimal but impactful)
- Bots now check round state and skip combat AI outside `LIVE`.
- Bots have a short spawn protection delay before they can shoot.

This creates a cleaner opening tempo and avoids instant punishment.

## 5) Detailed Plan to Improve the Game Dramatically

Below is a practical staged plan to make the game significantly better while protecting scope.

## Phase A — Core Feel (high impact, low risk)
- [ ] Add explicit player intro flow: 3-second “ready/go” pacing into `LIVE`
- [ ] Add encounter telegraphing: bot alert cue before first volley
- [ ] Improve spawn safety scoring (distance + LOS + recent danger heatmap)
- [ ] Add dynamic bot aggression ramp in first 30–45 seconds

## Phase B — Combat Satisfaction
- [ ] Add hit feedback stack (audio + marker + directional damage indicator)
- [ ] Add clear kill confirmation and death recap
- [ ] Improve weapon identity via recoil/audio cadence differences
- [ ] Tune bot aim by distance/time-in-fight instead of fixed hit chance only

## Phase C — AI Depth & Flow
- [ ] Expand bot state machine (seek cover, retreat, regroup, push)
- [ ] Add objective-driven behavior instead of pure player chase
- [ ] Add role archetypes per bot (entry, anchor, flanker)
- [ ] Introduce short “decision cooldowns” to avoid robotic twitching

## Phase D — Test Quality Upgrade
- [ ] Add bot behavior test suite (state transitions + timing gates)
- [ ] Add flow tests for round lifecycle and spawn safety invariants
- [ ] Add deterministic simulation tests (seeded randomness)
- [ ] Add Playwright smoke for menu → match → round complete path

## Phase E — Product Readiness
- [ ] Create balancing config files (no hardcoded values in entity classes)
- [ ] Add telemetry events (time-to-first-shot, survival time, bot TTK)
- [ ] Add dev tuning panel for live balance iteration
- [ ] Define quality gates for PRs (must pass targeted flow checks)

## 6) Priority Order Recommendation

1. **Gameplay fairness first** (spawn safety + early pacing)  
2. **Combat readability second** (feedback and clarity)  
3. **AI depth third** (smarter opponents)  
4. **Test coverage fourth** (protect gains and prevent regressions)  
5. **Multiplayer polish next** once single-player loop feels consistently good

## 7) Immediate Next Steps (short-term backlog)

- [ ] Expand current bot tests to cover respawn and post-round behavior
- [ ] Add a short pre-live countdown UI
- [ ] Implement one bot warning cue before first engagement
- [ ] Run a small tuning pass on bot fire rate + hit chance progression

---

This review is intentionally action-focused: preserve your existing foundation, improve fairness/readability first, and then deepen AI and testing in layers.
