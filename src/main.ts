// (imports at the top)
import { Simulation } from "./sim/simulation";
import { PixiRenderer } from "./render/pixiRenderer";

// ---- config (top)
const sim = new Simulation({
  width: 256, height: 256, cellSize: 3,
  ants: 300,
  evap: 0.01,
  diffuse: 0.05,
  depositFood: 0.03,
  depositHome: 0.02,
  senseAngle: Math.PI / 6,
  senseDist: 6,
  turnRate: 0.25,
  moveSpeed: 0.6,
  nest: { x: 128, y: 11 },
  rngSeed: "demo",
  grassHeight: 12,
  energyDrain: 0.0012,
  digCost: 0.0020,
  spawnThreshold: 8,
  soldierRatio: 0.2,
});

// seed food on surface
sim.world.addFoodCircle(60,  sim.world.cfg.grassHeight - 1, 5, 12);
sim.world.addFoodCircle(200, sim.world.cfg.grassHeight - 1, 5, 12);

const renderer = new PixiRenderer(
  sim,
  sim.cfg.width * sim.cfg.cellSize,
  sim.cfg.height * sim.cfg.cellSize
);

// ---- boot (mid-file)
async function boot() {
  await renderer.init();

  const hudAntCount = document.getElementById("antCount");

  let last = performance.now();
  let acc = 0;
  const dt = 1000 / 60;

  function loop(now: number) {
    acc += now - last; last = now;
    while (acc >= dt) { sim.step(); acc -= dt; }
    renderer.draw();
    // live count of alive ants
    if (hudAntCount) hudAntCount.textContent = String(sim.ants.filter(a => a.alive).length);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // add food on canvas clicks
  const canvas = renderer.app.canvas as HTMLCanvasElement;
  canvas.addEventListener("pointerdown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / sim.cfg.cellSize);
    const y = Math.floor((e.clientY - rect.top) / sim.cfg.cellSize);
    if (x >= 0 && y >= 0 && x < sim.cfg.width && y < sim.cfg.height) {
      sim.world.addFoodCircle(x, y, 6, 10);
    }
  });
}

// ---- call boot (bottom)
boot();
