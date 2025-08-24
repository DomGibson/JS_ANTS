import { Ant, Role, WorldConfig, Enemy, Cell } from "./types";
import { World } from "./world";

const PICKUP_BURST = 10;
const TRAIL_FALLOFF_STEPS = 120;
const LOST_THRESHOLD = 0.0025;

type WorkerState = { sincePickup: number };
const workerState = new WeakMap<Ant, WorkerState>();

function rand(world: World) {
  const rng = (world as any).sim?.rng;
  return rng ? rng.next() : Math.random();
}

export function makeQueen(spawn:{x:number;y:number}): Ant {
  return { p:{...spawn}, a:Math.PI/2, role:Role.QUEEN, carrying:false, energy:1, age:0, alive:true, settled:false };
}

export function makeWorker(spawn:{x:number;y:number}, angle:number = Math.random()*Math.PI*2): Ant {
  return { p:{...spawn}, a:angle, role:Role.WORKER, carrying:false, energy:1, age:0, alive:true };
}

export function makeWorkers(n:number, spawn:{x:number;y:number}, randAngle:()=>number = ()=>Math.random()*Math.PI*2): Ant[] {
  const ants: Ant[] = [];
  for (let i=0; i<n; i++) ants.push(makeWorker(spawn, randAngle()));
  return ants;
}

export function makeSoldier(spawn:{x:number;y:number}, angle:number = Math.random()*Math.PI*2): Ant {
  return { p:{...spawn}, a:angle, role:Role.SOLDIER, carrying:false, energy:1, age:0, alive:true };
}

// Helpers
function pher(a: Ant, world: World, field:"food"|"home", dir:number, cfg: WorldConfig){
  const d = cfg.senseDist;
  const sx = Math.round(a.p.x + Math.cos(a.a + dir)*d);
  const sy = Math.round(a.p.y + Math.sin(a.a + dir)*d);
  if(!world.inBounds(sx,sy)) return 0;
  return (field==="food" ? world.pher.food : world.pher.home)[world.idx(sx,sy)];
}

function steerAnt(a:Ant, world:World, cfg:WorldConfig, following:"food"|"home"){
  const L = pher(a, world, following, -cfg.senseAngle, cfg);
  const M = pher(a, world, following, 0,               cfg);
  const R = pher(a, world, following, +cfg.senseAngle, cfg);
  let turn = 0;
  if (L>R && L>M) turn = -cfg.turnRate;
  else if (R>L && R>M) turn = +cfg.turnRate;
  else if (Math.max(L,M,R) < LOST_THRESHOLD) turn = (world as any).sim?.rng?.range?.(-1,1) ?? (rand(world)*2-1);
  a.a += turn * 0.85 + ((rand(world)*2-1)*0.15*cfg.turnRate);
}
function tryMoveOrDig(a:Ant, world:World, cfg:WorldConfig, nx:number, ny:number){
  const bx = Math.max(0, Math.min(world.cfg.width-1, nx));
  const by = Math.max(0, Math.min(world.cfg.height-1, ny));
  const tile = world.tileAt(bx|0, by|0);
  const walkable = world.isWalkable(bx|0, by|0);
  if (walkable) {
    a.p.x = bx; a.p.y = by;
  } else if (tile === Cell.DIRT || tile === Cell.GRASS) {
    if (a.role !== Role.SOLDIER) {
      world.dig(bx|0, by|0);
      a.energy -= cfg.digCost;
      a.p.x = bx; a.p.y = by;
    } else {
      a.a += (rand(world)-0.5)*Math.PI;
    }
  } else {
    a.a += (rand(world)-0.5)*Math.PI;
  }
}

function depositWithFalloff(a:Ant, world:World, carrying:boolean, cfg:WorldConfig){
  const s = workerState.get(a) ?? { sincePickup: TRAIL_FALLOFF_STEPS };
  if (!workerState.has(a)) workerState.set(a, s);

  const cx = a.p.x|0, cy = a.p.y|0;
  if (!carrying) {
    world.pher.deposit(cx, cy, cfg.depositHome, "home");
  } else {
    const t = s.sincePickup;
    const falloff = Math.max(0, 1 - t / TRAIL_FALLOFF_STEPS);
    world.pher.deposit(cx, cy, cfg.depositFood * (0.25 + 0.75*falloff), "food");
    s.sincePickup++;
  }
}

