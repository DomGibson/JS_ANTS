import { World } from "./world";
import { makeQueen, makeSoldier, makeWorkers, stepAnt } from "./ant";
import { WorldConfig, Ant } from "./types";

export class Simulation {
  world: World;
  ants: Ant[];
  cfg: WorldConfig;

  constructor(cfg: WorldConfig) {
    this.cfg = cfg;
    this.world = new World(cfg);

    const spawn = { x: cfg.nest.x, y: Math.max(0, cfg.grassHeight - 1) };
    this.ants = [ makeQueen(spawn), ...makeWorkers(cfg.ants, spawn) ];
  }

  step() {
    for (const ant of this.ants) stepAnt(ant, this.world, this.cfg);
    if ((Math.random()*60|0)===0) this.ants = this.ants.filter(a=>a.alive);

    if (this.world.colonyFood >= this.cfg.spawnThreshold) {
      this.world.colonyFood -= this.cfg.spawnThreshold;
      const spawn = { x: this.cfg.nest.x, y: this.cfg.nest.y };
      if (Math.random() < this.cfg.soldierRatio) this.ants.push(makeSoldier(spawn));
      else this.ants.push(...makeWorkers(1, spawn));
    }
    this.world.pher.step(this.cfg.evap, this.cfg.diffuse);
  }
}
