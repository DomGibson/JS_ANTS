import { World } from "./world";
import { makeQueen, makeSoldier, makeWorker, stepAnt } from "./ant";
import { WorldConfig, Ant, Enemy, Vec2 } from "./types";
import { spawnEnemy, stepEnemy } from "./enemy";
import { RNG } from "./rng";

export class Simulation {
  world: World;
  ants: Ant[];
  cfg: WorldConfig;
  enemies: Enemy[];
  rng: RNG;
  homes: Vec2[];

  constructor(cfg: WorldConfig) {
    const urlSeed = new URLSearchParams(globalThis.location?.search ?? "").get("seed") ?? cfg.rngSeed ?? "demo";
    this.rng = new RNG(urlSeed);
    this.cfg = cfg;
    (this.cfg as any).rng = this.rng;

    this.homes = cfg.homes?.length ? cfg.homes.slice() : [cfg.nest];

    this.world = new World(cfg);
    (this.world as any).sim = this;

    const queenSpawn = { x: cfg.nest.x, y: 0 };
    this.ants = [ makeQueen(queenSpawn) ];
    for (let i=0; i<cfg.ants; i++) {
      this.ants.push(makeWorker({ x: this.rng.next()*cfg.width, y: 0 }, this.rng.next()*Math.PI*2));
    }
    this.enemies = [];
  }

  step() {
    for (const ant of this.ants) stepAnt(ant, this.world, this.cfg, this.enemies);
    if ((this.rng.int(60))===0) this.ants = this.ants.filter(a=>a.alive);

    for (const enemy of this.enemies) stepEnemy(enemy, this.world, this.cfg);
    this.enemies = this.enemies.filter(e=>e.alive);
    if (this.rng.next() < 0.005) this.enemies.push(spawnEnemy(this.world, this.cfg));

    if (this.world.colonyFood >= this.cfg.spawnThreshold) {
      this.world.colonyFood -= this.cfg.spawnThreshold;
      const spawn = { x: this.cfg.nest.x, y: this.cfg.nest.y };
      if (this.rng.next() < this.cfg.soldierRatio) this.ants.push(makeSoldier(spawn, this.rng.next()*Math.PI*2));
      else this.ants.push(makeWorker(spawn, this.rng.next()*Math.PI*2));
    }

    this.world.stepDirt();
    this.world.pher.step(this.cfg.evap, this.cfg.diffuse);
  }
}
