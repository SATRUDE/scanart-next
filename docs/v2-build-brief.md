# V2 build brief (for every page build)

You're rebuilding pages of the Scandinavian Art shop (scanart-next, Next.js 16, Tailwind 4) to the V2 designs, in the worktree `~/scanart-worktrees/v2`, on branch `mark/scandinavian-art-v2`. The foundation is committed. Your job is the pages you are assigned, nothing else.

## Read first
- `AGENTS.md`: this Next.js has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code.
- `docs/v2-seo.md`: the SEO contract. It's launch-blocking. Every page keeps its metadata, canonical, hreflang, JSON-LD, H1, copy, internal links and image alt text. The rebuild changes how a page looks, never what it tells search.
- `~/brands/scandinavian-art/design-system.md` and `~/brands/scandinavian-art/layout.md`: the design rules.
- The existing page files you're replacing. Every comment in them records a decision, usually an SEO or accessibility one. Keep the logic and keep the comments that still apply.

## The design
- **Figma file:** `apSXGfJBvDNKOUGPfW9uHN`. Use the Figma MCP tools.
  - Load the `figma-design-to-code` guidance first (resource `skill://figma/figma-design-to-code/SKILL.md` on the Figma MCP), then use `get_design_context` on your frames, and `get_screenshot` for the visual target.
  - Adapt the returned code to this codebase. Never paste Figma asset URLs into code.
- **Masters:** the component masters live on the **Design system** page (Masters band, y ≥ 22900). Each master's description is the usage rule.

## The foundation (use it, don't duplicate it)
- **`app/globals.css`**, the tokens:
  - **Text styles:** one class per Figma text style: `type-display`, `type-h1`, `type-h2`, `type-h3`, `type-lead`, `type-body`, `type-small`, `type-label`, `type-caption`, `type-numeral`. Headings switch to the Mobile/* sizes below 834 px automatically.
  - **Breakpoints:** `tab:` (834) and `desk:` (1200). Mobile is the base.
  - **Colours:** `bg-bg`, `bg-surface`, `bg-image-bg` (#F7F1EC, behind every print), `text-ink`, `text-text-accent`, `bg-brand` (accent #B35D26), `border-line`, `border-ink`, `text-error`, `bg-scrim` and the season tints.
  - **Spacing tiers:** `gap-tight` 8, `gap-group` 24, `py-block` 64/48, `mt-section` 192/128/96, `px-margin`.
  - **Layout:** `page-x` (the 1440 frame with 80/48/20 margins) and `page-grid` (12/8/1 columns with the Figma gutters, so children use `col-span-*` at `desk:`).
  - **Hairline:** `hairline`, the 12 × 1 accent separator. It's never a dot.
- **`components/v2/ui.tsx`**:
  - `Button` (primary / secondary / link, optional price)
  - `TextLink`
  - `Hairline`, `Meta`, `Breadcrumb`
  - `PageHeader` (renders the page's H1)
  - `SectionHeader`
  - `Question` (native `<details>`, so answers are in the HTML)
  - `ListItem`
  - `ContentSection`, `ContentBody`
  - `LinkRow`, `FactRow`, `IndexRow`
- **`components/PrintCard.tsx`** is the V2 print tile. Its aspect ratio follows the print size (50×50 square, 50×70 tall 5:7). Callers wrap it in the product link.
- **`components/LandingCrossLinks.tsx`** is the V2 "Explore the shop" block. Pass `artists` from `lib/published-artists.ts` for the artist column.
- **Header, Footer and SearchOverlay** are done. Don't edit them unless you're the agent assigned to them.

## Rules
- **Shared files.** Don't edit shared components (`components/v2/ui.tsx`, `PrintCard`, `LandingCrossLinks`, `Header`, `Footer`, `globals.css`). If one can't express your design, say so in your final report, with the exact change you need. Put page-specific components in `components/v2/<area>/`.
- **Norwegian.** Every page you change has a Norwegian twin under `app/(no)/no/...`. Rebuild both, in the same change.
  - New English copy goes where that page's copy lives today (the page file, `lib/*.ts` config, or `lib/i18n.ts`).
  - Its Norwegian goes in `lib/i18n/no.ts` (or next to the existing Norwegian copy for that page).
  - No English strings on /no pages. Literal `aria-label`s must come from `chromeAria` (a test enforces it).
- **Copy.**
  - Use the V2 design's copy where it differs, but never invent facts: prices, delivery times, claims, reviews.
  - Real product, artist and price data always comes from the existing data layer (`lib/products.ts`, `data/artists.ts`, `config/priceCategories.ts`, `lib/pricing.ts`).
  - British English, no em dashes, no exclamation marks, and no eyebrow/kicker lines above headlines.
- **Images.**
  - Use `SmartImage` / next/image for grids and cards, never a raw `<img>`.
  - Keep the preload rules and alt-text helpers from the contract.
  - No new generated images, ever. Crops and composites of existing files only; anything new is a ChatGPT prompt for Mark, written in your report.
- **Server components by default.** Client components only where there's real interaction. Keep pages statically renderable (don't read `headers()` / `cookies()` in pages).
- **Motion.** Motion respects `prefers-reduced-motion`. Heavy things (WebGL, video) load lazily, below a server-rendered still image.
- **Git.** Don't commit or push, and don't run `next build`: it clobbers the dev server's `.next`. The main session commits.
- **Dev server.** It's already running at http://localhost:3100 (hot reload). Don't start another.

## Verify before you report
1. `npx tsc --noEmit` is clean, and `npx vitest run --project unit` passes. If a test encodes behaviour you changed on purpose, update it and say why. Never weaken an SEO test.
2. **Screenshots.** `node scripts/v2/shoot.mjs <path> <outprefix>` gives you desktop 1440 and mobile 390 full-page shots. Compare them with the Figma frames and fix mismatches: spacing, type, rules, image ratios. Look at them; don't assume.
3. **SEO.** For each of your routes, `curl -s localhost:3100<path>` and check title, meta description, canonical, hreflang, robots, JSON-LD types, a single H1 with the contract's text, the landing copy present, and internal links present. Compare against production (`https://www.scandinavianart.co.uk<path>` with a Googlebot user-agent) and list every difference in your report.
4. Check the /no twin the same way.

## Final report
- files changed
- routes done, EN and NO
- anything in the design you couldn't do and why
- shared-component changes you need
- SEO diff results
- screenshot paths
- open questions for Mark
