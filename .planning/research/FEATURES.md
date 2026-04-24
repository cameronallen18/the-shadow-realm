# Feature Research: Super Metroid Sprite Assets (v1.2 Pixel Perfect)

**Domain:** Sprite rip sourcing — Super Metroid (SNES, 1994, Nintendo)
**Researched:** 2026-04-23
**Confidence:** MEDIUM — primary download hub (The Spriters Resource) blocks automated fetch via CloudFlare 403; all URLs verified as real through search result citations and community cross-references. Frame counts sourced from ROM hacking documentation and speedrunning community sources where available.

---

## Sprite Rip Sources

### Primary: The Spriters Resource

**Hub page:** https://www.spriters-resource.com/snes/smetroid/

The canonical community sprite rip archive for Super Metroid. All sheets are downloadable as PNG after free registration. This is the de-facto standard cited by every ROM hacking and fan project community for SNES sprite extraction. The site is CloudFlare-protected and returns 403 to automated fetches — assets must be downloaded manually via browser.

| Asset | URL | What It Contains |
|-------|-----|-----------------|
| Samus Aran (complete re-rip, 2024/2025) | https://www.spriters-resource.com/snes/smetroid/asset/182270/ | Full Samus sprite sheet — all animation states in one PNG. Described by community as a "complete re-rip." |
| Background Tiles (older rip) | https://www.spriters-resource.com/snes/smetroid/asset/1718/ | Tileset tiles for level construction — all areas. Community noted in October 2024 that this may need a re-rip. |
| Backgrounds (scrolling BG layers) | https://www.spriters-resource.com/snes/smetroid/asset/65181/ | Parallax/scrolling background layer artwork. |
| Tile Sheets (comprehensive, named per area) | https://www.spriters-resource.com/snes/smetroid/sheet/144515/ | Named PNG files: `brinstar_gray.png`, `maridia.png`, `norfair_lower.png`, `norfair_upper.png`, plus Crateria, Wrecked Ship (powered/unpowered), Tourian, Crocomire, Draygon, Mother Brain (light/dark), and save room variants. Confirmed by search result commentary from the ROM hacking community. |
| Norfair (dedicated sheet) | https://www.spriters-resource.com/snes/smetroid/asset/159298/ | Norfair-specific asset, distinct from the combined tile sheet. |

**Confidence:** HIGH — URLs confirmed via multiple independent search result references and community citations across ROM hacking and randomizer projects.

### Secondary: Sprite Database

**URL:** https://spritedatabase.net/game/543

Smaller catalog hosting Super Metroid assets including Samus (Power Suit) and Space Colony background. Useful as a download fallback if Spriters Resource requires registration. Does not document frame counts or animation breakdowns. Assets labeled "for private/non-commercial use."

**Confidence:** MEDIUM — URL confirmed in search results; content inventory limited.

### Secondary: Background HQ

**URL:** https://bghq.com/bgs.php?c=31

Hosts rendered background-layer images from Super Metroid organized by area: Ceres, Crateria, Brinstar, Norfair, Wrecked Ship, Maridia, Ridley's Lair, Tourian. These are background layer renders useful for visual reference and understanding parallax layer appearance at runtime, not raw tile sheets. Fetched and confirmed area list.

**Confidence:** MEDIUM — content confirmed via successful fetch.

### Reference: TheAlmightyGuru Wiki

**URL:** https://thealmightyguru.com/Wiki/index.php?title=File:Super_Metroid_-_SNES_-_Sprite_Sheet_-_Samus.png

Hosts or references the classic Samus sprite sheet PNG. Cited across image mirror sites (SeekPNG, PNGFind, PNGaaa) at approximately 1125x600px. Good for visually verifying animation layout before downloading from Spriters Resource.

**Confidence:** MEDIUM — URL confirmed via multiple mirror citations; direct fetch returned 403.

### Reference: NES-SNES-Sprites.com

**URL:** http://www.nes-snes-sprites.com/SuperMetroidSamus.html

Hosts two Samus sprite sheet GIFs (SuperMetroidSheet1Goemar.gif, SuperMetroidSheet2Goemar.gif). GIF format requires palette-to-alpha conversion for canvas use. Connection state inconsistent during research.

**Confidence:** LOW — server unreliable; treat as backup reference only.

---

## Samus Animation Frame Sets

### Scope of Samus's Animation Library

Super Metroid contains approximately 100–150 distinct animation states for Samus per community ROM hacking tools (SPARTA — Samus Palette & Art App, referenced by multiple Metroid Construction community members). Samus is not stored as a single large sprite — she is a composite of 16x16 and 8x8 SNES hardware tiles assembled per-frame. Community sprite sheet rips reconstruct these into contiguous PNG strips.

### Standing / Idle

