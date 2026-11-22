# Project Nurture — Design System & Master Blueprint

`project-nurture` is the design system and master specification for **Mark Peng's personal website and portfolio** ([markpeng.me](https://markpeng.me)).

This document serves as the **single source of truth** for all visual design, typography, layout structures, component architecture, and content guidelines. Any AI agent or developer working on this codebase MUST consult and adhere to this blueprint.

---

## 1. Project Vision & Core Purpose

* **Target Audience:** Technical recruiters, engineering managers, software peers, and design/music enthusiasts.
* **Core Goal:** Present Mark Peng's work, experience, essays, and contact information with extreme clarity and professionalism while delivering an expressive, memorable visual identity.
* **Balance Principle:** **Heavy Theme, High Clarity.** The visual aesthetic is expressive and distinct, but content hierarchy, typography contrast, and recruiter scannability MUST NEVER be compromised or obstructed by decorative elements.

---

## 2. Visual Aesthetic: Porter Robinson "Nurture" Era

The visual identity is directly inspired by Porter Robinson’s *Nurture* (2021) album design language created in collaboration with graphic designer Samuel Burgess-Johnson.

### Nature vs. Technology (Organic + Digital Synthesis)
* **Organic Elements:** Lush spring/electric greens, sun-drenched ambient light, soft natural gradients, atmospheric blur, and grounded layout flow.
* **Digital Overlay Artifacts:** Fine vector coordinate frame lines, pixelated scribbles/doodles in margins, monospace metadata tags (`36° 8′ 0″ N`), micro UI labels, floating technical badges, and delicate glowing glass card overlays.
* **Mood:** Hopeful, sunlit, introspective, precise, and human.

---

## 3. Page Structure & Route Mapping

The website consists strictly of the existing 4 primary routes. **No routes shall be added or deleted without explicit approval.**

1. **Home (`/`)**: 
   * **Hero Section ("Hero as Thesis"):** High-impact introductory statement blending bold clean typography with *Nurture* coordinate overlays and sunlit ambient glow.
   * **Featured Projects Grid:** Recruiter-friendly project cards showing project title, quick summary, key tech stack tags, impact stats, and direct links (GitHub / Live Demo).
   * **Latest Writing & Field Notes:** Highlighted essays and quick updates.
2. **About (`/about`)**:
   * **Bio & Background:** Clear, human narrative of Mark's journey as a Software Engineer.
   * **Technical Skills & Stack:** Categorized grid of languages, frameworks, tools, and platforms.
   * **Experience Timeline:** Clean chronological work/education history with key achievements.
   * **Influences & Field Notes:** Personal interests, music, and creative philosophy.
3. **Blog (`/blog`)**:
   * **Essays & Articles List:** Searchable/filterable list of MDX posts with publication dates, tags, and estimated read times.
   * **Article Renderer:** High-legibility reader view with customized code syntax highlighting, callout blockquotes, and Nurture margin details.
4. **Contact (`/contact`)**:
   * **Direct Contact:** Quick message form and direct email link.
   * **Nurture Coordinates Widget:** Ambient coordinate footer stamp (`36° 8′ 0″ N, 115° 9′ 0″ W`).

---

## 4. Design Tokens & Palette

### Color System
| Token Name | Hex / Value | Description & Usage |
| :--- | :--- | :--- |
| `--color-background` | `#0d110e` | Deep obsidian-forest dark background |
| `--color-surface` | `#141a16` | Card & container surface |
| `--color-surface-elevated` | `#1c241e` | Hover state surface & modal overlay |
| `--color-primary` | `#4ade80` | Vibrant spring green (buttons, active indicators, hero highlights) |
| `--color-primary-muted` | `#22c55e` | Medium foliage green (subtle borders, icon accents) |
| `--color-primary-subtle` | `#166534` | Dark green background tint |
| `--color-primary-soft` | `#dcfce7` | Soft mint green text highlight & light badges |
| `--color-sunlight` | `#fef08a` | Warm sun-drenched accent yellow (subtle glow) |
| `--color-text-primary` | `#f9fafb` | Primary high-contrast text |
| `--color-text-secondary` | `#d1d5db` | Secondary body text |
| `--color-text-muted` | `#9ca3af` | Metadata & caption text |
| `--color-text-mono` | `#86efac` | Light green monospace coordinate & code text |
| `--color-border` | `rgba(74, 222, 128, 0.18)` | Subtle translucent green border |
| `--color-border-hover` | `rgba(74, 222, 128, 0.45)` | Elevated hover border with glow |

