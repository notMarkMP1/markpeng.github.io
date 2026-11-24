# Project Nurture — Design Specification & Roadmap

`project-nurture` is the master design specification and execution plan for **Mark Peng's personal website** ([markpeng.me](https://markpeng.me)).

This document is the **single source of truth** for visual direction, locked decisions, open explorations, anti-patterns, and build phases. It intentionally separates **what is locked** from **what is still open to research/prototyping**, so neither Mark nor AI agents guess prematurely.

> **Branch Policy:** `project-nurture` will not be published until the full revision is complete. Work cleanly toward the complete dual-theme vision rather than shipping half-measures.

---

## 1. North Star & Core Principles

* **Audience:** Technical recruiters, engineering managers, software peers, and curious readers.
* **Primary Priority — Information First:** Getting Mark's experience, projects, writing, and contact info across cleanly is **always** the top priority. This is a professional personal website with an authentic *Nurture* atmosphere — **not** an art installation.
* **Visual Inspiration:** Porter Robinson's *Nurture* era (2021, Samuel Burgess-Johnson), spanning both sides of its visual language:
  * **Daylight (*Nurture* album cover):** Clean sunlit whites, fresh meadow greens, quiet natural openness.
  * **Night (*Get Your Wish* / *Look at the Sky*):** Stark dark canvas, raw white hand-drawn scribbles, framed photography, and subtle twilight/cobalt-blue undertones.
* **Restraint over Clutter:** Decorative elements live in the margins and background, stay calm, fade gracefully around content, and never compete with text legibility or scannability.

---

## 2. Explicit Anti-Patterns (Do NOT Do)

Previous attempts failed by falling into generic templates or inventing unrequested features. **Never introduce any of the following:**

1. **No "AI dark glow slop":** No neon green `box-shadow` glows, no heavy frosted glassmorphism cards on dark backgrounds, no cyberpunk/HUD eyebrow labels (e.g. `[ 01 // PROJECTS ]`), and no inline SVG pixel doodles.
2. **No invented features or fake copy:** Do **not** add unrequested sections (no contact form, no fake Las Vegas coordinates, no invented skills grid, no Featured Projects or Latest Writing sections on `/`).
3. **No unapproved route changes:** Keep strictly `/`, `/about`, `/blog` (+ `/blog/[slug]`), and `/contact`.
4. **No art obstructing text or border/modal slop:** Scribbles and photography must never reduce body contrast below WCAG AA (4.5:1) or crowd narrow viewports. Avoid clunky box/double-mat image borders (especially on Dark mode), avoid caption/filename clutter beneath personal photos, avoid opaque full-screen lightbox veils that erase the underlying page or leave the navbar floating awkwardly above them, and keep thumbnail row spacing optically uniform.
5. **No premature lock-in on TBD items:** Items marked **Open Exploration** or **Future Scope** (Phase 6 `/` hero overhaul) require prototypes/comparisons and Mark's sign-off before locking.

---

## 3. Theme System & Palette Direction

### Theme Behavior (Locked)
* **Default:** Follow system preference (`prefers-color-scheme`) on initial load.
* **Manual Override:** Provide a subtle, minimal Light / Dark toggle in `NavBar.tsx`, persisted in `localStorage` without flash-of-wrong-theme (FOUC).
* **Homepage (`/`):** Remains largely untouched during Phases 1–5 (keeping the existing dark `WaterShader` experience) until Phase 6's Hero Overhaul.

### Locked Color Palette (Phase 1)
Verified and locked across Light (**Sunlit White**) and Dark (**Stark Black**) modes in [app/globals.css](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/globals.css):

