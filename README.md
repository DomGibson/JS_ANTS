# Ant Simulator — TypeScript + PixiJS

A clean, ready‑to‑run clone of the classic ant pheromone simulation, implemented in TypeScript with a PixiJS renderer and a headless CLI entry. The simulation code is decoupled from rendering so you can run it in Node or the browser.

## Quick start

```bash
# 1) Install
npm i

# 2) Run dev server (Vite)
npm run dev

# 3) Build production
npm run build && npm run preview

# 4) Optional: run headless sim in Node (no graphics)
npm run headless
```

Open the browser dev server (Vite will open for you) and click anywhere on the canvas to add food. The HUD shows the current ant count, the size of the dug habitat, and a hint.

## Project structure

```
src/
  main.ts                 # browser entry (boots sim + Pixi renderer)
  headless.ts             # node/CLI entry for non-visual runs
  sim/
    types.ts
    rng.ts
    ant.ts
    pheromones.ts
    world.ts
    simulation.ts
  render/
    pixiRenderer.ts
public/
  index.html
```

## Controls
- **Click**: add a food pile.
- Everything else is emergent: ants explore, discover food, return to nest, and build trails via pheromones (food=red, home=green).

## Tuning
Open `src/main.ts` and tweak the `Simulation` config: evaporation, diffusion, ant count, speeds, etc. The grid is 256×256 by default (scaled to pixels with `cellSize`).

## Notes
- Renderer is PixiJS v8. We draw pheromone fields to an offscreen canvas and update a texture each frame (efficient + simple). Ants render batched as rect points.
- The sim uses a fixed‑timestep loop inside the requestAnimationFrame tick for stability.
- Everything in `/sim` is headless and can run in a Web Worker later for big ant counts.

## Inspiration
- C++ Rendition from Pezzza's Work
https://www.youtube.com/@PezzzasWork
