# **[markpeng.me](https://markpeng.me)**

My personal website built with [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), and [Three.js](https://threejs.org).

## Design System & Hero Spec

* [design.md](./design.md) — visual tokens, Liner Notes typography, route specs, and design principles (inspired by Porter Robinson's *Nurture* daylight & *Get Your Wish* night aesthetics).
* [hero.md](./hero.md) — dual-world WebGL2 hero architecture (sunlit botanical meadow ↔ obsidian mirror water stage, pre-warmed GPU crossfade compositor, and mobile/iOS Safari engineering).

## Stack

* **Framework & Styling:** [Next.js](https://nextjs.org) (App Router), [React](https://react.dev), [Tailwind CSS](https://tailwindcss.com), TypeScript
* **Hero Graphics:** Native WebGL2 via imperative [Three.js](https://threejs.org) custom GLSL shaders & ping-pong `HalfFloat` FBO physics (spring-field grass + shallow-water wave PDE)
* **Motion:** Pure CSS `@keyframes`, RK4-integrated CSS `linear()` springs, and Web Animations API FLIP transitions
* **Blog:** MDX rendered via `next-mdx-remote` with `remark-gfm` and `rehype-highlight`

## Credits

* Layout minimalism inspired by [phillipche.com](https://www.phillipche.com/).
* Original v1 water ripple exploration drew from [Shadertoy `wdtyDH`](https://www.shadertoy.com/view/wdtyDH), [this Three.js tutorial](https://www.youtube.com/watch?v=DncmUVn1Yfg), and [this FBO ping-pong write-up](https://www.thefrontdev.co.uk/workflow-from-shadertoy-to-react-three-fiber-r3f), which evolved into the current custom dual-world WebGL2 hero.
