// Draws the Twenty Nights app icon in the game's own blocky style and writes a PNG.
// Pure Node — zlib only — because this project never depends on an external asset.
// Usage: node tools/makeicon.js <size> <outfile>
//
// The picture is the whole game in one frame: your tree, a torch pushing back the
// dark, and something out there watching the light. Warm against cold, safe against
// not-safe — that's the feeling, not just the subject.
const zlib = require("zlib"), fs = require("fs");

const PAL = { skyTop:"#0d1108", skyLow:"#1b2411", leafHi:"#47793b", leafTop:"#5c9350",
              trunk:"#6e5230", grass:"#6b9a57", grass2:"#5c8a4a", gold:"#e0a94e",
              flame:"#ffc45c", ember:"#e2703a", eye:"#e8574f", shine:"#ffffff", mob:"#2a2a33", mobTop:"#3c3c48",
              dark:"#0b0f06" };
const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function canvas(size){
  const px = Buffer.alloc(size*size*4), S = size/64;    // art laid out on a 64-unit grid
  const put = (x, y, c, a) => {
    if (a <= 0) return;
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= size || y >= size) return;
    if (a > 1) a = 1;
    const i = (y*size + x)*4, ia = 1 - a;
    px[i]   = px[i]  *ia + c[0]*a;
    px[i+1] = px[i+1]*ia + c[1]*a;
    px[i+2] = px[i+2]*ia + c[2]*a;
    px[i+3] = Math.min(255, px[i+3]*ia + 255*a);
  };
  const rect = (x,y,w,h,col,a=1) => { const c = hex(col);
    for (let j = Math.round(y*S); j < Math.round((y+h)*S); j++)
      for (let i = Math.round(x*S); i < Math.round((x+w)*S); i++) put(i,j,c,a); };
  const vgrad = (x,y,w,h,top,bot) => { const A = hex(top), B = hex(bot),
    y0 = Math.round(y*S), y1 = Math.round((y+h)*S);
    for (let j = y0; j < y1; j++){ const c = mix(A, B, (j-y0)/Math.max(1,y1-y0-1));
      for (let i = Math.round(x*S); i < Math.round((x+w)*S); i++) put(i,j,c,1); } };
  const round = (x,y,w,h,r,col,a=1) => { const c = hex(col),
    x0=Math.round(x*S), y0=Math.round(y*S), x1=Math.round((x+w)*S), y1=Math.round((y+h)*S), R=r*S;
    for (let j=y0;j<y1;j++) for (let i=x0;i<x1;i++){
      const dx=Math.max(x0+R-i-.5,0,i+.5-(x1-R)), dy=Math.max(y0+R-j-.5,0,j+.5-(y1-R));
      const d=Math.hypot(dx,dy);
      put(i,j,c, d<=R-.5 ? a : d<R+.5 ? a*(R+.5-d) : 0);
    }};
  const disc = (cx,cy,r,col,a=1) => { const c = hex(col);
    for (let j=Math.round((cy-r)*S)-1; j<=Math.round((cy+r)*S)+1; j++)
      for (let i=Math.round((cx-r)*S)-1; i<=Math.round((cx+r)*S)+1; i++){
        const d=Math.hypot(i+.5-cx*S, j+.5-cy*S), R=r*S;
        put(i,j,c, d<=R-.5 ? a : d<R+.5 ? a*(R+.5-d) : 0);
      }};
  // torchlight: bright at the wick, falling away fast — the game's own light falloff
  const glow = (cx,cy,r,col,peak) => { const c = hex(col);
    for (let j=Math.round((cy-r)*S); j<=Math.round((cy+r)*S); j++)
      for (let i=Math.round((cx-r)*S); i<=Math.round((cx+r)*S); i++){
        const d=Math.hypot(i+.5-cx*S, j+.5-cy*S)/(r*S);
        if (d < 1) put(i,j,c, peak*Math.pow(1-d, 2.2));
      }};
  return {px, rect, vgrad, round, disc, glow};
}

function png(px, size){
  const raw = Buffer.alloc((size*4+1)*size);
  for (let y=0;y<size;y++){ raw[y*(size*4+1)] = 0;
    px.copy(raw, y*(size*4+1)+1, y*size*4, (y+1)*size*4); }
  const T=[]; for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0;}
  const crc = b => { let c=0xFFFFFFFF; for(const v of b) c=T[(c^v)&255]^(c>>>8); return (c^0xFFFFFFFF)>>>0; };
  const chunk = (type,data) => { const len=Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body=Buffer.concat([Buffer.from(type,"ascii"), data]);
    const c=Buffer.alloc(4); c.writeUInt32BE(crc(body)); return Buffer.concat([len,body,c]); };
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4);
  ihdr[8]=8; ihdr[9]=6;
  return Buffer.concat([ Buffer.from([137,80,78,71,13,10,26,10]),
    chunk("IHDR",ihdr), chunk("IDAT", zlib.deflateSync(raw,{level:9})), chunk("IEND", Buffer.alloc(0)) ]);
}

const size = +(process.argv[2] || 512), out = process.argv[3] || "icon.png";
const c = canvas(size);

c.vgrad(0, 0, 64, 54, PAL.skyTop, PAL.skyLow);         // night, deeper overhead
c.rect(0, 52, 64, 12, PAL.grass);                      // ground
c.rect(0, 52, 64, 2,  PAL.grass2);

c.glow(38, 44, 30, PAL.flame, .26);                    // the warm pool you build your night around
c.glow(38, 44, 15, PAL.flame, .34);

c.rect(15, 34, 6, 20, PAL.trunk);                      // the tree, straight from the game's renderer
c.round(4, 7, 28, 29, 5, PAL.leafHi);
c.round(4, 7, 28, 7,  5, PAL.leafTop, .55);            // bright top face, like Minecraft

c.rect(36, 40, 3, 14, PAL.trunk);                      // torch: stick, ember, flame
c.disc(37.5, 39, 2.8, PAL.ember, .95);
c.disc(37.5, 37.4, 1.8, PAL.flame);
c.disc(37.5, 36.5, .85, PAL.shine, .85);

c.round(47, 24, 15, 15, 3.5, PAL.mob, .97);            // …and one of THEM, just outside the light
c.round(47, 24, 15, 4,  3.5, PAL.mobTop, .5);
for (const ex of [51, 58]){
  c.disc(ex, 31, 1.7, PAL.eye, .97);
  c.disc(ex - .45, 30.4, .62, PAL.shine, .85);
}

fs.writeFileSync(out, png(c.px, size));
console.log(out + "  " + size + "×" + size + "  " + (fs.statSync(out).size/1024).toFixed(1) + " KB");
