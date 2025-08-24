import { World } from "./world";
import { makeQueen, makeSoldier, makeWorker, stepAnt } from "./ant";
import { WorldConfig, Ant, Enemy } from "./types";
import { spawnEnemy, stepEnemy } from "./enemy";

export class Simulation {
  world: World;
  ants: Ant[];
  cfg: WorldConfig;
  enemies: Enemy[];

  constructor(cfg: WorldConfig) {
    this.cfg = cfg;
    this.world = new World(cfg);

    const queenSpawn = { x: cfg.nest.x, y: 0 };
    this.ants = [ makeQueen(queenSpawn) ];
    for (let i=0; i<cfg.ants; i++) {
      this.ants.push(makeWorker({ x: Math.random()*cfg.width, y: 0 }));
    }
    this.enemies = [];
  }

  step() {
    for (const ant of this.ants) stepAnt(ant, this.world, this.cfg, this.enemies);
    if ((Math.random()*60|0)===0) this.ants = this.ants.filter(a=>a.alive);

    for (const enemy of this.enemies) stepEnemy(enemy, this.world, this.cfg);
    this.enemies = this.enemies.filter(e=>e.alive);
    if (Math.random() < 0.005) this.enemies.push(spawnEnemy(this.world, this.cfg));

    if (this.world.colonyFood >= this.cfg.spawnThreshold) {
      this.world.colonyFood -= this.cfg.spawnThreshold;
      const spawn = { x: this.cfg.nest.x, y: this.cfg.nest.y };
      if (Math.random() < this.cfg.soldierRatio) this.ants.push(makeSoldier(spawn));
      else this.ants.push(makeWorker(spawn));
    }

    this.world.stepDirt();
    this.world.pher.step(this.cfg.evap, this.cfg.diffuse);
  }
}