| Role | Light Mode — Sunlit White (*Nurture* Daylight) | Dark Mode — Stark Black (*Get Your Wish* Night) |
| :--- | :--- | :--- |
| **Canvas / Background** | `#fafcf9` | `#090909` |
| **Surfaces (Card / Elevated / Code)** | `#f2f6f1` / `#e7efe6` / `#f0f4ef` | `#131313` / `#1f1f1f` / `#131313` |
| **Primary Accent** | `#1f7a4c` (muted `#165c38`, subtle `#e7f3eb`, soft `#2e8b57`) | `#72e3a6` (muted `#4cd48c`, subtle `rgba(114, 227, 166, 0.1)`, soft `#a7f3d0`) |
| **Secondary Accents (Sky / Warning)** | `#2f5fa8` (`#edf3fb`) / `#9a5b13` (`#fbf4e8`) | `#89b0ff` (`rgba(137, 176, 255, 0.09)`) / `#ebb76c` (`rgba(235, 183, 108, 0.1)`) |
| **Text (Primary / Secondary / Muted / Subtle)** | `#161b17` / `#445047` / `#627066` / `#748278` | `#fafafa` / `#c9c9ce` / `#8a8a93` / `#696972` |
| **Borders (Default / Muted)** | `#dce5dc` / `#c2d1c4` | `#272727` / `#3b3b3b` |
| **Scribble Stroke** | `#26382c` at `0.16` opacity | `#ffffff` at `0.19` opacity |

### Locked UI Craft Decisions (Phases 1–5)
* **Light/Dark Toggle ([ThemeToggle.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/ThemeToggle.tsx)):** Borderless `h-9 w-9 rounded-lg` icon button in `NavBar.tsx` that lights up with `--color-surface-elevated` on hover (matching active nav pills) — no box border.
* **Code Blocks & Inline Code ([CodeElements.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/mdx/CodeElements.tsx) & [app/globals.css](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/globals.css)):** Borderless surface-filled containers (`border: none`) with crisp low-radius corners (`0.25rem` fenced blocks, `0.15rem` inline code) to avoid uneven subpixel corner borders. Double-clicking selects the full inline token or fenced code block cleanly, and fenced blocks include a subtle, borderless corner Copy button.
* **Photography & Thumbnail Framing — `Soft Lift` (`.photo-soft-lift` / `--shadow-photo` in [app/globals.css](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/globals.css)):** Borderless `rounded-[3px]` images with theme-aware ambient elevation instead of box borders or double-frame mats — a gentle contact shadow in Daylight (`0 1px 2px rgba(22,27,23,0.07), 0 6px 16px -6px rgba(22,27,23,0.14)`) and subtle dark elevation with a `3.5%` inner rim in Night (`0 4px 14px -4px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.035)`). Applied consistently to both `/about` personal photography and `Projects` thumbnails.
* **Translucent Theme-Matched Portal Lightbox ([PersonalPhotoStrip.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/PersonalPhotoStrip.tsx)):** Lightbox overlays render via `createPortal(..., document.body)` at `z-[100]` so they sit cleanly above `NavBar` (`z-20`) without navbar color dissonance, using a light translucent veil (`rgba(250, 252, 249, 0.56)` Daylight / `rgba(9, 9, 9, 0.62)` Night + `backdrop-blur-[3px]`) so the underlying site remains softly visible instead of wiping out the screen.
* **Optical Vertical Rhythm (`/about`):** `Timeline` items use `last:mb-0` so section spacing (`mt-8`) matches symmetrically around `Timeline` and `Projects`; `Projects` rows use `sm:items-center sm:min-h-[96px]` with `136×80` thumbnails so 1-line and 2-line project descriptions keep an identical vertical thumbnail cadence.

---

## 4. Typography — **Liner Notes** *(Locked — Phase 2)*

Inspired by the East Asian Mincho / Batang liner-note typography and clean technical metadata of Porter Robinson's *Nurture* era, wired via `next/font/google` in [app/layout.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/layout.tsx) and styled in [app/globals.css](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/globals.css):

* **Display & Headings (`--font-shippori` / `.font-heading`):** `Shippori Mincho` (`400`, `500`, `600`, `700`) — used at calm `500` medium weight (`tracking: 0.01em–0.015em`) for page titles (`2.2rem` on secondary routes, `1.95rem` on blog articles), section headings (`1.4rem` with a subtle `.section-heading` trailing hairline rule), and MDX blockquotes.
* **Body & UI (`--font-plex-sans` / `.font-body`):** `IBM Plex Sans` (`400`, `500`, `600`, `700`, normal + italic) — crisp, engineered grotesque for navigation (`15px`, `500`), timeline/project entries, and MDX prose (`0.96875rem`, `line-height: 1.74`).
* **Metadata & Code (`--font-plex-mono` / `.font-meta` / `font-mono`):** `IBM Plex Mono` (`400`, `500`, `tabular-nums`, `tracking: -0.01em`) — used quietly at `11.75px–12px` for Timeline dates, Blog timestamps, project tech stacks, `<Callout>` labels, inline code, and fenced code blocks.

