# Phase 6 Specification — Dual-Theme Homepage (`/`) Hero Overhaul

> **Audience for this document:** This is a comprehensive visual, interactive, and graphics-engineering specification written for the final implementation pass of Phase 6 on **Mark Peng's personal website** ([markpeng.me](https://markpeng.me)).
>
> **Required Pre-Reading:** Read [design.md](./design.md) and [AGENTS.md](./AGENTS.md) first. Honor all locked tokens, typography (**Liner Notes**: `Shippori Mincho`, `IBM Plex Sans`, `IBM Plex Mono`), anti-patterns, and the `next dev` / `npm run build` guardrail.

---

## 1. Reference Prototype Snapshot (Do NOT Merge Directly)

Five iterative prototypes were built and reviewed live with Mark before writing this specification. The final draft state is preserved on a separate reference branch that **must not** be merged into `project-nurture`:

* **Reference Branch:** `proto/phase6-hero-draft`
* **Reference Commit:** `0d587a4` (`0d587a4c0168e65a9bccd0044904ddeecaac3862`)
* **Files in that snapshot:**
  * `app/components/hero/NightSeaScene.tsx` — Validated *Get Your Wish* mirror water stage + shared analytical sky reflection shader + strong capsule-wake FBO physics (**"water is stunning"** — keep and build directly on this visual/mathematical foundation).
  * `app/components/hero/NurtureGrassScene.tsx` — Validated cerulean-sky + cumulus cloud shader, grounded hillside lighting, and `256×256` slightly-damp spring-physics FBO (**use the physics math & sky palette as a baseline, but significantly elevate the grass geometry/botanical shading beyond "typical poly grass"** — see Section 5).
  * `app/components/hero/HeroCanvas.tsx` — Prototype single-canvas 2D snapshot crossfade (**replace with zero-lag pre-warmed dual-scene GPU crossfade** — see Section 6).
  * `app/components/hero/HeroOverlay.tsx` — Prototype foreground typography, links, and temporary `draft` bar (**strip the `draft` bar in final build; restore smooth button hovers** — see Section 3).
  * `app/components/hero/types.ts`, `app/page.tsx`, `app/components/NavBar.tsx`, `app/components/ThemeProvider.tsx`, `app/layout.tsx`, `app/globals.css`.

Inspect any reference file cleanly without polluting `project-nurture` via:
```bash
git show 0d587a4:app/components/hero/NightSeaScene.tsx
git show 0d587a4:app/components/hero/NurtureGrassScene.tsx
```

---

## 2. Creative North Star & Locked Structural Decisions

### Dual-World Theme Concept (Locked)
Toggling Light / Dark mode in `NavBar.tsx` transforms `/` between the two halves of Porter Robinson's *Nurture* visual era while keeping Mark's identity and recruiter quick links anchored in the exact same calm sky space:

