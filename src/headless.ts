import { Simulation } from "./sim/simulation";

const sim = new Simulation({
  width: 128, height: 128, cellSize: 1,
  ants: 150,
  evap: 0.015,
  diffuse: 0.06,
  depositFood: 0.03,
  depositHome: 0.02,
  senseAngle: Math.PI/6,
  senseDist: 5,
  turnRate: 0.25,
  moveSpeed: 0.6,
  nest: { x: 64, y: 1 },
  rngSeed: "headless",
  grassHeight: 8,
  energyDrain: 0.001,
  digCost: 0.002,
  spawnThreshold: 6,
  soldierRatio: 0.2
});

console.log("Headless sim starting…");
for (let i=0;i<1500;i++) {
  if (i===30) sim.world.addFoodCircle(20, sim.world.cfg.grassHeight-1, 4, 8);
  if (i===60) sim.world.addFoodCircle(90, sim.world.cfg.grassHeight-1, 5, 10);
  sim.step();
  if ((i%200)===0) {
    const totalFood = sim.world.pher.food.reduce((a,b)=>a+b,0);
    const totalHome = sim.world.pher.home.reduce((a,b)=>a+b,0);
    console.log(`step=${i} ants=${sim.ants.length} colonyFood=${sim.world.colonyFood.toFixed(1)} pher(food=${totalFood.toFixed(1)}, home=${totalHome.toFixed(1)})`);
  }
}
console.log("Done.");