---

## 5. Signature *Nurture* Motifs & Interaction Rules

### A. Procedural Scroll-Drawn Scribble (`ScrollDrawLine` + `generateOrganicPath`) — **Implemented Baseline**
* **Current Status:** Working and committed (`8fcc9af`) in [app/components/ScrollDrawLine.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/ScrollDrawLine.tsx) and [app/utils/generateOrganicPath.ts](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/utils/generateOrganicPath.ts).
* **Behavior:** Generates a fresh seeded *Nurture*-style scribble per refresh across four stroke personalities (`loose`, `crisp`, `whip`, `sharp`), draws smoothly with slow-then-fast catch-up easing, and uses a CSS `mask-image` to fade gently behind the centered `max-w-2xl` text column on narrower desktops.
* **Page Threshold Rule (Locked):** Only mount/render on secondary pages whose scrollable document height passes a meaningful threshold (e.g., `scrollHeight > innerHeight * 1.35`, such as `/about` and long `/blog/[slug]` posts). **Do not** render on short pages like `/blog` index or `/contact`, and never on `/`.
* **Completed Upgrades (Phases 1 & 3):** Theme-aware Light/Dark stroke color (Phase 1), automatic document height-threshold gating (`scrollHeight > innerHeight * 1.35` via `ResizeObserver`), and `prefers-reduced-motion` support (Phase 3).

### B. Secondary-Page Atmosphere & Interactivity — **Locked: Clean / Restraint-First (Phase 3)**
After live comparison across 5 candidates (`Clean`, `Raw Trail`, `Ink Echo`, `Hover Ink`, and `Paper & Motes`), Mark locked **Clean (`ScrollDrawLine` only)**:
* **No global cursor trail (`MouseTrail` cut)** and no ambient click marks, floating motes, or canvas overlays on secondary routes.
* `ScrollDrawLine` stands alone as the signature kinetic *Nurture* background motif on tall secondary pages (`/about` and long `/blog/[slug]` articles), preserving crisp reading focus and effortless scannability.

### C. Theme-Matched Personal Photography (`PersonalPhotoStrip`) — **Locked (Phase 4)**
After prototyping 6 layouts live with Mark's real photos (`Margin Prints`, `Single Print`, `3-Up Strip`, `Peek Anchors`, `Liner Notes`, and `Horizon Slice`) and 6 edge/border treatments, Mark locked a clean **inline 3-photo strip** in [app/components/PersonalPhotoStrip.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/PersonalPhotoStrip.tsx):
* **Theme-Matched Sets (`public/images/personal/`):**
  * **Daylight (Light Mode):** Empire State Building (`light-01-empire-state.jpg`) → sunlit greenery & glass tower (`light-02-sunlit-skyline.jpg`, centre) → floating convenience store on water (`light-03-floating-convenience.jpg`).
  * **Night (Dark Mode):** Rainy NYC street reflections (`dark-01-night-street.jpg`) → illuminated dachshund storefront sign (`dark-02-machi-dog.jpg`, centre) → blue/gold concert confetti (`dark-03-concert-confetti.jpg`).
* **Presentation:** 3-column horizontal `aspect-[4/3]` strip right below the `/about` intro line (`mt-5`), **caption-free** (no index numbers or filenames), framed with **Soft Lift** (`.photo-soft-lift`), subtle `scale-[1.02]` hover, and click-to-inspect translucent portal lightbox. Works identically across desktop and mobile.

---

## 6. Route-by-Route Specification

Strictly preserve the existing 4 routes:

