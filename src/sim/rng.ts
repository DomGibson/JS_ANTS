export class RNG {
  private s = 0;
  constructor(seed: number | string) {
    this.s = typeof seed === "number" ? seed|0 : hashString(seed);
    if (this.s === 0) this.s = 0x9e3779b9;
  }
  next() {
    let t = this.s += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a=0, b=1) { return a + (b - a) * this.next(); }
  int(max: number) { return (this.next() * max) | 0; }
}
export function hashString(str: string){
  let h1=0xdeadbeef, h2=0x41c6ce57;
  for (let i=0;i<str.length;i++){ const ch=str.charCodeAt(i); h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677); }
  h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
  h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
  return (h2>>>0);
}
