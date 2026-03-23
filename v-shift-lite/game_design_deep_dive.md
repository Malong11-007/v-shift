# V-SHIFT: Deep Game Design — Economy, Rounds, & Juice

---

## 1. Game Structure (CS-Style Rounds)

V-SHIFT follows a **round-based competitive format**. This is what makes it replayable and strategic, not just a deathmatch.

### Match Format

| Setting | Value | CS2 Reference |
|---|---|---|
| **Teams** | 2 teams (Attackers vs Defenders) | ✅ Same |
| **Players per team** | 2–4 (scales to lobby size) | CS2 = 5v5 |
| **Total rounds** | 13 (first to 7 wins) | CS2 = 24 rounds |
| **Half-time** | After round 6 — teams swap sides | ✅ Same |
| **Overtime** | If 6-6: 3 extra rounds (first to 8) | ✅ Similar |
| **Round timer** | 90 seconds | CS2 = 115s |
| **Freeze time (buy phase)** | 10 seconds | CS2 = 20s |
| **Round restart delay** | 5 seconds after round end | CS2 = 7s |

### Round Flow

```
┌─────────────┐
│  FREEZE TIME │  10s — Buy weapons, plan strategy. Players can't move beyond spawn.
│  (Buy Phase) │  Show buy menu, team chat enabled.
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  ROUND LIVE  │  90s — Fight! Objective: eliminate enemy team OR detonate/defuse the SPIKE.
└──────┬──────┘
       │
       ▼ (Round ends: team eliminated, spike detonates/defused, or timer expires)
┌─────────────┐
│  ROUND END   │  5s — Show round MVP, update economy, display kill summary.
└──────┬──────┘
       │
       ▼ (If round 6: swap sides + reset economy)
┌─────────────┐
│  NEXT ROUND  │  or MATCH END if a team hits 7 wins.
└─────────────┘
```

### Win Conditions (per round)

| Condition | Who Wins |
|---|---|
| All enemies eliminated | Surviving team |
| **Spike** planted and detonates | Attackers |
| **Spike** defused | Defenders |
| Timer runs out (no spike planted) | Defenders |

### The Spike (V-SHIFT's "Bomb")

- Called the **"SPIKE"** (fits the Vector-Station aesthetic)
- One attacker carries it — press `E` to plant (3.5s channel, interruptible)
- Once planted: 40-second fuse, visible countdown on HUD
- Defenders defuse by holding `E` on the spike (5s channel)
- Spike sites marked on HUD with holographic indicators

---

## 2. Economy System

This is what separates a "just respawn and shoot" game from a *strategic* game. Money forces decisions: save or eco? Full buy or force buy?

### Starting Cash & Earnings

| Event | Cash Earned |
|---|---|
| **Pistol round start** (rounds 1 & 7) | $800 |
| **Standard round start** | Keep previous balance |
| **Kill (any weapon)** | +$300 |
| **Kill (knife/melee)** | +$1500 |
| **Headshot kill bonus** | +$100 extra |
| **Round win** | +$3250 |
| **Round loss (1st consecutive)** | +$1400 |
| **Round loss (2nd consecutive)** | +$1900 |
| **Round loss (3rd consecutive)** | +$2400 |
| **Round loss (4th+ consecutive)** | +$2900 |
| **Spike plant (attacker)** | +$300 (to planter) |
| **Spike defuse (defender)** | +$300 (to defuser) |
| **Max cash cap** | $9000 |

### Buy Menu — Weapon Tiers

| Tier | Weapon | Cost | Notes |
|---|---|---|---|
| **Free** | Sidearm (Pistol) | $0 | Everyone spawns with this. Decent. |
| **Tier 1** | **Cinch-9** (SMG) | $1500 | High fire rate, good for eco rounds |
| **Tier 2** | **Breach-12** (Shotgun) | $1800 | High risk/reward, point-blank monster |
| **Tier 3** | **V-44 Sabre** (AR) | $2700 | The workhorse. Reliable at all ranges. |
| **Tier 4** | **Bolt-88** (Sniper) | $4750 | One-shot body kill, devastating but expensive |
| **Utility** | Flash Grenade | $200 | 2s white screen, line-of-sight only |
| **Utility** | Smoke Grenade | $300 | Blocks vision for 8s, circular area |
| **Utility** | Kinetic Grenade | $400 | Pushes players (and the thrower!) — unique to V-SHIFT |
| **Armor** | Light Armor | $400 | Reduces damage by 30% |
| **Armor** | Heavy Armor | $1000 | Reduces damage by 50%, reduces aimpunch |

### Economy Strategy Calls (like CS)