### 1. Home (`/`) — [app/page.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/page.tsx)
* **Current Scope (Phases 1–5):** Keep largely untouched — existing `WaterShader` canvas, centered greeting, short bio line, Resume / LinkedIn / GitHub icon links, and "play with the shader" controls. Apply at most minor cleanup if needed for layout consistency.
* **Future Scope (Phase 6 — TBD):** Full *Nurture*-inspired Hero Overhaul. Intentionally deferred so secondary pages, theming, and visual craft are nailed first.

### 2. About (`/about`) — [app/components/AboutSection.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/AboutSection.tsx)
* **Content Structure:** Keep the clean minimalist flow (`About` header → short intro → theme-matched 3-photo strip → `Timeline` → `Projects`).
* **Visual Layer:** Theme-aware, height-gated `ScrollDrawLine` + [PersonalPhotoStrip.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/PersonalPhotoStrip.tsx) with **Soft Lift** elevation and translucent portal lightbox.
* **`Timeline` ([Timeline.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/Timeline.tsx)):** Crisp left accent rail, semantic Light/Dark tokens, tabular mono dates, and `last:mb-0` so section spacing stays symmetric.
* **`Projects` ([Projects.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/Projects.tsx)) — Locked (Phase 5):**
  * Clean vertical list with visible `136×80` **Soft Lift** thumbnails (responsive `16:9` on mobile), `sm:items-center sm:min-h-[96px]` uniform vertical cadence, filled Quiet Ink SVG hover underlines (`.project-ink-underline`), and calm dot-separated `IBM Plex Mono` tech metadata.

### 3. Blog (`/blog` & `/blog/[slug]`) — [app/blog/page.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/blog/page.tsx)
* **Content Structure:** Keep the minimalist post list and MDX article reader. Do not add search/filter widgets unless Mark requests them later.
* **Visual Layer:** Semantic Light/Dark tokens for list dividers, hover states, MDX prose, `<Callout>` notes, interactive React embeds, blockquotes, and borderless code blocks (dual-theme `rehype-highlight`, double-click selection, and corner Copy button). `ScrollDrawLine` is active on tall `/blog/[slug]` articles (automatically height-gated and reduced-motion aware).

### 4. Contact (`/contact`) — [app/contact/page.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/contact/page.tsx)
* **Content Structure:** Keep the clean email display and Website Credits link (fixing the existing `"website repostitory"` typo). No contact form, no fake coordinates.
* **Visual Layer:** Clean semantic Light/Dark tokens only. No `ScrollDrawLine` (page is below height threshold) and no cursor effects.

### Shared Chrome (`NavBar` & `Footer`)
* **[NavBar.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/NavBar.tsx):** Keep the centered spring-pill navigation (`Home`, `About`, `Blog`, `Contact`) + add a subtle, unobtrusive Light/Dark toggle button.
* **[Footer.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/Footer.tsx):** Remains hidden on `/`; update divider, tooltips, SVG icon contrast (for Light + Dark), and copyright text to semantic tokens.

---

## 7. Phased Execution Roadmap

### Completed Baseline
* [x] Rebased `project-nurture` cleanly onto `main` (`b03a07c`).
* [x] Built procedural RNG scroll-draw scribble with 4 stroke personalities and CSS `mask-image` content-column fade ([ScrollDrawLine.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/ScrollDrawLine.tsx), [generateOrganicPath.ts](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/utils/generateOrganicPath.ts), commit `8fcc9af`).

### Phase 1 — Dual-Theme Foundation & Semantic Tokens *(Completed)*
* [x] Implemented `prefers-color-scheme` theme provider with zero-FOUC initialization and a borderless hover-pill Light/Dark toggle in `NavBar.tsx`.
* [x] Locked CSS custom property tokens in [app/globals.css](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/globals.css) for Light (**Sunlit White** `#fafcf9` + *Nurture* meadow green) and Dark (**Stark Black** `#090909` + restrained green/sky accents).
* [x] Replaced hardcoded dark-only Tailwind colors across `NavBar`, `Footer`, `Timeline`, `Projects`, `Blog`, `Contact` (fixing the `"website repostitory"` typo), and `not-found`.
* [x] Added dual Light/Dark `rehype-highlight` code styles, borderless low-radius code containers with double-click selection & corner copy button, `<Callout>` + interactive MDX sandbox post, and theme-aware `ScrollDrawLine` on `/about` and `/blog/[slug]`.