| Dimension | Light Mode — *Nurture* Daylight | Dark Mode — *Get Your Wish* Night |
| :--- | :--- | :--- |
| **Upper ~55–60% (Sky)** | Painterly cerulean-to-pastel-aqua summer sky (`#4e90e2` → `#71b6f0` → `#abdef6` → `#d7f1f8`) with sunlit billowing cumulus banks on left/right horizons, slow wispy upper clouds, and subtle drifting yellow/white petals | Pitch-black studio void (`#07080b` → deep midnight indigo `#0c1220`), quiet sparse starfield, and a soft-edged luminous cloud-filled sky screen resting on the waterline, lit by a soft stage-light glow raised just behind the button row (inspired directly by Chris Muir's *Get Your Wish* music video stage) |
| **Lower ~40–45% (Ground)** | Lush, slightly damp rolling tall-grass hillside with organic botanical tufts, wildflower clusters, drifting cloud shadows, and weighty spring-physics cursor brushing | Glass-still obsidian shallow mirror water stage reflecting the glowing sky screen in real time (always a touch dimmer than the screen itself), shattered by bold, liquid cursor wakes and click-to-splash concentric rings |
| **Camera Angle** | **Horizon / Eye-level** (grounded, rock-steady, zero vertical bounce) | **Horizon / Eye-level** (grounded, rock-steady, zero vertical bounce) |

### Information-First Flow (Non-Negotiable)
* **Recruiter & Peer Clarity:** Anyone landing on `/` must immediately see Mark's name, concise bio, and clearly labeled **Resume**, **LinkedIn**, and **GitHub** buttons within `< 1s` without hovering mystery icons or fighting background noise.
* **No Competing Chrome:**
  * **Remove** the prototype's bottom `draft` switcher bar completely.
  * **Remove** the legacy `"play with the shader"` button and `"you can click to toggle the shader"` hint from old `app/page.tsx`. Both scenes are passively interactive on cursor/touch immediately.
* **Rejected Explorations (Do NOT Re-Introduce):**
  * Top-down camera views (tested & rejected — horizon view is decisively better).
  * Static SVG hand-drawn white streaks / starburst sparks in the night sky (tested & rejected as disconnected clipart).
  * Choppy multi-sine-wave ocean swells in Dark Mode (tested & rejected as plastic/ugly; ruined mouse ripple visibility).
  * Outer rounded liquid-glass capsule wrapping `NavBar` or beveled glossy borders on hero buttons (rejected as "completely vibed").
  * Highlighting `Resume` as a mismatched bordered box next to plain-text `LinkedIn` / `GitHub` (all 3 must be uniform subtle buttons).
  * Chunky foreground 3D extruded name blocks (`3d-blocks` prototype toggle was explored and left unused in favor of clean atmospheric sky typography).

---

## 3. Foreground UI, Typography, NavBar & Theme Wiring

### A. Enable Dual-Theme Support on `/` (Zero FOUC)
Remove the temporary Phases 1–5 dark-only `/` lock from:
* `app/layout.tsx` — remove `if (window.location.pathname === '/') { root.dataset.home = 'true'; }` from `themeInitScript`.
* `app/components/ThemeProvider.tsx` — remove the `data-home="true"` `useEffect` and unused `usePathname` import.
* `app/globals.css` — remove the `html[data-home="true"]` CSS override block.
* `app/components/NavBar.tsx` — always render the divider + `<ThemeToggle />` on `/` as well as secondary routes.

### B. NavBar on `/` (`app/components/NavBar.tsx`)
* **Keep Mark's original borderless floating NavBar structure** (`p-4`, centered items, Framer Motion `layoutId="bubble"` spring pill, hairline divider, borderless `ThemeToggle`).
* **Never** wrap `NavBar` in an outer capsule card or add inset glass bevel shadows.
* Scope subtle CSS variable overrides **strictly to `/` (`pathname === '/'`)** so `/about`, `/blog`, and `/contact` remain 100% untouched:
  * **Light `/`:** `--color-text-primary: #ffffff`, `--color-text-muted: rgba(255, 255, 255, 0.80)`, `--color-surface-elevated: rgba(255, 255, 255, 0.22)`, `--color-border: rgba(255, 255, 255, 0.34)`, `--color-focus-ring: rgba(255, 255, 255, 0.65)`.
  * **Dark `/`:** `--color-text-primary: #f4f8ff`, `--color-text-muted: rgba(205, 218, 240, 0.68)`, `--color-surface-elevated: rgba(180, 210, 255, 0.11)`, `--color-border: rgba(190, 215, 255, 0.18)`, `--color-focus-ring: rgba(137, 176, 255, 0.55)`.
  * Apply subtle `backdropFilter: 'blur(6px)'` only on the active spring pill when `isHome`.
  * Keep vertical metrics identical across Light/Dark and all 4 routes so toggling themes never shifts layout by a single pixel.

### C. Hero Typography & Atmospheric Sky Treatment
* **Container:** Centered upper sky positioning (`max-w-4xl`, `pointer-events-none` outer wrapper with `pointer-events-auto` on interactive elements so the 3D scene stays responsive everywhere).
  * **Desktop / tablet (`>= 640px`):** `sm:pt-[10vh]`.
  * **Phones (`< 640px`):** the block lives in the sky band between the nav and the portrait horizon (`min-h-[calc(59svh-4.45rem)]`) and two `aria-hidden` flex spacers (`flex-[4]` above, `flex-[3]` below) split the free space **4:3**, so the headline rests on the scene and its light instead of hanging off the nav. The shift scales with the room available (≈ +25px on a 375×667 SE, +40px at 390×844, +47px at 430×932), so short phones never crowd the horizon.
  * *Review update (Nov 2026):* a plain optical centring in that band (more empty space under the buttons than above the title) read as *"a tad too high"* to Mark. Don't push lower than ≈ +55px at 390×844: the bio starts running into the right-hand cumulus bank in Light mode.
* **Headline (`<h1>`):**
  * Copy: `hello, i'm Mark Peng` (exact authentic copy — do not invent subtitles or eyebrows).
  * Font: `Shippori Mincho` (`font-heading`), `font-medium`, `tracking-[0.015em]`.
  * **Single-line desktop/tablet rule (CRITICAL):** Use `sm:whitespace-nowrap` and `text-[clamp(2rem,4.9vw,3.65rem)]` inside the `max-w-4xl` wrapper so `"Peng"` **never** orphans onto a second line on desktop/tablet. Allow natural wrapping only on narrow mobile (`< 640px`).
  * **Descender clipping prevention (CRITICAL):** `background-clip: text; color: transparent` slices the bottom loop of lowercase `g` in `Shippori Mincho` if line-height is tight! Always pair with `leading-[1.22]` and `px-1 pb-[0.18em] -mb-[0.18em]`.
  * **Atmospheric Sky-Responsive Color Variation (LOCKED):** Mark specifically liked the subtle pointer-reactive radial tint that ties the text color into the sky behind it (not flat opaque white):
    * **Light Mode:** `radial-gradient(circle 300px at <x%> <y%>, rgba(255, 255, 255, 1) 0%, rgba(232, 247, 255, 0.92) 48%, rgba(196, 232, 255, 0.80) 100%)` + layered sky-depth legibility shadow `drop-shadow(0 1px 2px rgba(16, 62, 128, 0.24)) drop-shadow(0 3px 16px rgba(18, 70, 142, 0.30))` so outer letters stay legible even when white clouds pass behind them.
    * **Dark Mode:** `radial-gradient(circle 300px at <x%> <y%>, rgba(255, 255, 255, 1) 0%, rgba(218, 233, 255, 0.90) 48%, rgba(154, 188, 240, 0.76) 100%)` + `drop-shadow(0 2px 16px rgba(0, 0, 0, 0.45))`.
    * **Perf note:** Update the pointer sheen via CSS custom properties (`--mx`, `--my`) on a ref (`el.style.setProperty(...)`) rather than React `useState` on every `pointermove` so moving the mouse causes **zero React re-renders**! Freeze cleanly at `50% 32%` when `prefers-reduced-motion: reduce` is active.
* **Bio (`<p>`):**
  * Copy: `A software engineer and undergraduate at the University of Toronto studying computer science.`
  * Font: `IBM Plex Sans` (`font-body`), `15.5px sm:16.5px`, `max-w-[44ch]`, `mt-3`, crisp sky-legible white (`text-white/94` with subtle sky shadow on Light; `rgba(228, 235, 246, 0.96)` with a soft `0 1px 12px rgba(0, 0, 0, 0.48)` shadow on Dark).
  * *Review update (Nov 2026):* Dark was raised from the original `#d0daea/90` so the bio keeps its contrast over the stage light's soft upper tail (Section 4).

### D. Action Buttons (`Resume`, `LinkedIn`, `GitHub`)
* **Uniformity & Spacing:** All three links (`/resume.pdf`, `https://linkedin.com/in/markminpeng`, `https://github.com/notMarkMP1`, each `target="_blank" rel="noopener noreferrer"`) share the **exact same clean subtle button design** (crisp inline `currentColor` icon + explicit label + subtle `↗` external arrow), nestled closely under the bio (`mt-4`, `gap-2.5`).
* **Style — Original Flat Translucent Language (No Borders / No Bevels):**
  * Rooted in Mark's original `bg-zinc-900/70 rounded-lg` button aesthetic, evolved to be color-conscious with a light touch of transparency (`rounded-lg px-3 py-2 text-[13.5px] sm:px-3.5 sm:text-[14px] font-medium backdrop-blur-[4px]`, row `gap-2 sm:gap-2.5`, the `↗` arrow hidden below `380px` so all three fit on one row from `360px`):
    * **Light Mode:** frosted white chips with deep-sky ink — `bg rgba(255, 255, 255, 0.80)` → hover `0.95`, text `#1d5aa8` → hover `#154a8f`, icon `#2c6cc0`, arrow `rgba(29, 90, 168, 0.62)`, plus a soft outer lift `0 1px 2px` + `0 4px 14px rgba(18, 64, 132, 0.12)` (an outer drop shadow, not a border, bevel, or glow).
      * *Review update (Nov 2026):* the original `bg-white/20 text-white` was hard to read whenever a white cumulus bank drifted behind the buttons.
    * **Dark Mode:** `bg-[#0e1a2e]/62 text-[#eef4ff] hover:bg-[#1a2f52]/74 hover:text-white`
  * **ZERO borders, ZERO inset glass bevel shadows, ZERO neon glows.**
* **Smooth Tactile Hover Polish (CRITICAL — Fix from Prototype v5):**
  * Mark specifically noted v5's buttons *"lost [their] smoothness when you hover"*.
  * Do **not** use bare slow `transition-colors duration-300` alone. Use a crisp, silky micro-interaction:
    * `transition-[background-color,color,transform] duration-200 ease-out`
    * Gentle tactile lift & press: `hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]` (matching the smooth feel of `Projects.tsx` thumbnails and Mark's original scale feedback without feeling bouncy/exaggerated).
    * Smooth icon brightening + diagonal external arrow glide (`group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-200 ease-out`).
    * Respect `motion-reduce:transition-none motion-reduce:transform-none`.

---

## 4. Dark Mode — *Get Your Wish* Mirror Water Stage (Preserve & Perfect)

> **Mark's verdict on `0d587a4` Night Sea:** *"water is stunning."* / *"i like water stage, the reflection is a nice touch."*

Keep the visual aesthetic, composition, and wave feel from `0d587a4:app/components/hero/NightSeaScene.tsx` (`water-stage` mode) verbatim as the visual benchmark:

### Visual Architecture
1. **Shared Analytical Sky + Planar Reflection (`evalGetYourWishSky`):**
   * Both the fullscreen ray-aligned sky shader (`uInvProj` + `uCamMatrixWorld`) and the water fragment shader evaluate the exact same analytical sky function.
   * Water computes `R = reflect(-V, N); R.y = abs(R.y);` and samples `evalGetYourWishSky(R, ..., isReflection = 1.0)`.
   * **Sky composition (`water-stage`):**
     * Stark obsidian night void (`#07080b`) transitioning gently toward deep midnight indigo (`#0c1220`) near the horizon, with quiet sparse twinkling starlight pinpoints.
     * Soft-edged cloud-filled sky screen (`SCREEN_W ≈ 0.44`, `SCREEN_H ≈ 0.21`) running right down to the waterline. Its drifting clouds use **saturated blues** (`(0.20, 0.52, 0.98)` → `(0.60, 0.84, 1.00)` at a `0.36` base) so the panel stays vivid at a luminance the foreground text can sit on.
     * **Stage light raised toward the text:** a centred luminous band peaking just behind the button row (`LIGHT_Y ≈ 0.05` elevation; horizontal falloff `0.3`, `0.32` strength left at the sides; gain `0.62`).
       * Below the peak it falls off as a Gaussian (`0.062`) down to a faint waterline seam (`0.16`).
       * Above the peak it eases out along a long stretched-exponential tail (`exp(-pow(dy / 0.05, 1.6))`), never a Gaussian shoulder, so there is no visible cut-off under the text.
       * Only its tight core (`0.032`) tints cyan, so the tail rises in saturated blue. A soft bloom spills from it into the void around the panel.
     * **Physically consistent mirror:** the sky and the water evaluate the same emitted light (reflection `× 0.9`, then Fresnel), so the sky is **never darker than its own reflection**.
     * *Review update (Nov 2026):* this replaces the original dim direct screen (`directScale ≈ 0.36`) with a vivid reflection (`≈ 0.88`) and a bright waterline seam. Mark felt a reflection brighter than its source made no sense, and that the light should originate near the text for visual balance.
2. **Mirror-Still Obsidian Water Surface:**
   * **No blocky sine waves.** Undisturbed water has only whisper-subtle FBM capillary micro-tension (`0.22` gradient scale) so it reads like a calm, shallow obsidian studio pool.
   * Polished-stage-floor Fresnel (`0.3 + 0.7 * pow(1.0 - max(dot(N, V), 0.0), 2.6)`, never above `1`) over a near-black ink body (`#030407`).
     * Far water (`> 16–46` units) settles into a perfectly still mirror so the screen meets its own reflection exactly on the waterline.
   * Every highlight is lit by the sky screen itself as an area light, never a free-floating point light. *Review update (Nov 2026):* a point-light glint in the middle of the water read as *"the light source is in the middle"*.
     * Ripple facets glitter with the stage light's band (`pow(N·H, 80)`).
     * Slopes facing the panel catch a soft rim, plus a gentle fill rim.
     * All use ice-blue/silver highlights (`#8fc2ff` → `#f2faff`) so even dark outer corners respond visibly to cursor wakes.
3. **Strong, Glassy Interactive Wave Simulation (Desktop Tier):**
   * Strictly **square `1:1` world-space FBO** (`22m × 22m`, `512×512` `HalfFloatType`, `LinearFilter`) so ripples expand as true circles in 3D perspective.
   * Fixed-step `60Hz` PDE integration (max 2 substeps/frame) so wave physics feel identical on 60Hz, 120Hz, and 144Hz monitors (`delta ≈ 1.12`, `pressure ≈ 0.990`).
   * **Continuous capsule-segment wake (`sdSegment(uv, prevUv, currUv)`)** scaled strongly (`mouseGain` `0.14–0.62`, plus `0.24` entry ring) so gliding across the water immediately carves bold, glossy wakes—never dotted beads and never buzzing when stationary.
     * Wake strength follows **on-screen** glide distance, not world distance, so moving up toward the horizon feels as even as gliding sideways. Distant wakes are slightly wider and softer.
     * On 120–240Hz displays, each 60Hz step sweeps on from the last stamped point, and click splashes queue for the next step, so no stretch of a glide or tap is ever dropped.
   * **Click-to-splash:** Clicking anywhere outside interactive UI (`a, button, input, nav`) injects a bold concentric splash (`strength ≈ 0.92`, `r ≈ 0.019`).
   * Quiet periodic ambient droplets (`~2.5–5s` intervals, `strength ≈ 0.32`) keep the mirror alive gently when untouched.
   * Smooth 5-tap gradient filter in fragment shader + GLSL ES 1.00 safe rational saturation (`x / (1.0 + abs(x) / 2.0)` — **never use `tanh()`** in GLSL ES 1.00).
4. **Camera:** Grounded eye-level studio poise (`(0, 1.55, 7.0)` → `(0, 0.72, -12.0)`), zero vertical bounce, whisper-quiet horizontal drift (`±0.05` max).

---

## 5. Light Mode — *Nurture* Sky & Next-Level Botanical/Painterly Meadow

> **Mark's verdict on `0d587a4` Light Meadow:** *"grass looks good enough, the color is decent. this looks like the typical poly grass though, which makes me unimpressed these days. wonder if theres a way to improve it."*

### What to Preserve from `0d587a4:app/components/hero/NurtureGrassScene.tsx`
1. **Bright Painterly Summer Sky & Billowing Cumulus Clouds:**
   * Cerulean zenith (`#4e90e2`) → sky blue (`#71b6f0`) → pastel aqua (`#abdef6`) → luminous horizon (`#d7f1f8`) with warm sunlit breath over the center ridge, sculptural cumulus cloud banks on the left/right horizons, calm slow-drifting wispy upper clouds, and subtle floating yellow/white sunlit petals.
2. **Color Balance (Keep This Contrast Level):**
   * Rich grounded greens (neither washed-out/overexposed nor too dark): roots `#24522b`, mids `#3d823e` / `#549d45`, sunlit tips `#8ec254` → `#bfdd79`, under-canopy floor `#1a3c1f` → `#2e5e2e`.
   * *Review update (Nov 2026):* brightened and densified toward the *Nurture* album cover after Mark found desktop grass too sparse and a bit dark. Tuft, filler, ground-cover, plume, and flower counts scale with how much hillside the camera actually sees (`densityScale`), so wide/fullscreen desktops never look thin.
3. **Slightly Damp, Weighty Grass Physics (`256×256` Spring FBO):**
   * Preserve the damped spring-harmonic field (`stiffness ≈ 6.4`, `damping ≈ 3.05`, neighbor coupling `≈ 11.5`, nonlinear `dampHold` clinging resistance, continuous swept capsule stroke, 4-step curved-hill terrain raycast, physical arc-length downward compression, parted trough darkening + dewy bend highlight).
   * Keep the **calmer v5 ambient breeze** (gentle swaying, not constantly undulating) so the meadow feels serene and cursor sweeps feel super tangible.
   * Keep the **rock-steady grounded camera** (zero vertical bounce, zero sky parallax bob, `±0.045` micro horizontal poise max) and keep near-camera blades (`z > 1.8`) scaled modestly so stray stalks never stab upward through the headline.

### CRITICAL UPGRADE — Moving Far Beyond "Typical Poly Grass"
Generic Three.js `InstancedBufferGeometry` grass fails visually because every blade is an identical flat-shaded straight triangle strip scattered uniformly with sharp CG polygon edges. To deliver an art-directed, painterly *Nurture* / Ghibli / Makoto Shinkai hillside that genuinely impresses:

1. **Organic Botanical Clumping (Tufts, Not Uniform Scatter):**
   * Generate ~400–600 natural **tuft root centers** across the rolling hillside (modulated by low-frequency Worley/FBM density waves so subtle meadow billows and natural density pockets form) and radiate 16–24 varied blades outward from each clump with organic height/lean clustering instead of uniform random X/Z pins.
2. **Multi-Species Botanical Silhouettes (Procedural High-Res Atlas / Multi-Archetype Geometry):**
   * Break uniform ribbon repetition by mixing **3–4 genuine meadow species** (either via a crisp procedurally painted offscreen HTML5 Canvas botanical texture atlas with `alphaTest`/smooth alpha-to-coverage edges, OR dedicated curved instanced archetypes):
     * **Primary S-curved meadow grass blades** with **curved cylindrical cross-blade normals** (tilting the vertex normal `±35°` across blade width with a subtle central spine crease so directional sunlight rolls smoothly across each curved leaf instead of lighting flat matte triangles!).
     * **Delicate *Nurture* foxtail / wild-oat seed plumes** (slender arching stems topped with soft feathery seed heads swaying gracefully slightly above the main canopy).
     * **Clustered meadow wildflowers** (natural patches of tiny multi-petal yellow buttercups & white daisies nestled in clumps across the sunlit knolls — NOT evenly spaced single yellow-tipped triangles!).
     * **Low soft ground-cover foliage / painterly tuft cards** near the roots so the base of the meadow looks lush and layered, never sparse polygonal stems poking out of a flat plane.
3. **Volumetric Painterly Lighting (The Biggest Visual Leap):**
   * **Drifting Cloud Shadows Across the Hillside:** Sample the **exact same scrolling cloud FBM** from the sky shader projected onto world `(x, z)` in the meadow/ground shaders, softly darkening broad moving patches of the hillside by `15–22%` as clouds drift overhead! This visually locks sky and meadow into a single sunlit atmosphere and immediately breaks the "procedural poly grass" look.
   * **Macro Painterly Color Variation:** Modulate meadow hue/warmth by a large-scale terrain FBM map (warmer golden-olive sunlit knolls vs. cooler emerald-teal shaded hollows) so the hillside reads like painted anime/film background art.
   * **Warm Backlit Subsurface Scattering (SSS):** Add directional backlit translucency (`pow(max(dot(-V, sunDir), 0.0), 3.0)`) shining warmly through thin upper blade tips and seed plumes when sunlight filters through them from behind the ridge.
   * **Soft Optical Foreground Depth:** Subtly feather/soften the closest foreground blades (soft edge alpha or gentle depth-of-field warmth near the lens) so foreground wisps feel photographic rather than sharp razor-edge polygons.
4. **Subtle Tactile Polish (Optional):**
   * When brushing rapidly through damp grass tufts, gently spawn 1–2 extra sunlit pollen specks lifting upward from the cursor's wake before drifting away in the breeze.

---

## 6. Zero-Latency Light ↔ Dark Transition Architecture (CRITICAL)

### Root Cause of Lag in Prototype `0d587a4`
Even with a single persistent `<Canvas>`, prototype v5 unmounted `<NurtureGrassScene>` and mounted `<NightSeaScene>` on toggle. Mounting forced synchronous CPU buffer creation (11,200 grass instances), FBO allocation, and GLSL program compilation right when the user clicked the theme button (`~80–250ms` hitch), plus `preserveDrawingBuffer: true` + 2D canvas `drawImage` overhead.

### Required Final Architecture: Pre-Warmed Dual-Scene GPU Crossfade (< 16ms Toggle Latency)
> **Known limitation (Nov 2026):** the very first toggle after a page load can still stall one frame (~110–190ms in Chrome on Windows/D3D11), more noticeably light → dark; later toggles stay ~18–24ms.
> * A trace places it in Chrome's GPU-process DOM raster (`RendererRasterWorker` → `DoEndRasterCHROMIUM::Flush`), i.e. repainting the page's text/nav/buttons in the new theme, **not** in the WebGL scenes.
> * The inactive scene, its full-size transition targets, and the sweep pass are all pre-warmed at idle.
> * Not yet measured on a production build.
1. **Fast Initial Paint + Idle Pre-Warming:**
   * On mount, initialize **only the active theme scene** immediately so initial LCP/TTI stays fast.
   * After first paint settles (`requestIdleCallback` or `~400–600ms` timeout), silently mount and pre-compile the **inactive** theme scene inside its own offscreen `THREE.Scene` (running `gl.compile(inactiveScene, inactiveCamera)` + 1 warmup frame for its FBOs) while keeping it **completely paused (`useFrame` early-returns)** whenever it is neither active nor transitioning.
   * Idle VRAM footprint is small (~6–8 MB); idle GPU/CPU frame cost is **0%**.
2. **True Single-Pass at Rest, Pure GPU Crossfade on Toggle:**
   * Do **NOT** use `preserveDrawingBuffer: true` or a 2D snapshot canvas!
   * Use a small custom compositor inside one persistent `<Canvas>`:
     * **At rest (`transitionProgress === 0` or `1`):** Render ONLY the active `THREE.Scene` directly to the default framebuffer (`gl.setRenderTarget(null)`). Zero extra pass overhead!
     * **During toggle (`~500–550ms`, `cubic-bezier(0.22, 1, 0.36, 1)`):** Render the outgoing scene to `rtOutgoing` and the incoming scene to `rtIncoming` (both already compiled and warm—**0ms allocation/compile hitch!**), then draw one fullscreen quad mixing them smoothly.
     * *Bonus aesthetic polish:* Instead of a flat muddy 50/50 linear mix (which briefly turns blue sky + pitch black into murky grey), add a subtle **twilight/horizon-sweep dissolve mask** (e.g., soft vertical sky-to-horizon wave wipe blended with smooth opacity, ~`520ms`) so Daylight organically melts into Dusk/Night and Night rises cleanly into Dawn!
   * Synchronize `NavBar` and `HeroOverlay` CSS transitions to the exact same `520ms` easing curve.
   * When `prefers-reduced-motion: reduce` is enabled, swap instantaneously without transition animation.

---

## 7. Mobile & Cross-Device Engineering Strategy (CRITICAL)

The legacy `WaterShader.jsx` was simply turned off on mobile (`!isMobile`), leaving phone visitors with a blank background. The final hero must feel intentional, responsive, and buttery-smooth on both desktop and mobile (320px → 1440px+ ultrawide).

### A. Real WebGL Capability Detection (Not Just User-Agent Sniffing)
Never rely solely on `/Mobi|Android|iPhone/i` UA strings! On canvas creation, explicitly probe:
1. Viewport / pointer tier: `isCompact = window.innerWidth < 768` and `isTouch = matchMedia('(pointer: coarse)').matches`.
2. WebGL2 support (`gl.capabilities.isWebGL2`).
3. **Live FBO HalfFloat Completeness Probe:** Create a tiny `4×4` `WebGLRenderTarget` with `HalfFloatType` + `LinearFilter`, bind it, and check `rawGl.checkFramebufferStatus(rawGl.FRAMEBUFFER) === rawGl.FRAMEBUFFER_COMPLETE` (also verify `EXT_color_buffer_half_float` / `EXT_color_buffer_float` + `OES_texture_half_float_linear` on WebGL1). Dispose the probe target immediately.

### B. Dark Mode Water Stage on Mobile — 3-Tier Graceful Strategy
1. **Tier 1 — Capable Modern Mobile (WebGL2 + Verified `HalfFloat` FBO):**
   * Run the real ping-pong wave FBO at a lightweight `192×192` or `256×256` resolution, `dpr={[1, 1.25]}`, lighter ocean mesh (`64×48`), 2-octave sky FBM, and smooth touch-tap & touch-drag ripples (`pointerdown` / `pointermove` without blocking link taps).
2. **Tier 2 — Zero-FBO Analytical Mirror Water Fallback (Works on 100% of Mobile WebGL Devices!):**
   * If `HalfFloat` FBO probing fails OR on constrained mobile GPUs (e.g. older iOS Safari / low-end Android): render the **exact same *Get Your Wish* mirror water stage & glowing sky screen reflection**, replacing the FBO texture sample with an **analytical single-pass ripple ring buffer** (`uniform vec4 uRipples[8]` storing `(worldX, worldZ, startTime, amplitude)`).
   * In the fragment shader, sum each active ring analytically:
     ```glsl
     // Traveling circular wave + exact analytical radial derivative for crisp glossy normals
     float r = length(vWorldPos.xz - rp.xy);
     float age = uTime - rp.z;
     float waveFront = r - age * 2.6;
     float env = exp(-waveFront * waveFront * 2.8) * exp(-age * 1.15) * smoothstep(0.0, 0.08, age);
     float dWave = cos(waveFront * 9.5) * env * rp.w;
     ```
   * Every tap on the water spawns a crisp, expanding concentric reflection ripple, and quiet ambient droplets keep the mirror alive automatically. **Zero FBOs, zero float-texture glitches, locked 60fps on every phone!**
3. **Tier 3 — No WebGL / Software Renderer / Reduced Motion Static Fallback:**
   * Clean CSS background mirroring the *Get Your Wish* dark void, the soft-edged sky screen with its raised stage light, and a dimmer reflection below the waterline, so the homepage still feels intentional and legible.
     * It doubles as the instant first paint the canvas fades in over, so it must track the WebGL composition.
     * It is hidden (`html[data-hero-canvas="live"]`) once the canvas fully covers it, so theme toggles never repaint it.

### C. Light Mode Meadow on Mobile
* Cap DPR at `[1, 1.25]`, scale blade/tuft density cleanly (baseline `340` tufts × `12–18` blades + `1,300` filler blades + `800` ground-cover cards, 5-segment blades at `1.35×` width, scaled by visible hillside spread and planted ~25% lighter on no-FBO phones, so the hillside stays lush without heavy overdraw), drop spring FBO to `128×128` (or a lightweight 6-point analytical damped touch-wake uniform array if `HalfFloat` FBO is unsupported).
* Support gentle touch-drag brushing on the meadow (`pointermove` / `pointerdown` passive listeners — never call `preventDefault()` so normal browser gestures and link taps always work cleanly).
* **Portrait Aspect Camera Framing (`aspect < 0.85`):** On tall portrait phones (`375×812`, `390×844`), adjust vertical FOV / camera pitch slightly so the horizon remains cleanly around the lower ~38–42% of the screen—keeping the grass/water clearly visible without colliding with the stacked mobile headline and buttons!

---

## 8. Implementation Architecture & Verification Checklist

### Suggested Modular Structure
```
app/components/hero/
├── HeroCanvas.tsx          # Single persistent <Canvas>, idle pre-warmer, GPU crossfade compositor, DPR frame-time governor
├── HeroOverlay.tsx         # Foreground Liner Notes typography, bio, uniform smooth translucent buttons (no draft dock)
├── HeroBackdrop.tsx        # Tier 3 static CSS backdrop + instant first paint under the canvas
├── capabilities.ts         # WebGL2 + HalfFloat FBO probe, device tiering, mobile/reduced-motion detection, quality presets
├── compositor.ts           # Horizon-sweep dissolve pass + shared 520ms easing
├── framing.ts              # Landscape ↔ portrait camera framing (horizon placement)
├── types.ts                # HeroScene / input contracts
├── NurtureMeadowScene.ts   # Painterly sky + clouds + botanical clumped meadow + cloud shadows + damp spring FBO
└── NightWaterStage.ts      # Get Your Wish mirror water stage + shared analytical sky + FBO (Tier 1) & analytical ripples (Tier 2)
```

### Cleanup Notes
* Once Mark signs off on the final Phase 6 hero, verify nothing else imports legacy `app/components/WaterShader.jsx` or `app/utils/shaders.ts` and remove them cleanly during Pre-Launch QA.
* Never leave the temporary `draft` control bar from commit `0d587a4` in the production hero.

### Final QA Checklist (Before Phase 6 Sign-Off)
* [ ] **Build Guardrail:** Only run `npx tsc --noEmit` while `next dev` is running; run `npm run lint && npm run build` only when no dev server is active.
* [ ] **Zero-Lag Theme Toggle:** Rapidly toggling Light ↔ Dark in `NavBar` produces an immediate, fluid GPU transition (~520ms) with zero stutter, zero flash, and zero WebGL context recreation.
* [ ] **Typography & Spacing:** `hello, i'm Mark Peng` stays on a single line at `>= 640px`, lowercase `g` descender is completely unclipped, atmospheric sky-tinted color variation keeps crisp contrast on both sides even over drifting clouds, and buttons sit cleanly close below the bio (`mt-4`).
* [ ] **Buttons & NavBar:** `Resume`, `LinkedIn`, and `GitHub` are uniform flat borderless translucent buttons with buttery smooth hover transitions (`200ms ease-out`); `NavBar` preserves the original borderless floating design with no outer capsule or beveled borders, and zero regression on `/about`, `/blog`, `/contact`.
* [ ] **Light Mode Botanical Realism:** Grass breaks clearly beyond "typical poly grass" (organic clumping, species/wildflower variety, curved normals/SSS, drifting cloud shadows, weighty damp spring physics, calm breeze, rock-steady camera, no foreground stalks stabbing the headline).
* [ ] **Dark Mode Water Stage:** Matches or exceeds `0d587a4`'s *"stunning"* mirror reflections, with the stage light glowing from behind the text (sky never darker than its reflection), strong continuous cursor wakes, and crisp click-to-splash ripples.
* [ ] **Mobile & Accessibility:** Verified at `375px`, `390px`, `768px`, `1280px`, `1440px+` (including mobile analytical water fallback if FBO unavailable), keyboard focus rings visible on all links/buttons, and `prefers-reduced-motion: reduce` respected cleanly.
