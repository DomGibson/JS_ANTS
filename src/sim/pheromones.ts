export class PheromoneField {
  readonly w: number; readonly h: number;
  food: Float32Array; home: Float32Array;

  constructor(w: number, h: number) {
    this.w = w; this.h = h;
    this.food = new Float32Array(w*h);
    this.home = new Float32Array(w*h);
  }
  idx(x: number, y: number) { return y*this.w + x; }

  deposit(x: number, y: number, amt: number, type: "food"|"home") {
    const xi = Math.max(0, Math.min(this.w-1, x|0));
    const yi = Math.max(0, Math.min(this.h-1, y|0));
    const i = this.idx(xi, yi);
    (type === "food" ? this.food : this.home)[i] += amt;
  }

  step(evap: number, diffuse: number) {
    const stepOne = (src: Float32Array) => {
      const dst = new Float32Array(src.length);
      const { w, h } = this;
      for (let y=0; y<h; y++) {
        const yw = y*w;
        for (let x=0; x<w; x++) {
          const i = yw + x;
          const c = src[i];
          const l = src[yw + (x>0 ? x-1 : 0)];
          const r = src[yw + (x<w-1 ? x+1 : w-1)];
          const u = src[(y>0 ? y-1 : 0)*w + x];
          const d = src[(y<h-1 ? y+1 : h-1)*w + x];
          const diffused = c*(1-4*diffuse) + diffuse*(l+r+u+d);
          dst[i] = Math.max(0, diffused*(1-evap));
        }
      }
      return dst;
    };
    this.food = stepOne(this.food);
    this.home = stepOne(this.home);
  }
}