- **Frame count:** 1 static frame. Samus holds a still standing pose when the player is not moving.
- **Critical clarification:** Super Metroid has NO idle breathing animation. This is confirmed by Wikitroid ("Samus does not have any idle poses in most of the 2D Metroid games"). Idle breathing is a later-series feature introduced in Metroid Prime and Metroid Dread.
- **Implication for PROJECT.md:** The "idle/breathing animation" goal should be reinterpreted as the single standing frame, optionally supplemented by a subtle 2–3 frame bob authored in canvas code (not from ROM data).
- **Visual:** Full upright Varia Suit, arm cannon extended right, visor forward.
- **Sprite size:** Approximately 24–32px wide, 42–48px tall at SNES native resolution. The run cycle frames measure 35x43px; the standing frame is comparable in height.

**Confidence:** HIGH — Wikitroid and Spriters Resource community commentary both confirm no idle animation cycle.

### Running

- **Frame count:** 10 frames
- **Frame dimensions:** 35 × 43 px per frame (directly documented by the @desandro Tumblr post re-animating the original SNES assets)
- **Color depth:** 16 colors in SNES palette
- **Visual:** Full locomotion cycle with leg motion, arm cannon extended.
- **Relevance to Samus Run:** Low — Samus does not run in the current game. This animation strip exists on the sheet but is not needed for v1.2.

**Confidence:** HIGH — specific numbers directly cited from community source.

### Spin Jump (primary jump animation)

- **Frame count:** Approximately 4–8 frames forming a continuous rotation loop.
- **Visual:** Samus tumbles/rotates in the air in her full suit — NOT the morph ball, but a full-body spinning pose. The classic "spin jump" look that is Samus's signature jump animation.
- **Trigger:** Any jump while running triggers the spin jump. In most Super Metroid gameplay, this is the dominant jump animation.
- **Loop behavior:** Frames cycle continuously while Samus is airborne.
- **Implementation:** Draw the frame strip on a timer (80–120ms per frame recommended); cycle back to frame 0 after the last frame while airborne.

**Confidence:** MEDIUM — animation type well-documented in speedrunning sources; exact frame count not accessible from documentation available during this research session. ROM hacking community estimates 4–8 frames.

### Standard Jump (non-spinning)

- **Frame count:** Approximately 2–3 frames (launch lean, apex, fall lean).
- **Context:** Exists in the sprite data but is rarely seen in normal gameplay since running always triggers spin jump. Samus in a stationary jump shows this.
- **Relevance:** For the Samus Run game, where Samus launches from a standing position rather than a run, this may be the technically correct animation — but spin jump visually reads better and is more iconic.

**Confidence:** LOW — frame count inferred from ROM structure; not directly documented in accessible sources.

### Screw Attack

- **Frame count:** 0 unique frames — screw attack uses the IDENTICAL spin jump animation frames.
- **Visual differentiation:** Samus's armor flashes during the screw attack. Confirmed by Wikitroid: "Samus's armor flashes during a screw attack." The Pseudo Screw Attack technique (documented on the Super Metroid speedrunning wiki) causes "Samus to flash yellow" — confirming the flash is the only visual differentiator.
- **Implementation implication:** Render spin jump frames + a canvas overlay effect. No separate sprite data is required. Example implementation: cycle `ctx.globalAlpha = 0.5; ctx.fillStyle = "#ffff44"` rect over Samus bounding box at 8–10 fps while screw attack state is active.

**Confidence:** HIGH — flash-only differentiation confirmed by multiple independent sources (Wikitroid, MetroidPhysics, speedrunning wiki).

### Turnaround

- **Frame count:** 6 frames (directly cited in TASVideos Super Metroid game resources: "turnaround animation cycle lasting six frames")
- **Relevance to Samus Run:** None — Samus always faces right in the obstacle game.

**Confidence:** HIGH — specific number from TASVideos documentation.

---

## Level Environment Assets

### Norfair

**Available on Spriters Resource:**
- `norfair_upper.png` — confirmed in tile sheet asset 144515
- `norfair_lower.png` — confirmed in tile sheet asset 144515
- Dedicated Norfair asset: https://www.spriters-resource.com/snes/smetroid/asset/159298/

**Visual characteristics (sourced from Wikitroid, Omega Metroid walkthrough, community ROM hack documentation):**

| Element | Description |
|---------|-------------|
| Background | Deep purple-black cave walls ("noticeably purple cave walls") |
| Midground | Reddish-purple jagged rock formations |
| Rock detail | Glass bubble formations, organic dripping bubbles, metallic Chozo beams interspersed |
| Floor hazard | Fire-sea / lava pools — glowing orange-red against dark rock floor |
| Ceiling | Stalactite formations, bubble clusters dripping from above |
| Lower Norfair | "Purple rocks interlaced with artificial metallic beams and Koma statues" |
| Color dominant | Dark purple → reddish-purple rock → orange-red lava highlight |

