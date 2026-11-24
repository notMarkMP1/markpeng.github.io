# Repository Notes for AI Agents

- **Design Spec:** Always read [design.md](./design.md) before making UI or layout changes and honor all locked decisions, anti-patterns, and phase boundaries.
- **Dev Server & Build Guardrail:** **Never run `npm run build` (or `npm run lint && npm run build`) while a local `next dev` server is running.** `next build` overwrites `.next/` underneath the active dev server and breaks HMR / chunk loading until Mark restarts it.
  - During active iteration, check types with `npx tsc --noEmit` (read-only, never touches `.next/`).
  - Only run `npm run lint` and `npm run build` when no dev server is active or when Mark explicitly asks for a production build check (e.g. before committing/shipping a phase).
