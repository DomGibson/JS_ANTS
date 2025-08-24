import { Ant, Role, WorldConfig, Enemy, Cell } from "./types";
import { World } from "./world";

export function makeQueen(spawn:{x:number;y:number}): Ant {
  return { p:{...spawn}, a:Math.PI/2, role:Role.QUEEN, carrying:false, energy:1, age:0, alive:true, settled:false };
}
export function makeWorkers(n:number, spawn:{x:number;y:number}): Ant[] {
  const ants: Ant[] = [];
  for (let i=0; i<n; i++) ants.push({ p:{...spawn}, a:Math.random()*Math.PI*2, role:Role.WORKER, carrying:false, energy:1, age:0, alive:true });
  return ants;
}
export function makeSoldier(spawn:{x:number;y:number}): Ant {
  return { p:{...spawn}, a:Math.random()*Math.PI*2, role:Role.SOLDIER, carrying:false, energy:1, age:0, alive:true };
}

// Helpers
function senseAt(a: Ant, world: World, cfg: WorldConfig, phi:number, field:"food"|"home"){
  const dist = cfg.senseDist;
  const dir = a.a + phi;
  const sx = Math.round(a.p.x + Math.cos(dir)*dist);
  const sy = Math.round(a.p.y + Math.sin(dir)*dist);
  if(!world.inBounds(sx,sy)) return 0;
  const grid = field==="food" ? world.pher.food : world.pher.home;
  return grid[world.idx(sx,sy)];
}
function turnToward(a: Ant, left:number, ahead:number, right:number, maxTurn:number){
  if (left>right && left>ahead) a.a -= maxTurn;
  else if (right>left && right>ahead) a.a += maxTurn;
  else a.a += (Math.random()-0.5)*maxTurn*0.2;
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
      a.a += (Math.random()-0.5)*Math.PI;
    }
  } else {
    a.a += (Math.random()-0.5)*Math.PI;
  }
}

// Behaviours
function stepWorker(a:Ant, world:World, cfg:WorldConfig){
  const targetField = a.carrying ? "home" : "food";
  const l  = senseAt(a, world, cfg, -cfg.senseAngle, targetField);
  const m  = senseAt(a, world, cfg, 0,               targetField);
  const r  = senseAt(a, world, cfg, +cfg.senseAngle, targetField);
  turnToward(a, l, m, r, cfg.turnRate);

  const nx = a.p.x + Math.cos(a.a)*cfg.moveSpeed;
  const ny = a.p.y + Math.sin(a.a)*cfg.moveSpeed;
  tryMoveOrDig(a, world, cfg, nx, ny);

  const cx = a.p.x|0, cy = a.p.y|0;
  if (!a.carrying) {
    const grabbed = world.takeFood(cx,cy, 0.5);
    if (grabbed > 0) {
      a.carrying = true;
      world.pher.deposit(cx, cy, cfg.depositFood*10, "food"); // recruit burst
    }
  } else {
    const dx = cx - (world.cfg.nest.x|0), dy = cy - (world.cfg.nest.y|0);
    if (dx*dx + dy*dy <= 4) {
      a.carrying = false;
      world.colonyFood += 1;
      a.energy = Math.min(1, a.energy + 0.6);
    }
  }
  world.pher.deposit(cx, cy, a.carrying ? cfg.depositFood : cfg.depositHome, a.carrying ? "food" : "home");
}
function stepQueen(a:Ant, world:World, cfg:WorldConfig){
  if (!a.settled) {
    const targetY = Math.min(world.cfg.height-4, world.cfg.grassHeight + 8);
    a.a = Math.PI/2 + (Math.random()-0.5)*0.5;
    const nx = a.p.x + Math.cos(a.a)*cfg.moveSpeed*0.6;
    const ny = a.p.y + Math.abs(Math.sin(a.a))*cfg.moveSpeed;
    tryMoveOrDig(a, world, cfg, nx, ny);
    if (a.p.y >= targetY) {
      a.settled = true;
      world.cfg.nest = { x: a.p.x|0, y: a.p.y|0 };
    }
  } else {
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
      a.a += (Math.random()-0.5) * cfg.turnRate;
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