**Tileset palette variants documented in community hacks:**
- Norfair (red) — vanilla brown-red, warm tones
- Norfair (cold) — cooler blue-purple variant
- Norfair (purple) — deeper purple, closer to dark backgrounds
- Norfair alt — from Ice Metal community hack
- Norfair + mechanical — mechanical elements mixed into the rock tileset

**Palette alignment with existing code:**

The existing `NORFAIR` color constants in `constants.ts` implement a close interpretation:
- `sky: "#0d0608"` — accurate to the near-black purple background
- `lavaGlow: "#3d1010"` — accurate to the dark lava floor
- `lavaHighlight: "#7a2020"` — accurate to the lava shimmer line
- `rock: "#2e1a1a"` — slightly more brown than the source's purple-dominant rock; authentic Norfair leans more toward `#3a1a2a` range

The existing environment code is a close approximation. Integrating real tile textures requires retexturing the obstacle columns and background walls without color-constant changes.

**Confidence:** HIGH — visual description from Wikitroid confirmed against community tileset documentation.

### Brinstar

**Available on Spriters Resource:**
- `brinstar_gray.png` — Upper/West Brinstar gray tiles (confirmed in tile sheet asset 144515)
- East Brinstar, Red Brinstar, and gray variants also listed in community hack tileset index

**Visual characteristics:**

| Element | Description |
|---------|-------------|
| Rock | Blue-gray cave walls (gray Brinstar) or orange-red rock (red/Kraid area) |
| Biological | Green lichen, plant growths, thorned vegetation |
| Accent | Orange glowing lanterns in red Brinstar sub-area |
| Background | Blue-gray dominant; cooler and more organic than Norfair |

**Fit with existing code:** POOR. The existing warm dark-red Norfair palette is visually incompatible with Brinstar's cool blue-gray. A full `NORFAIR` constant overhaul plus `drawEnvironment.ts` rewrite would be required. Brinstar's cool tones would align better with the CLAUDE.md site palette but require environment redesign.

**Confidence:** MEDIUM — confirmed from tile sheet listing and community hack descriptions.

### Maridia

**Available on Spriters Resource:**
- `maridia.png` — base Maridia tileset (confirmed in tile sheet asset 144515)
- West Maridia (rocky) and East Maridia (sandy) sub-areas exist as distinct visual themes

**Visual characteristics:**

| Element | Description |
|---------|-------------|
| Background | Underwater teal/blue-green cave environment |
| Rock | Green-tinted stone characteristic of Brinstar |
| Sandy areas | Yellow-tan quicksand sections, sandy floor |
| Flora | Tiny aquatic plants with blue stems and yellow flowers |
| Special | Glass tunnels with underwater light diffusion |

**Fit with existing code:** POOR. Sandy/aquatic colors have no relationship to the current warm dark Norfair implementation.

**Confidence:** MEDIUM — confirmed from Wikitroid Maridia article.

---

## Level Target Recommendation

**Recommended first and only target for v1.2: Norfair (Upper Norfair tileset)**

### Rationale

1. **Zero palette work required.** The `NORFAIR` constants in `constants.ts` already implement a matching interpretation of Norfair's dark cave aesthetic. No color constant changes needed — only swapping canvas shape fills with actual tile texture patterns.

2. **Two dedicated tile sheet files exist.** `norfair_upper.png` and `norfair_lower.png` are both available on Spriters Resource. Upper Norfair is the cleaner choice — less lava, more structured rock — which reads better at obstacle-game canvas density.

3. **Obstacle columns already read as Norfair rock.** The current `drawObstacleShape.ts` renders dark reddish-brown columns consistent with Norfair's color scheme. Retexturing these with `ctx.createPattern()` from the tile sheet is a contained change to one function.

4. **Background HQ confirms a Norfair background layer exists** for reference at https://bghq.com/bgs.php?c=31.

5. **Brinstar requires a palette overhaul.** The blue-gray cool tones of Brinstar would require touching every color constant and the full `drawEnvironment.ts` background rendering path. It is a viable future consideration, not a v1.2 target.

6. **Maridia has no visual relationship to existing implementation.** Sandy/aquatic environment would require redesigning the game aesthetic from the ground up.

---

## Canvas Implementation Notes

### Loading Sprites (no new npm packages)

```
const img = new Image();
img.src = '/assets/samus-sheet.png';  // served from /public/assets/
img.onload = () => { /* start game loop */ };
```

Use `ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, destW, destH)` for frame selection. All frame coordinates are hardcoded constants derived from measuring the downloaded sprite sheet.

### Spin Jump Frame Animation

