/* Four rectangular shells. Every chamber is a narrow looping maze, not an arena. */
const NETHER_LAYOUT_CATALOGUE=[
  {id:'rectangular-descent-v1',name:'Current loops',description:'The familiar narrow loops and rectangular layers.',hint:'Your current maze, preserved for comparison.'},
  {id:'loop-islands-v1',name:'Loop islands',description:'Pac-Man-like turns and branching loops around wall islands.',hint:'Turn around an island, then take a different way out.'},
  {id:'snake-race-v1',name:'Snake race',description:'Longer winding lanes with fewer escape junctions.',hint:'Read the next corner before a fast monster commits.'},
  {id:'stepped-islands-v1',name:'Stepped walls',description:'Loop islands inside continuous zigzag layer walls.',hint:'A bend in the coloured wall can hide another way through.'},
  {id:'castle-islands-v1',name:'Castle walls',description:'Loop islands and indented, battlement-like layer walls.',hint:'Use the wall recesses to find a useful second opening.'}
];
function originalLayout(){
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

// Layouts are pure data: fixed seeds make a fresh comparison reproducible.
// Odd grid points are rooms of exactly one cell; a carved edge joins two rooms.
// Even/even cells stay solid, so a carved maze cannot accidentally create an arena.
function layout(id='rectangular-descent-v1'){
  const entry=NETHER_LAYOUT_CATALOGUE.find(item=>item.id===id);
  if(!entry)throw new RangeError('Unknown Nether maze: '+id);
  const scene=originalLayout(),{width,height,layers}=scene,at=(x,y)=>y*width+x;
  const neighbors=i=>[[i%width-1,Math.floor(i/width)],[i%width+1,Math.floor(i/width)],[i%width,Math.floor(i/width)-1],[i%width,Math.floor(i/width)+1]].filter(([x,y])=>x>=0&&x<width&&y>=0&&y<height).map(([x,y])=>at(x,y));
  const shaped=id==='stepped-islands-v1'||id==='castle-islands-v1';
  const outlines=layers.map(l=>{
    const {x1:a,y1:b,x2:c,y2:d}=l;
    if(id==='stepped-islands-v1')return [[a+2,b],[c,b],[c,18],[c-2,18],[c-2,d],[a,d],[a,18],[a+2,18]];
    if(id==='castle-islands-v1'){
      const low=l.tier===4?17:14,high=l.tier===4?19:22;
      return [[a,b],[c,b],[c,low],[c-2,low],[c-2,high],[c,high],[c,d],[a,d],[a,high],[a+2,high],[a+2,low],[a,low]];
    }
    return [[a,b],[c,b],[c,d],[a,d]];
  });
  const boundary=Array(width*height).fill(0),depth=Array(width*height).fill(0);
  function inside(x,y,polygon){let yes=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const[a,b]=polygon[i],[c,d]=polygon[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;}
  outlines.forEach((polygon,level)=>{
    for(let i=0;i<polygon.length;i++){
      let[x,y]=polygon[i];const[tx,ty]=polygon[(i+1)%polygon.length],dx=Math.sign(tx-x),dy=Math.sign(ty-y);
      for(;;){boundary[at(x,y)]=level+1;if(x===tx&&y===ty)break;x+=dx;y+=dy;}
    }
    for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++)if(inside(x+.001,y+.001,polygon))depth[at(x,y)]=level+1;
  });
  for(let i=0;i<depth.length;i++)if(boundary[i])depth[i]=boundary[i];
  if(id!=='rectangular-descent-v1'){
    scene.map=boundary.map(tier=>tier?'bcde'[tier-1]:'#');
    const map=scene.map,snake=id==='snake-race-v1';
    // Use the same decision seed for the islands and boundary comparisons.
    let seed=snake?14731:42709;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let level=0;level<=4;level++){
      const nodes=[];for(let y=1;y<height-1;y+=2)for(let x=1;x<width-1;x+=2)if(!boundary[at(x,y)]&&depth[at(x,y)]===level)nodes.push(at(x,y));
      const nodeSet=new Set(nodes),edges=new Map(nodes.map(i=>[i,[]]));
      for(const i of nodes)for(const delta of[2,-2,2*width,-2*width]){
        const j=i+delta,middle=(i+j)/2;
        if(nodeSet.has(j)&&!boundary[middle]&&depth[middle]===level&&Math.abs(j%width-i%width)<=2)edges.get(i).push(j);
      }
      const visited=new Set(),linked=new Map(nodes.map(i=>[i,new Set()]));
      const connect=(a,b)=>{map[a]=map[b]=map[(a+b)/2]='.';linked.get(a).add(b);linked.get(b).add(a);};
      const stack=[{i:nodes[0],direction:0}];visited.add(nodes[0]);map[nodes[0]]='.';
      while(stack.length){
        const current=stack[stack.length-1],available=edges.get(current.i).filter(j=>!visited.has(j));
        if(!available.length){stack.pop();continue;}
        const straight=available.find(j=>j-current.i===current.direction);
        const next=snake&&straight!==undefined&&random()<.82?straight:available[Math.floor(random()*available.length)];
        connect(current.i,next);visited.add(next);stack.push({i:next,direction:next-current.i});
      }
      if(visited.size!==nodes.length)throw new Error('Disconnected maze chamber '+id+':'+level);
      // Close tree dead ends into escape loops. Snake keeps only these essential
      // bypasses; islands gain more branch/rejoin decisions.
      for(const i of nodes)if(linked.get(i).size<2){const choices=edges.get(i).filter(j=>!linked.get(i).has(j));if(choices.length)connect(i,choices[Math.floor(random()*choices.length)]);}
      if(!snake)for(const i of nodes)for(const j of edges.get(i))if(j>i&&!linked.get(i).has(j)&&random()<.18)connect(i,j);
    }
    // Preserve the two ways out of the tiny refuge, including the existing
    // recovery positions, without creating a 2x2 open square.
    for(const[x,y]of[[1,33],[1,34],[1,35],[2,33],[3,33],[3,34],[3,35],[2,35],[4,35],[5,35],[1,32],[1,31],[1,30],[1,29]])map[at(x,y)]='.';
    const occupied=new Set([at(scene.start.x,scene.start.y),at(scene.goal.x,scene.goal.y)]);
    function place(point,level,share=false){
      let best=-1,distance=Infinity;
      for(let i=0;i<map.length;i++)if(map[i]==='.'&&depth[i]===level&&(share||!occupied.has(i))){const gap=Math.abs(i%width-point.x)+Math.abs(Math.floor(i/width)-point.y);if(gap<distance){distance=gap;best=i;}}
      if(best<0)throw new Error('No place for '+id+' '+level);
      occupied.add(best);return {...point,x:best%width,y:Math.floor(best/width)};
    }
    scene.upgrades=scene.upgrades.map(p=>place(p,p.tier-1));
    scene.cores=scene.cores.map(p=>place(p,p.tier));
    scene.hammer={x:scene.cores[3].x,y:scene.cores[3].y};
    scene.enemies=scene.enemies.map(p=>place(p,p.layer));
  }
  scene.depth=depth;
  scene.weakCells=[];
  for(let level=1;level<=4;level++){
    const candidates=[];
    for(let i=0;i<scene.map.length;i++)if(scene.map[i]==='bcde'[level-1]){
      const sides=neighbors(i).filter(n=>scene.map[n]==='.');
      if(sides.some(n=>depth[n]===level-1)&&sides.some(n=>depth[n]===level))candidates.push(i);
    }
    // Spread the visible weaker crossings around each wall. Ordinary wall
    // cells remain mineable; the optional weak-spot setting only changes time.
    const chosen=[];
    while(candidates.length&&chosen.length<8){
      let best=0,distance=-1;
      for(let n=0;n<candidates.length;n++){
        const i=candidates[n],gap=chosen.length?Math.min(...chosen.map(j=>Math.abs(i%width-j%width)+Math.abs(Math.floor(i/width)-Math.floor(j/width)))):0;
        if(gap>distance){best=n;distance=gap;}
      }
      chosen.push(candidates.splice(best,1)[0]);
    }
    scene.weakCells.push(...chosen);
  }
  if(id==='rectangular-descent-v1')scene.weakCells=layers.flatMap(l=>[at(19,l.y1),at(25,l.y2)]);
  // Every released monster has already crossed into the outer network. Patrol
  // targets must be there too, never behind a future upgrade's sealed wall.
  scene.patrol=[{x:1,y:1},{x:43,y:1},{x:43,y:35},{x:1,y:19},{x:23,y:3},{x:41,y:18}].map(point=>{
    if(id==='rectangular-descent-v1')return point;
    let best=-1,distance=Infinity;
    for(let i=0;i<scene.map.length;i++)if(scene.map[i]==='.'&&depth[i]===0){const gap=Math.abs(i%width-point.x)+Math.abs(Math.floor(i/width)-point.y);if(gap<distance){best=i;distance=gap;}}
    return {x:best%width,y:Math.floor(best/width)};
  });
  const floor=scene.map.flatMap((tile,i)=>tile==='.'?[i]:[]),degree=i=>neighbors(i).filter(n=>scene.map[n]==='.').length;
  scene.metrics={floorCells:floor.length,junctions:floor.filter(i=>degree(i)>=3).length,deadEnds:floor.filter(i=>degree(i)===1).length,corners:floor.filter(i=>{const n=neighbors(i).filter(j=>scene.map[j]==='.');return n.length===2&&Math.abs(n[0]-n[1])!==2&&Math.abs(n[0]-n[1])!==2*width;}).length,shapedBoundaries:shaped};
  return {...scene,...entry};
}
// Omit this footer when embedding the public layout library in the game.
if(typeof module!=='undefined')module.exports={layout,NETHER_LAYOUT_CATALOGUE};
