import { Application, Graphics, Sprite, Texture } from "pixi.js";
import { Simulation } from "../sim/simulation";
import { Cell, Role } from "../sim/types";

export class PixiRenderer {
  app: Application;
  sim: Simulation;
  antGfx!: Graphics;

  private offscreen!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private imageData!: ImageData;
  private pherTex!: Texture;
  private pherSprite!: Sprite;

  private terrainCanvas!: HTMLCanvasElement;
  private terrainCtx!: CanvasRenderingContext2D;
  private terrainTex!: Texture;
  private terrainSprite!: Sprite;

  private widthPx: number;
  private heightPx: number;
  private _ready = false;

  constructor(sim: Simulation, widthPx: number, heightPx: number) {
    this.sim = sim;
    this.widthPx = widthPx;
    this.heightPx = heightPx;
    this.app = new Application();
  }

  get ready() { return this._ready; }

  async init() {
    await this.app.init({ width: this.widthPx, height: this.heightPx, antialias: false, background: 0x0b0d10 });
    document.getElementById("app")!.appendChild(this.app.canvas);

    this.antGfx = new Graphics();
    this.app.stage.addChild(this.antGfx);

    const ph = this.sim.world.pher as any;
    const w: number = ph.w;
    const h: number = ph.h;

    // pheromones offscreen
    this.offscreen = document.createElement("canvas");
    this.offscreen.width = w; this.offscreen.height = h;
    this.ctx = this.offscreen.getContext("2d")!;
    this.imageData = this.ctx.createImageData(w, h);
    this.pherTex = Texture.from(this.offscreen);
    this.pherSprite = new Sprite(this.pherTex);
    this.pherSprite.scale.set(this.sim.cfg.cellSize);

    // terrain
    this.terrainCanvas = document.createElement("canvas");
    this.terrainCanvas.width = w; this.terrainCanvas.height = h;
    this.terrainCtx = this.terrainCanvas.getContext("2d")!;
    this.terrainTex = Texture.from(this.terrainCanvas);
    this.terrainSprite = new Sprite(this.terrainTex);
    this.terrainSprite.scale.set(this.sim.cfg.cellSize);

    this.app.stage.addChildAt(this.terrainSprite, 0);
    this.app.stage.addChildAt(this.pherSprite, 1);

    this._ready = true;
  }

  private drawTerrain() {
    const w = this.sim.world.cfg.width;
    const h = this.sim.world.cfg.height;
    const tiles = this.sim.world.tiles;
    const food = this.sim.world.food;

    const img = this.terrainCtx.createImageData(w, h);
    const data = img.data;

    const soil = [145, 102, 19];
    const grass = [34, 139, 34];
    const air = [11, 13, 16];

    for (let i=0;i<w*h;i++){
      const t = tiles[i];
      const idx = i*4;
      let c;
      if (food[i] > 0) {
        c = [0, 255, 0];
      } else if (t === Cell.DIRT) c = soil;
      else if (t === Cell.GRASS) c = grass;
      else c = air;
      data[idx] = c[0]; data[idx+1] = c[1]; data[idx+2] = c[2]; data[idx+3] = 255;
    }
    this.terrainCtx.putImageData(img, 0, 0);
    this.terrainTex.update();
  }

  draw() {
    if (!this._ready) return;

    // terrain
    this.drawTerrain();

    // pheromones
    const ph = this.sim.world.pher as any;
    const w: number = ph.w;
    const h: number = ph.h;
    const food: Float32Array = ph.food;
    const home: Float32Array = ph.home;
    const data = this.imageData.data;

    for (let i=0;i<w*h;i++){
      const rf = food[i] * 255;
      const gh = home[i] * 255;
      const idx = i*4;
      data[idx]   = rf > 255 ? 255 : rf;
      data[idx+1] = gh > 255 ? 255 : gh;
      data[idx+2] = 0;
      data[idx+3] = 85;
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    this.pherTex.update();

    // ants & enemies (Pixi v8 API)
    this.antGfx.clear();
    const s = this.sim.cfg.cellSize;

    // enemies (optional) — red
    const simAny = this.sim as any;
    if (simAny.enemies?.length) {
      this.antGfx.beginPath();
      for (const e of simAny.enemies) {
        if (!e.alive) continue;
        this.antGfx.rect(e.p.x * s, e.p.y * s, 1, 1);
      }
      this.antGfx.fill({ color: 0xff3b30, alpha: 0.95 });
    }

    // workers — blue
    this.antGfx.beginPath();
    for (const a of this.sim.ants) {
      if (!a.alive || a.role !== Role.WORKER) continue;
      this.antGfx.rect(a.p.x * s, a.p.y * s, 1, 1);
    }
    this.antGfx.fill({ color: 0x0000ff, alpha: 0.95 });

    // soldiers — red
    this.antGfx.beginPath();
    for (const a of this.sim.ants) {
      if (!a.alive || a.role !== Role.SOLDIER) continue;
      this.antGfx.rect(a.p.x * s, a.p.y * s, 1, 1);
    }
    this.antGfx.fill({ color: 0xff0000, alpha: 0.95 });

    // queen — yellow (slightly larger)
    this.antGfx.beginPath();
    for (const a of this.sim.ants) {
      if (!a.alive || a.role !== Role.QUEEN) continue;
      this.antGfx.rect(a.p.x * s, a.p.y * s, 1, 1);
    }
    this.antGfx.fill({ color: 0xffff00, alpha: 1.0 });
    
  }
}