### Glassmorphism & Ambient Glow
* **Glass Container:** `background: rgba(20, 26, 22, 0.75); backdrop-filter: blur(12px); border: 1px solid var(--color-border);`
* **Nurture Glow:** `box-shadow: 0 0 30px rgba(74, 222, 128, 0.12);`

---

## 5. Typography System

| Role | Font Family | Usage |
| :--- | :--- | :--- |
| **Display / Headlines** | `Inter`, `Outfit`, or system-ui sans | `h1`, `h2`, `h3` section titles (bold, clean, high scannability) |
| **Body Text** | `Inter`, system-ui sans | Paragraphs, bio text, project descriptions, blog copy |
| **Nurture Metadata & Code** | `JetBrains Mono`, `Space Mono`, or `ui-monospace` | Coordinates (`36° 8' 0" N`), date stamps, tech tags, code blocks |

### Type Hierarchy Rules
* **H1 (Hero):** `text-4xl sm:text-5xl lg:text-6xl`, tracking tight, font-bold, with green/sunlight gradient accents.
* **H2 (Section Header):** `text-2xl sm:text-3xl`, font-semibold, paired with a small monospace eyebrow label (e.g. `[ 01 // PROJECTS ]`).
* **H3 (Card Title):** `text-xl`, font-semibold, primary text color.
* **Body:** `text-base`, `line-height: 1.6`, secondary text color for optimal readability.
* **Metadata / Coordinates:** `text-xs font-mono tracking-widest text-green-accent/80 upper-case`.

---

## 6. Recruiter & Usability Guardrails

To ensure recruiters can immediately locate critical candidate information in < 15 seconds:
1. **Top Navigation Bar:** Persistent, clean navbar containing links to Home, About, Blog, Contact, plus a prominent "Resume / GitHub" action.
2. **Project Summaries:** Every project card MUST feature:
   * Project Title & One-line elevator pitch.
   * Key Technologies used (e.g. `React`, `TypeScript`, `Next.js`, `Python`).
   * Measurable Impact / Key features.
   * External links: `[ GitHub Repo ]` and `[ Live Demo ]`.
3. **Contact Information:** Clear, un-obscured email and social links on both `/contact` and footer.
4. **Mobile Responsiveness:** Layouts collapse gracefully down to 320px screens. Tap targets are at least 44px height.
5. **Accessibility (a11y):** Color contrast ratio >= 4.5:1 for body text, visible focus outlines on interactive controls, and `prefers-reduced-motion` compliance.

---

## 7. Signature Nurture Decorative Elements

When building components, use these signature decorative elements to infuse the *Nurture* visual identity without cluttering content:

1. **Digital Frame Margins:** Hairline corner brackets (`+` or `┌ ┐`) on key cards and hero sections.
2. **Floating Coordinates Tag:** Monospace coordinate badge (e.g. `36° 08′ 00″ N — 115° 09′ 00″ W`) pinned subtly in section headers or footers.
3. **Pixel Doodle Accents:** Subtle inline SVG pixel stars, leaves, or sunburst icons in section dividers.
4. **Sunlight Ambient Backdrop:** Soft radial gradient blurs (`bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-transparent to-transparent`) behind hero elements.

---

## 8. Guidelines for AI Agents & Developers

When making changes to this codebase:
* **Check `design.md` First:** Maintain consistency with all color tokens, font rules, and route boundaries.
* **No Unnecessary Routing Changes:** Keep `/`, `/about`, `/blog`, `/contact`.
* **Component Modularity:** Place reusable components under `app/components/` (e.g. `NavBar.tsx`, `Footer.tsx`, `ProjectCard.tsx`, `NurtureBadge.tsx`).
* **Test Build & Visual Quality:** Always run `npm run build` or test commands to verify zero build or lint failures after edits.

---

*Last Updated: July 2026*
