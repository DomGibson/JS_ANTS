import { Enemy, WorldConfig } from "./types";
import { World } from "./world";

export function spawnEnemy(world: World, cfg: WorldConfig): Enemy {
  const x = Math.max(0, Math.min(cfg.width - 1, cfg.nest.x + (Math.random() * 40 - 20)));
  const y = cfg.grassHeight - 1;
  return { p: { x, y }, a: Math.random() * Math.PI * 2, alive: true };
}

export function stepEnemy(e: Enemy, world: World, cfg: WorldConfig) {
  e.a += (Math.random() - 0.5) * 0.3;
  const nx = e.p.x + Math.cos(e.a) * 0.4;
  const ny = e.p.y + Math.sin(e.a) * 0.4;
  e.p.x = Math.max(0, Math.min(cfg.width - 1, nx));
  e.p.y = Math.max(0, Math.min(cfg.height - 1, ny));
}