| Term | What It Means |
|---|---|
| **Full Buy** | Everyone can afford Tier 3+ weapon + armor + utility |
| **Force Buy** | Buy whatever you can afford even if not ideal |
| **Eco** | Save money — pistol only, sacrifice this round to full buy next |
| **Half Buy** | SMG + light armor, play for picks |
| **Anti-eco** | Your team is rich, enemies are poor — push aggressively |

---

## 3. Juice & Satisfying Feedback Systems

This is what makes players *feel* powerful. Every action needs a visceral, audible, visible reward.

### 3.1 Hit Feedback Hierarchy

Every hit should feel different based on severity. Layered feedback:

| Hit Type | Visual | Audio | HUD | Screen Effect |
|---|---|---|---|---|
| **Body shot** | White hit marker (×) | Soft "thwack" | `+22` damage number | Subtle crosshair kick |
| **Headshot** | Red hit marker + skull icon | Sharp "glass snap" crack | **"HEADSHOT"** text flash + `+100` | Screen flashes white 1 frame |
| **Kill** | Hit marker stays for 0.5s | Deep "thud" + kill jingle | Kill feed entry | None |
| **Headshot kill** | Gold hit marker + skull | Glass snap + kill jingle together | **"HEADSHOT KILL"** in gold | Quick screen shake + flash |
| **Knife kill** | Special knife icon marker | Melee slash SFX | **"HUMILIATION"** text | Intense screen shake |
| **Wallbang** (through cover) | Blue-tinted hit marker | Muffled thwack | **"WALLBANG"** label | None |

### 3.2 Multi-Kill Announcements

Timed kill combos (kills within 3 seconds of each other):

| Kills | Announcement | Audio | Visual |
|---|---|---|---|
| 2 | **"DOUBLE KILL"** | Deep bass drop + echo | Text scales up, gold color |
| 3 | **"TRIPLE KILL"** | Louder + reverb | Text + screen edge glow |
| 4 | **"QUAD KILL"** | Even louder + distortion | + camera zoom pulse |
| 5 | **"RAMPAGE"** | Bass + air horn + crowd roar | Full-screen gold flash |
| Whole team | **"ACE"** | Unique fanfare jingle | Special full-screen animation |

### 3.3 Movement Rewards

Your movement system IS the skill gap. Reward players for mastering it:

| Action | Feedback |
|---|---|
| **Perfect B-hop** (3-frame window) | "Whoosh" SFX + speed number turns green + trail particles behind player |
| **B-hop chain ×3+** | HUD counter: "×3 PERFECT CHAIN" with escalating glow |
| **B-hop chain ×5+** | Screen edges emit speed lines (manga-style) |
| **B-hop chain ×10+** | **"SPEED DEMON"** announcement, visible sonic boom VFX |
| **Cinch Slide kill** | **"SLIDE KILL"** label in kill feed |
| **Air-strafe kill** | **"AIRSHOT"** label |
| **No-scope sniper kill** | **"NO SCOPE"** in kill feed |
| **Through-smoke kill** | **"BLIND KILL"** label |
| **360° kill** (full rotation before killing) | **"360"** label, crowd gasp SFX |
| **Highest speed in match** | End-of-match **"SPEED DEMON"** award |

### 3.4 End-of-Round Micro-Rewards

After each round:

| Award | Criteria |
|---|---|
| **Round MVP** | Most kills or most impactful play (clutch, ace) |
| **First Blood** bonus | First kill of the round: +$200 extra |
| **Clutch** bonus | Last alive on team and wins the round: +$500 |

### 3.5 End-of-Match Awards (like CS2 scoreboard)

| Award | Criteria |
|---|---|
| **🏆 Match MVP** | Highest total score |
| **🎯 Sharpshooter** | Highest headshot % (min 5 kills) |
| **💨 Speed Demon** | Highest average velocity |
| **🛡️ Anchor** | Most rounds survived without dying |
| **🔪 Humiliator** | Most knife kills |
| **💀 Ace Machine** | Most aces |
| **🌪️ Chain Master** | Longest B-hop chain |
| **🧱 Eco Warrior** | Most kills while on eco round |

### 3.6 Camera & Screen Effects

| Trigger | Effect |
|---|---|
| Being shot | Red vignette + directional damage arrow |
| Low health (<20hp) | Heartbeat SFX + subtle screen pulse + desaturation |
| Getting killed | Slow-motion camera pull-back (0.5s), zoom on killer |
| Winning kill (match-ending) | Instant slow-motion replay of the final kill (2s) |
| Respawning | Quick zoom from overhead → first-person snap |
| Spike planted | Heartbeat tick sound starts, intensifies as timer runs down |
| 10s left on spike | Ticking sound gets frantic, HUD timer turns red |

### 3.7 Weapon-Specific "Feel"

Each weapon should handle completely differently:

