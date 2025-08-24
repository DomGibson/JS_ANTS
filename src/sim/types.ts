export type Vec2 = { x: number; y: number };

export enum Cell {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
}

export enum Role {
  QUEEN = 0,
  WORKER = 1,
  SOLDIER = 2,
}

export interface Ant {
  p: Vec2;
  a: number;
  role: Role;
  carrying: boolean;
  energy: number; // 0..1
  age: number;    // steps
  alive: boolean;
  settled?: boolean; // queen only
}

export interface WorldConfig {
  width: number; height: number;
  cellSize: number;
  ants: number;                    // starting workers
  evap: number;
  diffuse: number;
  depositFood: number;
  depositHome: number;
  senseAngle: number;
  senseDist: number;
  turnRate: number;
  moveSpeed: number;
  rngSeed?: string;
  nest: Vec2;                      // initial (surface), queen will move
  grassHeight: number;             // sky thickness before grass row
  energyDrain: number;             // per-step
  digCost: number;                 // extra when digging
  spawnThreshold: number;          // food units to spawn one ant
  soldierRatio: number;            // 0..1
}
