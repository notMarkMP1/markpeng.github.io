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
4. **No art obstructing text:** Scribbles, cursor trails, and margin photos must never reduce body contrast below WCAG AA (4.5:1) or collide unreadably with centered content on narrow viewports.
5. **No premature lock-in on TBD items:** Items marked **Open Exploration** (typography research, dark-mode black vs. blue balance, `/about` Projects redesign, future `/` hero overhaul) require prototypes/comparisons and Mark's sign-off before locking.

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

### Locked UI Craft Decisions (Phase 1)
* **Light/Dark Toggle ([ThemeToggle.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/ThemeToggle.tsx)):** Borderless `h-9 w-9 rounded-lg` icon button in `NavBar.tsx` that lights up with `--color-surface-elevated` on hover (matching active nav pills) — no box border.
* **Code Blocks & Inline Code ([CodeElements.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/mdx/CodeElements.tsx) & [app/globals.css](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/globals.css)):** Borderless surface-filled containers (`border: none`) with crisp low-radius corners (`0.25rem` fenced blocks, `0.15rem` inline code) to avoid uneven subpixel corner borders. Double-clicking selects the full inline token or fenced code block cleanly, and fenced blocks include a subtle, borderless corner Copy button.

---

## 4. Typography (Baseline + Open Research)

* **Current Working Baseline:** `Crimson Text` (editorial serif for headings) paired with `Inter` (clean sans-serif for body/UI), already wired in [app/layout.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/layout.tsx).
* **Why Serif Headings Stay in the Conversation:** Editorial serif typography aligns much more authentically with *Nurture* / *Get Your Wish* than generic sans-serif + cyberpunk monospace.
* **Open Exploration (Phase 2):** Font choices are **not** locked yet. Research and visually compare 2–3 curated pairings (e.g. `Crimson Text` refinements vs. `Newsreader`, `EB Garamond`, `Instrument Serif`, plus body sans and subtle caption/code fonts) directly against real page content in both Light and Dark modes before committing.

---

## 5. Signature *Nurture* Motifs & Interaction Rules

### A. Procedural Scroll-Drawn Scribble (`ScrollDrawLine` + `generateOrganicPath`) — **Implemented Baseline**
* **Current Status:** Working and committed (`8fcc9af`) in [app/components/ScrollDrawLine.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/ScrollDrawLine.tsx) and [app/utils/generateOrganicPath.ts](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/utils/generateOrganicPath.ts).
* **Behavior:** Generates a fresh seeded *Nurture*-style scribble per refresh across four stroke personalities (`loose`, `crisp`, `whip`, `sharp`), draws smoothly with slow-then-fast catch-up easing, and uses a CSS `mask-image` to fade gently behind the centered `max-w-2xl` text column on narrower desktops.
* **Page Threshold Rule (Locked):** Only mount/render on secondary pages whose scrollable document height passes a meaningful threshold (e.g., `scrollHeight > innerHeight * 1.35`, such as `/about` and long `/blog/[slug]` posts). **Do not** render on short pages like `/blog` index or `/contact`, and never on `/`.
* **Upgrades Needed (Phases 1 & 3):** Make stroke color theme-aware (Light + Dark), enforce the height threshold automatically, and respect `prefers-reduced-motion`.