Advance frame index on a timer. Recommended interval: 80–100ms per frame for the spin jump strip. While `state === 'jump'`, increment `frameIndex` each interval and wrap at `frameCount`. While `state === 'idle'`, hold the static standing frame (srcX/srcY fixed).

### Screw Attack Overlay

No separate sprite data needed. While `state === 'screwAttack'`:
1. Draw the current spin jump frame (same as jump state)
2. After drawing Samus, apply a flashing overlay:
   ```
   ctx.save();
   ctx.globalAlpha = Math.sin(Date.now() / 50) * 0.4 + 0.4; // pulsing
   ctx.fillStyle = '#ffee44';
   ctx.fillRect(samusX - w/2, samusY - h, w, h);
   ctx.restore();
   ```

### Tile Textures for Environment

Use `ctx.createPattern(tileImg, 'repeat')` with a cropped section of the Norfair tile sheet to fill obstacle columns and the background wall band. The SNES tile grid is 16x16px; identify a 2–4 tile "rock column" region from the sheet and use that region as the pattern source.

### Sprite Sheet Alpha

Community PNG rips from Spriters Resource typically have true alpha transparency (original SNES transparent color index converted to PNG alpha). Verify the downloaded PNG — if the background is magenta or a solid color, it must be converted to alpha before use. Preview in browser to confirm.

---

## Anti-Features for This Milestone

| Anti-Feature | Why Avoid |
|--------------|-----------|
| Running animation frames | Samus does not run in this game; 10 frames of locomotion data not needed |
| Brinstar environment | Requires full palette + environment redesign; out of scope for v1.2 |
| Maridia environment | Incompatible with existing warm dark palette; defer to future milestone |
| New npm animation library | Canvas 2D drawImage + timer covers all frame animation needs |
| ROM extraction tools | Not needed — community PNG rips from Spriters Resource are production-ready |

---

## Legal Context

Nintendo actively enforces copyright against fan projects using its IP. Known Super Metroid takedowns include AM2R (2016) and Metroid Prime 2D (2021). The Samus Run game occupies the same risk category as most Metroid fan work: non-commercial, personal portfolio, and likely tolerated unless it gains significant visibility.

Mitigating factors: it is a Flappy Bird–style obstacle game (not a Metroid game), it is not distributed as a downloadable ROM or standalone application, and it is not presented as a commercial product. The assets should be served as static files from the Vercel deployment without explicit download links.

This risk level is accepted by the project scope and is consistent with how similar fan projects operate in practice.

**Confidence:** MEDIUM — Nintendo's general IP stance is HIGH confidence; specific enforcement probability for a personal portfolio game is not quantifiable.

---

## Sources

- The Spriters Resource — Super Metroid hub: https://www.spriters-resource.com/snes/smetroid/
- Samus Aran sprite sheet (asset 182270): https://www.spriters-resource.com/snes/smetroid/asset/182270/
- Tile Sheets collection (asset 144515): https://www.spriters-resource.com/snes/smetroid/sheet/144515/
- Background Tiles (asset 1718): https://www.spriters-resource.com/snes/smetroid/asset/1718/
- Backgrounds (asset 65181): https://www.spriters-resource.com/snes/smetroid/asset/65181/
- Norfair dedicated asset (159298): https://www.spriters-resource.com/snes/smetroid/asset/159298/
- Sprite Database — Super Metroid: https://spritedatabase.net/game/543
- Background HQ — Super Metroid: https://bghq.com/bgs.php?c=31
- Samus run cycle (10 frames, 35x43px, 16 colors): https://www.tumblr.com/desandro/113218736476/super-metroid-samus-run-cycle-10-frames-16
- Turnaround animation 6 frames: https://tasvideos.org/GameResources/SNES/SuperMetroid
- Screw attack visual (armor flashes, identical to spin jump sprite): https://metroid.fandom.com/wiki/Screw_Attack
- Screw attack flash mechanic: https://metroidphysics.home.blog/screw-attack/
- No idle animation in 2D Metroid games: https://metroid.fandom.com/wiki/Idle_pose
- Norfair visual description: https://metroid.fandom.com/wiki/Norfair
- Community tileset index (Norfair, Brinstar, Maridia variants): https://github.com/mrguyaverage/Super-Metroid-Community-Hack/blob/master/Tilesets.md
- Samus Animation Master Disassembly: https://metroidconstruction.com/resource.php?id=333
- SpriteSomething FAQ: https://github.com/Artheau/SpriteSomething/blob/master/resources/app/snes/metroid3/FAQ.md
- Nintendo IP enforcement: https://en.wikipedia.org/wiki/Intellectual_property_protection_by_Nintendo

---

*Feature research for: v1.2 Pixel Perfect — Super Metroid sprite and level asset integration*
*Researched: 2026-04-23*
