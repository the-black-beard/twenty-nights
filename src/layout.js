/* Four rectangular shells. Every chamber is a narrow looping maze, not an arena. */
const NETHER_LAYOUT_CATALOGUE=[{id:'rectangular-descent-v1',name:'The Fourfold Maze',description:'Four layers. Ten monsters. Three lives.',hint:'Make a second opening. Lead the pack one way, then take the other loop.'}];
function layout(){
  const width=45,height=37,map=Array(width*height).fill('#'),at=(x,y)=>y*width+x;
  const perimeter=(a,b,c,d,t)=>{for(let x=a;x<=c;x++){map[at(x,b)]=t;map[at(x,d)]=t;}for(let y=b;y<=d;y++){map[at(a,y)]=t;map[at(c,y)]=t;}};
  const layers=[
    {tier:1,tile:'b',name:'Copper',x1:4,y1:4,x2:40,y2:32},
    {tier:2,tile:'c',name:'Crystal',x1:8,y1:8,x2:36,y2:28},
    {tier:3,tile:'d',name:'Iron',x1:12,y1:12,x2:32,y2:24},
    {tier:4,tile:'e',name:'Obsidian',x1:16,y1:16,x2:28,y2:20}
  ];
  // Paired perimeter lanes with staggered cross-links and baffles. Links stay
  // at least two cells apart, so junctions never become open 2x2 arenas.
  for(let level=0;level<4;level++){
    const a=1+level*4,b=a,c=width-1-a,d=height-1-b;
    perimeter(a,b,c,d,'.');perimeter(a+2,b+2,c-2,d-2,'.');
    const links=(lo,hi)=>{if(hi-lo<4)return [Math.round((lo+hi)/2)];const n=Math.ceil((hi-lo)/7);return Array.from({length:n+1},(_,i)=>Math.round(lo+(hi-lo)*i/n));};
    const xs=links(a+4,c-4),ys=links(b+4,d-4);
    for(const x of xs){map[at(x,b+1)]='.';map[at(x,d-1)]='.';}
    for(const y of ys){map[at(a+1,y)]='.';map[at(c-1,y)]='.';}
    if(level<3){
      map[at(Math.floor((xs[0]+xs[1])/2),b)]='#';
      map[at(Math.floor((xs[1]+xs[2])/2),d)]='#';
      map[at(a+2,Math.floor((ys[0]+ys[1])/2))]='#';
      map[at(c-2,Math.floor((ys[1]+ys[2])/2))]='#';
    }
  }
  perimeter(17,17,27,19,'.');
  for(const l of layers)perimeter(l.x1,l.y1,l.x2,l.y2,l.tile);
  // Refuge uses an existing corner loop, with two independently usable exits.
  const refuge={x1:1,x2:1,y1:34,y2:34};
  // A small refuge never seals the corner. This bypass also stays one cell wide.
  map[at(2,33)]='.';map[at(3,34)]='.';
  return {...NETHER_LAYOUT_CATALOGUE[0],width,height,map,layers,
    hammer:{x:23,y:19},start:{x:1,y:34},goal:{x:43,y:1},refuge,refugeWait:{x:1,y:30},
    recoveryExits:[{x:1,y:31},{x:4,y:35}],
    upgrades:[{x:3,y:3,tier:1,label:'Copper pickaxe'},{x:37,y:7,tier:2,label:'Crystal pickaxe'},{x:11,y:25,tier:3,label:'Iron pickaxe'},{x:29,y:21,tier:4,label:'Obsidian pickaxe'}],
    cores:[{id:'ember',x:5,y:29,tier:1,label:'Ember core'},{id:'crystal',x:35,y:11,tier:2,label:'Crystal core'},{id:'iron',x:13,y:21,tier:3,label:'Iron core'},{id:'deep',x:23,y:19,tier:4,label:'Deep core'}],
    enemies:[
      {id:'grumble',name:'Grumble',layer:1,x:23,y:5,role:'chaser'},
      {id:'wobble',name:'Wobble',layer:1,x:39,y:23,role:'flanker'},
      {id:'nibble',name:'Nibble',layer:2,x:23,y:9,role:'roamer'},
      {id:'goggle',name:'Goggle',layer:2,x:9,y:19,role:'chaser'},
      {id:'fidget',name:'Fidget',layer:3,x:23,y:13,role:'flanker'},
      {id:'muddle',name:'Muddle',layer:3,x:31,y:19,role:'roamer'},
      {id:'bonk',name:'Bonk',layer:3,x:15,y:15,role:'chaser'},
      {id:'skitter',name:'Skitter',layer:4,x:17,y:18,role:'flanker'},
      {id:'gizmo',name:'Gizmo',layer:4,x:25,y:17,role:'roamer'},
      {id:'rubble',name:'Rubble',layer:4,x:27,y:19,role:'roamer'}
    ]};
}
