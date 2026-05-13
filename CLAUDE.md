# MultiCraft (Multiplication Craft)

A Minecraft-themed multiplication-table practice game. Single-page React app.

## Stack

- React 18 + Vite 5 (`@vitejs/plugin-react`)
- No router, no state library, no test runner, no linter
- All UI logic lives in [src/App.jsx](src/App.jsx); styles in [src/App.css](src/App.css) and [src/index.css](src/index.css)

## Run

```
npm install
npm run dev     # vite dev server
npm run build   # production build to dist/
npm run preview # serve the built bundle
```

## Game rules

- Board is square; size depends on difficulty (5×5 for `super`, 10×10 otherwise). Cell `(r, c)` corresponds to the product `(r+1) * (c+1)`.
- A token displays a target product. The player drags it onto a cell (desktop) or taps a cell (touch).
- Correct → cell fills, score +1.
- Wrong → the entire row AND column of the clicked cell are wiped (cleared back to empty).
- Timeout → question is skipped (no penalty beyond losing the chance to score).
- Win → every cell filled (25 in super easy, 100 otherwise); win screen with final score and difficulty.
- `DIFFICULTY` ([src/App.jsx](src/App.jsx)) controls seconds per question AND board size: `super: 20s / 5×5`, `easy: 20s / 10×10`, `medium: 14s / 10×10`, `hard: 7s / 10×10`.
- Hint: when timer drops to the yellow zone (`timePct ≤ 50`), one factor header (row label OR column label) of a matching empty cell glows. Never the answer cell itself.

## Code shape

- [src/App.jsx](src/App.jsx) — everything: `App` (state machine: `menu` → `playing` → `won`), `MenuScreen`, `WinScreen`, `Board`, `useIsTouchDevice`, and helpers `buildEmptyBoard`, `findEmptyCells`, `pickQuestion`.
- Board state is `boolean[10][10]` — `true` means filled. The displayed number is computed from indices, never stored.
- Next question is picked uniformly at random from empty cells (see `pickQuestion` at [src/App.jsx:29](src/App.jsx#L29)).
- Timer is a 100 ms `setTimeout` loop decrementing `timeLeft` by 0.1 ([src/App.jsx:245](src/App.jsx#L245)).
- Both drop-on-cell and click-on-cell go through `handleDrop` ([src/App.jsx:217](src/App.jsx#L217)).

## Styling

- Minecraft block aesthetic via `.mc-block` plus `bg-*` palette classes (`bg-dirt`, `bg-stone`, `bg-grass`, `bg-cobble`, `bg-diamond`, `bg-emerald`, `bg-redstone`, `bg-wood`, …). Palette is defined as CSS custom properties in [src/index.css](src/index.css).
- Feedback flashes (`flash-correct`, `flash-wrong`, `flash-timeout`) are toggled on the root `.game` element for ~450 ms after each answer.