### Phase 2 — Typography Research & Refinement *(Completed — Liner Notes)*
* [x] Researched *Nurture*-era typography and prototyped 5 interactive drafts (`Baseline Refined`, `Liner Notes`, `Sunlit Journal`, `Photobook Spread`, `nurtu.re Interface`) across `/about`, `/blog/[slug]`, `/blog`, and `/contact` in both Daylight and Night themes.
* [x] Locked **Liner Notes** (`Shippori Mincho` + `IBM Plex Sans` + `IBM Plex Mono`) in [app/layout.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/layout.tsx) and [app/globals.css](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/globals.css) — unifying secondary-page H1/H2 scale, medium `500` display weights, hairline section rules, tabular mono dates/metadata, and MDX prose rhythm.

### Phase 3 — Secondary-Page Atmosphere & Interactivity Exploration *(Completed — Clean / `ScrollDrawLine` Only)*
* [x] Upgraded [ScrollDrawLine.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/ScrollDrawLine.tsx) with automatic page-height threshold gating (`scrollHeight > innerHeight * 1.35` via `ResizeObserver`) and `prefers-reduced-motion` support.
* [x] Prototyped and compared 5 atmosphere/interactivity directions live (`Clean`, `Raw Trail`, `Ink Echo`, `Hover Ink`, `Paper & Motes`).
* [x] Locked **Clean (`ScrollDrawLine` only)** — intentionally cutting `MouseTrail` and extra cursor/ambient overlays to keep secondary pages calm and focused.

### Phase 4 — `/about` Personal Presence & Photography *(Completed — Theme-Matched 3-Up Strip)*
* [x] Prototyped 6 personal-presence layouts and 6 edge/border treatments live with Mark's real Daylight and Night photography.
* [x] Locked [PersonalPhotoStrip.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/PersonalPhotoStrip.tsx) with curated Light & Dark 3-photo sets (`public/images/personal/`), caption-free `aspect-[4/3]` strip, **Soft Lift** borderless elevation (`.photo-soft-lift`), and a translucent theme-matched portal lightbox (`createPortal` at `z-[100]`).

### Phase 5 — `/about` Projects Section Redesign *(Completed — Quiet Ink + Soft Lift)*
* [x] Replaced rainbow tech pills with quiet dot-separated `IBM Plex Mono` metadata and replaced the jumpy floating hover image with inline `136×80` **Soft Lift** thumbnails in [Projects.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/Projects.tsx).
* [x] Added Quiet Ink SVG hover underlines (`.project-ink-underline`) and balanced vertical cadence (`sm:items-center sm:min-h-[96px]` on `Projects` rows + `last:mb-0` on `Timeline` items).

### Phase 6 — Homepage (`/`) *Nurture* Hero Overhaul *(Future Scope — TBD)*
* Dedicated design & brainstorming phase for drastically reimagining `/` in the *Nurture* spirit once Phases 1–5 are complete.

### Pre-Launch QA & Cleanup
* Verify Light + Dark contrast (>= 4.5:1), responsive behavior (320px mobile → 1440px+ ultrawide), and `prefers-reduced-motion` across all 4 routes.
* Run `npm run build` with zero lint/type/build errors.
* Clean up the obsolete `warp-luna-surges-15h41` worktree (reference `MouseTrail.tsx` evaluated and cut in Phase 3).

---

## 8. Guidelines for AI Agents & Developers

1. **Read `design.md` before coding** — honor all locked rules and anti-patterns in Sections 1–6.
2. **Work one phase at a time** — do not jump ahead into Open Exploration or Future Scope phases without asking Mark.
3. **Keep components modular** under `app/components/` and utilities under `app/utils/`.
4. **Do NOT run `npm run build` (or chained `npm run lint && npm run build`) while a `next dev` server is running** — `next build` overwrites `.next/` underneath the active dev server and breaks live previewing until restarted. During active iteration, verify TypeScript cleanly with `npx tsc --noEmit` (which never touches `.next/`); save `npm run lint` / `npm run build` for explicit phase sign-off or when no dev server is running.

---

*Revised: November 2026*
