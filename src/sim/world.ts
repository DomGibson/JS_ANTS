import { Cell, Vec2, WorldConfig } from "./types";
import { PheromoneField } from "./pheromones";

export class World {
  cfg: WorldConfig;
  pher: PheromoneField;
  food: Float32Array;
  tiles: Uint8Array;
  colonyFood = 0;

  constructor(cfg: WorldConfig) {
    this.cfg = cfg;
    this.pher = new PheromoneField(cfg.width, cfg.height);
    this.food  = new Float32Array(cfg.width * cfg.height);
    this.tiles = new Uint8Array(cfg.width * cfg.height);
    this.generateTerrain();
  }

  idx(x:number,y:number){ return y*this.cfg.width+x; }
  inBounds(x:number,y:number){ return x>=0&&y>=0&&x<this.cfg.width&&y<this.cfg.height; }

  tileAt(x:number,y:number){ return this.tiles[this.idx(x|0,y|0)]; }
  setTile(x:number,y:number,v:Cell){ this.tiles[this.idx(x|0,y|0)] = v; }

  isWalkable(x:number,y:number){
    return this.tileAt(x,y) === Cell.AIR;
  }

  generateTerrain(){
    const { width, height, grassHeight } = this.cfg;
    for(let y=0;y<height;y++){
      for(let x=0;x<width;x++){
        const i = this.idx(x,y);
        if (y === grassHeight) this.tiles[i] = Cell.GRASS;
        else if (y > grassHeight) this.tiles[i] = Cell.DIRT;
        else this.tiles[i] = Cell.AIR;
      }
    }
  }

  addFoodCircle(cx:number, cy:number, r:number, amt:number){
    for(let y=cy-r; y<=cy+r; y++) for(let x=cx-r; x<=cx+r; x++){
      if(!this.inBounds(x,y)) continue;
      const dx=x-cx, dy=y-cy; if(dx*dx+dy*dy<=r*r) this.food[this.idx(x,y)] += amt;
    }
  }
  takeFood(x:number,y:number, amt:number){
    const i = this.idx(x|0,y|0);
    const t = Math.min(this.food[i], amt);
    this.food[i]-=t; return t;
  }

  dig(x:number,y:number){
    const t = this.tileAt(x,y);
    if (t === Cell.DIRT || t === Cell.GRASS) this.setTile(x,y, Cell.AIR);
  }
}
