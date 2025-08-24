import { Simulation } from "./sim/simulation";
import { PixiRenderer } from "./render/pixiRenderer";

const sim = new Simulation({
  width: 256, height: 256, cellSize: 3,
  ants: 300,
  evap: 0.01, diffuse: 0.05,
  depositFood: 0.03, depositHome: 0.02,
  senseAngle: Math.PI/6, senseDist: 6,
  turnRate: 0.25, moveSpeed: 0.6,
  nest: { x: 128, y: 1 },
  rngSeed: new URLSearchParams(location.search).get("seed") ?? "demo",
  grassHeight: 12, energyDrain: 0.0012, digCost: 0.0020,
  spawnThreshold: 8, soldierRatio: 0.2,
  // homes: [{x:80,y:11},{x:176,y:11}], // optional multi-home
});

sim.world.addFoodCircle(60,  sim.world.cfg.grassHeight-1, 5, 12);
sim.world.addFoodCircle(200, sim.world.cfg.grassHeight-1, 5, 12);

const renderer = new PixiRenderer(sim, sim.cfg.width*sim.cfg.cellSize, sim.cfg.height*sim.cfg.cellSize);

async function boot() {
  await renderer.init();

  const hudAntCount = document.getElementById("antCount");
  const hudHabitat = document.getElementById("habitatSize");
  let last = performance.now(), acc = 0;
  const dt = 1000/60;

  function loop(now: number) {
    acc += now - last; last = now;
    while (acc >= dt) { sim.step(); acc -= dt; }
    renderer.draw();
    if (hudAntCount) hudAntCount.textContent = String(sim.ants.filter(a=>a.alive).length);
    if (hudHabitat) hudHabitat.textContent = String(sim.world.habitatCells);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  (renderer.app.canvas as HTMLCanvasElement).addEventListener("pointerdown", (e)=>{
    const rect = (renderer.app.canvas as HTMLCanvasElement).getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left)/sim.cfg.cellSize);
    const y = Math.floor((e.clientY - rect.top)/sim.cfg.cellSize);
    if (x>=0 && y>=0 && x<sim.cfg.width && y<sim.cfg.height) sim.world.addFoodCircle(x,y,6,10);
  });
}
boot();
