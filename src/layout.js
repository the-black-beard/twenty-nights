/* Fixed authored trial geometry: nested rings, looping lanes and switchback islands. */
const NETHER_LAYOUT_CATALOGUE=[{id:'nested-loops-v1',name:'The Double Descent',description:'Two wall tiers. Two cores. One way home.',hint:'Open another passage before going deeper. Monsters can use it too.'}];
function layout(){
  const map=Array(400).fill('.');
  for(let y=0;y<20;y++)for(let x=0;x<20;x++)if(!x||!y||x===19||y===19)map[y*20+x]='#';
  const ring=(a,b,t)=>{for(let v=a;v<=b;v++){map[a*20+v]=t;map[b*20+v]=t;map[v*20+a]=t;map[v*20+b]=t;}};
  ring(3,16,'b');ring(7,12,'c');
  // Small islands create parallel routes; no collection point sits in a dead end.
  for(const [x,y] of [[5,7],[5,8],[5,11],[5,12],[8,5],[9,5],[12,5],[13,5],[14,8],[14,9],[14,12],[9,14],[10,14],[12,14],[9,9],[10,9],[9,10],[10,10],[1,7],[18,12]])map[y*20+x]='#';
  map[1*20+1]='v';map[18*20+18]='v';
  return {...NETHER_LAYOUT_CATALOGUE[0],map,start:{x:2,y:17},goal:{x:17,y:2},
    refuge:{x1:1,x2:2,y1:16,y2:18},refugeWait:{x:2,y:14},recoveryExits:[{x:2,y:15},{x:3,y:17}],
    upgrades:[{x:2,y:2,tier:1,label:'Copper pickaxe'},{x:14,y:14,tier:2,label:'Crystal pickaxe'}],
    cores:[{id:'ember',x:5,y:5,tier:1,label:'Ember core'},{id:'deep',x:11,y:8,tier:2,label:'Deep core'}],
    enemies:[{id:'grumble',name:'Grumble',layer:1,x:14,y:5},{id:'wobble',name:'Wobble',layer:2,x:8,y:11}]};
}