| Weapon | Fire Feel | Unique Detail |
|---|---|---|
| **Sidearm (Pistol)** | Quick, snappy, light recoil | Fast equip. Spam-clicking feels clicky and responsive. |
| **Cinch-9 (SMG)** | Buzzy, rattly, climbs fast | Feels like holding a jackhammer. Good "spray and pray" panic weapon. |
| **V-44 Sabre (AR)** | Punchy, deliberate, rhythmic | Each shot has weight. Satisfying "chunk chunk chunk" at controlled pace. |
| **Breach-12 (Shotgun)** | BOOM. Massive kick. | Camera rocks back. Enemy ragdolls on kill. Slow pump animation between shots. |
| **Bolt-88 (Sniper)** | Sharp crack + echo | Scope zoom. When you hit: loud metallic ping. Miss: silence (tension). |
| **Knife** | Fast slashes, weighty stab | Front slash: 50dmg. Backstab: 150dmg (instant kill). |

### 3.8 Ragdoll & Death Physics

When a player is killed:
- Body ragdolls with physics (Rapier rigid bodies on limbs)
- Direction of death force matches the killing shot's direction
- Shotgun kills launch the body backwards (exaggerated)
- Headshot kills: faster ragdoll, body crumples
- Bodies persist until end of round (environmental storytelling)

---

## 4. Game Modes

### Competitive (Default)
- Round-based, economy, spike plant/defuse
- 13 rounds, half-time swap
- Ranked (leaderboard tracked)

### Deathmatch (Casual)
- Free-for-all, no teams, no economy
- 10-minute timer
- Instant respawn
- All weapons available (random spawn weapon or choose)
- Good for warming up and practicing aim

### Gun Game
- Start with Bolt-88 (sniper), each kill downgrades to the next weapon
- Final weapon: Knife — get a knife kill to win
- Progression: Bolt-88 → V-44 Sabre → Cinch-9 → Breach-12 → Pistol → Knife
- Fast-paced, chaotic, fun

---

## 5. Updated Weapon Stats (Detailed)

| Weapon | Damage (Body/Head) | Fire Rate | Mag | Reload | Move Speed | Cost | Kill Reward |
|---|---|---|---|---|---|---|---|
| **Sidearm** | 28 / 70 | Semi-auto | 12 | 1.5s | 100% | Free | $300 |
| **Cinch-9** | 15 / 38 | 900 RPM | 35 | 1.8s | 95% | $1500 | $600 |
| **Breach-12** | 12×8 / 18×8 | 60 RPM | 6 | 0.5s/shell | 85% | $1800 | $900 |
| **V-44 Sabre** | 22 / 88 | 600 RPM | 30 | 2.2s | 90% | $2700 | $300 |
| **Bolt-88** | 100 / 150 | Bolt-action | 5 | 3.5s | 80% | $4750 | $100 |
| **Knife** | 50 (stab) / 150 (back) | Melee | ∞ | — | 100% | Free | $1500 |

> [!TIP]
> **Kill reward is inversely proportional to weapon cost/power.** The SMG gives $600 per kill because it's weak — rewarding eco plays. The Bolt-88 gives only $100 because it's dominant. This is directly from CS economics and prevents snowballing.

---

## 6. Utility / Grenades (New Addition)

Three utility items to add tactical depth without ability bloat:

### Flash Grenade ($200)
- Thrown projectile, bounces off walls
- On detonation: players looking at it within 15m get white-screened for 2s
- Players facing away: 0.5s flash
- SFX: loud "bang" + high-pitch ring for flashed players
- **Carry limit**: 2

### Smoke Grenade ($300)
- Thrown, blooms into opaque sphere (~5m radius) after 1s
- Lasts 8 seconds, then fades over 2s
- Blocks all vision, players inside see only fog
- SFX: hissing gas sound
- **Carry limit**: 1

### Kinetic Grenade ($400) — V-SHIFT UNIQUE
- Explodes with a physics impulse, not damage
- Pushes all players (and the thrower!) within 8m radius
- Force scales with proximity: point-blank = massive launch
- No damage, but falling off the map from the push = death
- Creative uses: boost yourself to unreachable spots, push enemies off ledges, interrupt a spike plant
- SFX: deep "WHOMP" bass hit
- **Carry limit**: 1

---

## Impact on Implementation

> [!IMPORTANT]
> These additions require significant new systems. Here's what changes in the task list:
> 
> **New systems needed:**
> - Round state machine (freeze → live → end → next)
> - Economy manager (cash tracking, buy menu)
> - Buy menu UI
> - Spike plant/defuse mechanic
> - Grenade system (3 types)
> - Ragdoll physics on death
> - Multi-kill tracker
> - End-of-match awards calculator
> - Multiple game modes (competitive, deathmatch, gun game)
> - Sidearm + Knife (2 new weapons)