function stepWorker(a:Ant, world:World, cfg:WorldConfig){
  const st = workerState.get(a) ?? { sincePickup: TRAIL_FALLOFF_STEPS };
  if (!workerState.has(a)) workerState.set(a, st);

  steerAnt(a, world, cfg, a.carrying ? "home" : "food");

  const nx = a.p.x + Math.cos(a.a)*cfg.moveSpeed;
  const ny = a.p.y + Math.sin(a.a)*cfg.moveSpeed;
  tryMoveOrDig(a, world, cfg, nx, ny);

  const cx = a.p.x|0, cy = a.p.y|0;
  if (!a.carrying) {
    const grabbed = world.takeFood(cx,cy, 0.5);
    if (grabbed > 0) {
      a.carrying = true;
      st.sincePickup = 0;
      world.pher.deposit(cx, cy, cfg.depositFood * PICKUP_BURST, "food");
    }
  } else {
    const homes = (world as any).sim?.homes ?? [world.cfg.nest];
    const nearHome = homes.some(h => (h.x-cx)*(h.x-cx)+(h.y-cy)*(h.y-cy) <= 4);
    if (nearHome) {
      a.carrying = false;
      world.colonyFood += 1;
      a.energy = Math.min(1, a.energy + 0.6);
    }
  }
  depositWithFalloff(a, world, a.carrying, cfg);
}
function stepQueen(a:Ant, world:World, cfg:WorldConfig){
  if (!a.settled) {
    const targetY = Math.min(world.cfg.height-4, world.cfg.grassHeight + 8);
    a.a = Math.PI/2 + (rand(world)-0.5)*0.5;
    const nx = a.p.x + Math.cos(a.a)*cfg.moveSpeed*0.6;
    const ny = a.p.y + Math.abs(Math.sin(a.a))*cfg.moveSpeed;
    tryMoveOrDig(a, world, cfg, nx, ny);
    if (a.p.y >= targetY) {
      a.settled = true;
      world.cfg.nest = { x: a.p.x|0, y: a.p.y|0 };
    }
  } else {
    a.a += (rand(world)-0.5)*0.3;
    const nx = a.p.x + Math.cos(a.a)*cfg.moveSpeed*0.4;
    const ny = a.p.y + Math.sin(a.a)*cfg.moveSpeed*0.4;
    tryMoveOrDig(a, world, cfg, nx, ny);
    const cx = a.p.x|0, cy = a.p.y|0;
    world.pher.deposit(cx, cy, cfg.depositHome*2, "home");
    if (world.colonyFood > 0 && a.energy < 0.9) {
      world.colonyFood -= 0.01;
      a.energy = Math.min(1, a.energy + 0.02);
    }
  }
}
function stepSoldier(a:Ant, world:World, cfg:WorldConfig, enemies:Enemy[]){
  let target: Enemy | null = null;
  let best = Infinity;
  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = e.p.x - a.p.x;
    const dy = e.p.y - a.p.y;
    const d2 = dx*dx + dy*dy;
    if (d2 < best) { best = d2; target = e; }
  }

  if (target && best <= 1) {
    target.alive = false;
  }

  if (target) {
    const desired = Math.atan2(target.p.y - a.p.y, target.p.x - a.p.x);
    let delta = desired - a.a;
    while (delta > Math.PI) delta -= 2*Math.PI;
    while (delta < -Math.PI) delta += 2*Math.PI;
    a.a += Math.sign(delta) * cfg.turnRate;
  } else {
    const dx = a.p.x - world.cfg.nest.x;
    const dy = a.p.y - world.cfg.nest.y;
    const dist2 = dx*dx + dy*dy;
    const radius = 12;
    if (dist2 > radius*radius) {
      const desired = Math.atan2(world.cfg.nest.y - a.p.y, world.cfg.nest.x - a.p.x);
      let delta = desired - a.a;
      while (delta > Math.PI) delta -= 2*Math.PI;
      while (delta < -Math.PI) delta += 2*Math.PI;
      a.a += Math.sign(delta) * cfg.turnRate * 0.8;
    } else {
      a.a += (rand(world)-0.5) * cfg.turnRate;
    }
  }

  const nx = a.p.x + Math.cos(a.a)*cfg.moveSpeed*0.8;
  const ny = a.p.y + Math.sin(a.a)*cfg.moveSpeed*0.8;
  tryMoveOrDig(a, world, cfg, nx, ny);
}

export function stepAnt(a: Ant, world: World, cfg: WorldConfig, enemies: Enemy[]) {
  if (!a.alive) return;
  a.age++;
  a.energy -= cfg.energyDrain;

  // drop ants from sky until they reach the surface
  if (a.p.y < world.cfg.grassHeight-1) {
    a.p.y += cfg.moveSpeed;
    return;
  }

  switch (a.role) {
    case Role.WORKER: stepWorker(a, world, cfg); break;
    case Role.QUEEN:  stepQueen(a, world, cfg);  break;
    case Role.SOLDIER:stepSoldier(a, world, cfg, enemies);break;
  }

  if (a.energy <= 0) {
    a.alive = false;
    const cx = a.p.x|0, cy = a.p.y|0;
    world.food[world.idx(cx,cy)] += 0.5;
  }
}