### B. Personal Margin Photography (`/about`) — **Planned (Phase 4)**
* **Concept:** Real personal photos supplied by Mark (sharing glimpses of who he is — not generic stock nature photos) placed as quiet, framed prints in the wide outer desktop margins around the centered `/about` column (evolving Mark's earlier wireframe sketch).
* **Behavior:**
  * Crisp, restrained framing (no loud drop shadows or polaroid gimmicks).
  * Gentle scroll fade-in or subtle parallax drift.
  * Optional understated caption on hover.
  * **Responsive rule:** Only shown in the outer gutters when viewport width comfortably clears the centered `max-w-2xl` content column; hidden or cleanly collapsed on narrow/mobile screens so text is never crowded.

### C. Subtle Raw Cursor Trail (`MouseTrail`) — **Planned (Phase 3)**
* **Concept:** Unsmoothed, straight-segment hairline canvas trail that fades out organically over ~2.5–3.5s, evoking the raw hand-drawn linework of *Get Your Wish* (evolving the prototype in worktree `warp-luna-surges-15h41`).
* **Guardrails:**
  * Active on secondary routes (`/about`, `/blog`, `/contact`) — **never** on `/` (where `WaterShader` owns pointer interaction).
  * Desktop fine-pointer devices only (`(pointer: fine)`), automatically disabled on touch screens and when `prefers-reduced-motion: reduce` is set.
  * Theme-aware stroke color with restrained opacity so it feels atmospheric rather than distracting, and fades cleanly behind or lightly over empty space without impeding reading or clicking.

---

## 6. Route-by-Route Specification

Strictly preserve the existing 4 routes:

### 1. Home (`/`) — [app/page.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/page.tsx)
* **Current Scope (Phases 1–5):** Keep largely untouched — existing `WaterShader` canvas, centered greeting, short bio line, Resume / LinkedIn / GitHub icon links, and "play with the shader" controls. Apply at most minor cleanup if needed for layout consistency.
* **Future Scope (Phase 6 — TBD):** Full *Nurture*-inspired Hero Overhaul. Intentionally deferred so secondary pages, theming, and visual craft are nailed first.

### 2. About (`/about`) — [app/components/AboutSection.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/AboutSection.tsx)
* **Content Structure:** Keep the clean minimalist flow (`About` header → short intro → `Timeline` → `Projects`).
* **Visual Layer:** Theme-aware `ScrollDrawLine`, `MouseTrail`, and desktop outer-margin personal photos (Phase 4).
* **`Timeline` ([Timeline.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/Timeline.tsx)):** Preserve the crisp left accent rail and scannable company/role/date hierarchy; migrate hardcoded `text-gray-*` colors to semantic Light/Dark tokens.
* **`Projects` ([Projects.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/components/Projects.tsx)) — Open Exploration (Phase 5):**
  * **Known Pain Points:**
    1. ~~`text-zinc-700` descriptions have very poor contrast on dark backgrounds.~~ *(Fixed in Phase 1 with semantic `--color-text-secondary`.)*
    2. 15+ saturated rainbow Tailwind tech pills clash with a cohesive *Nurture* palette.
    3. Cursor-following floating image preview (`300x200`) is desktop-only and can feel jumpy.
  * **Exploration Options to Prototype in Phase 5:** (a) Refined minimal list with unified monochrome/accent tags and cleaner preview, (b) Editorial 2-column card grid with visible thumbnails & direct links, or (c) Hybrid compact list with inline expandable preview.

### 3. Blog (`/blog` & `/blog/[slug]`) — [app/blog/page.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/blog/page.tsx)
* **Content Structure:** Keep the minimalist post list and MDX article reader. Do not add search/filter widgets unless Mark requests them later.
* **Visual Layer:** Semantic Light/Dark tokens for list dividers, hover states, MDX prose, `<Callout>` notes, interactive React embeds, blockquotes, and borderless code blocks (dual-theme `rehype-highlight`, double-click selection, and corner Copy button). `ScrollDrawLine` is active on `/blog/[slug]` articles (with automatic height-threshold gating + `MouseTrail` arriving in Phase 3).

### 4. Contact (`/contact`) — [app/contact/page.tsx](file:///C:/Users/markm_4eetbmy/Documents/VisualStudio/projects/markpeng.github.io/app/contact/page.tsx)
* **Content Structure:** Keep the clean email display and Website Credits link (fixing the existing `"website repostitory"` typo). No contact form, no fake coordinates.
* **Visual Layer:** Semantic Light/Dark tokens + `MouseTrail`. No `ScrollDrawLine` (page is below height threshold).

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

### Phase 2 — Typography Research & Refinement *(Open Exploration)*
* Research and preview 2–3 *Nurture*-aligned typography pairings alongside the `Crimson Text` + `Inter` baseline in both Light and Dark modes.
* Lock final font choices, scale, tracking, and MDX prose rhythm with Mark's sign-off.

### Phase 3 — Secondary-Page Atmosphere (`MouseTrail` + Smart `ScrollDrawLine`)
* Upgrade `ScrollDrawLine` with automatic page-height threshold gating (`scrollHeight > innerHeight * 1.35`) and `prefers-reduced-motion` support, enabling it cleanly across tall secondary pages (`/about`, long `/blog/[slug]` articles).
* Port and refine `MouseTrail` (referencing the `warp-luna-surges-15h41` prototype): unsmoothed raw segments, theme-aware color, fine-pointer & reduced-motion guards, subtle opacity, non-home routes only.

### Phase 4 — Personal Margin Photography (`/about`)
* Design and build a reusable margin photo component (`MarginPhotos`) for desktop outer gutters with clean framing, gentle scroll parallax/fade, optional hover captions, and clean responsive hiding on narrow viewports.
* Start with placeholder slots and documented aspect-ratio/file conventions (`public/images/personal/...`) so Mark can drop in his own photos effortlessly.

### Phase 5 — `/about` Projects Section Exploration & Redesign *(Open Exploration)*
* Prototype 2–3 concrete layouts addressing contrast (`text-zinc-700`), rainbow tech pills, and mobile-friendly project previews.
* Review live in the browser with Mark, pick the winner, and finalize `Projects.tsx`.

### Phase 6 — Homepage (`/`) *Nurture* Hero Overhaul *(Future Scope — TBD)*
* Dedicated design & brainstorming phase for drastically reimagining `/` in the *Nurture* spirit once Phases 1–5 are complete.

### Pre-Launch QA & Cleanup
* Verify Light + Dark contrast (>= 4.5:1), responsive behavior (320px mobile → 1440px+ ultrawide), and `prefers-reduced-motion` across all 4 routes.
* Run `npm run build` with zero lint/type/build errors.
* Clean up the obsolete `warp-luna-surges-15h41` worktree once any desired reference code (`MouseTrail.tsx`) is migrated.

---

## 8. Guidelines for AI Agents & Developers

1. **Read `design.md` before coding** — honor all locked rules and anti-patterns in Sections 1–6.
2. **Work one phase at a time** — do not jump ahead into Open Exploration or Future Scope phases without asking Mark.
3. **Keep components modular** under `app/components/` and utilities under `app/utils/`.
4. **Verify after edits** — run `npm run build` to guarantee clean TypeScript compilation and static route generation.

---

*Revised: November 2026*
