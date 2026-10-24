/* Public-action maze audition. No save injection, teleport, enemy edits or
   earned-item grants. Scripted escapes prove routes, not human difficulty. */
const assert=require('node:assert/strict');
const {NetherTrial:n,S}=require('./harness');
const {action,step}=require('./storm-playthrough');
const presets=['shape-islands','shape-snake','shape-steps','shape-castle'];
const verifiedRecipes=[
  {preset:'shape-snake',strategy:'hammer',nearHammer:true,alternate:1,dodge:true},
  {preset:'shape-steps',strategy:'cores',dodge:true}
];
// Keep the near misses reproducible. These are balance observations, not a
// claim that the maps are impossible or that every default map has a full win.
const diagnosticRecipes=[
  {preset:'shape-islands',strategy:'hammer',dodge:true},
  {preset:'shape-castle',strategy:'hammer',dodge:true},
  {preset:'shape-steps',strategy:'hammer',dodge:false}
];
const adjacent=(i,w,h)=>[[i%w-1,Math.floor(i/w)],[i%w+1,Math.floor(i/w)],[i%w,Math.floor(i/w)-1],[i%w,Math.floor(i/w)+1]].filter(([x,y])=>x>=0&&x<w&&y>=0&&y<h).map(([x,y])=>y*w+x);
function distances(map,seed,w,h){const distance=new Map([[seed,0]]),queue=[seed];for(let k=0;k<queue.length;k++)for(const j of adjacent(queue[k],w,h))if(map[j]==='.'&&!distance.has(j)){distance.set(j,distance.get(queue[k])+1);queue.push(j);}return distance;}
function makePlan(scene,alternate=0,strategy='cores',nearHammer=false){
  const {width:w,height:h}=scene,map=scene.map.slice(),at=p=>p.y*w+p.x,result=[];
  let position=at(scene.start);
  for(let tier=1;tier<=4;tier++){
    const upgrade=scene.upgrades.find(p=>p.tier===tier),core=strategy==='hammer'?(scene.upgrades.find(p=>p.tier===tier+1)||scene.hammer):scene.cores.find(p=>p.tier===tier);
    result.push([upgrade.x,upgrade.y]);position=at(upgrade);
    const outside=distances(map,position,w,h),inside=distances(map,at(core),w,h),candidates=[];
    for(let i=0;i<map.length;i++)if(map[i]==='bcde'[tier-1]){
      const sides=adjacent(i,w,h),a=Math.min(...sides.map(j=>outside.get(j)??Infinity)),b=Math.min(...sides.map(j=>inside.get(j)??Infinity));
      if(Number.isFinite(a+b))candidates.push({i,cost:nearHammer&&tier===4?a*3+b:a+b*3,inside:b});
    }
    candidates.sort((a,b)=>a.cost-b.cost||a.inside-b.inside||a.i-b.i);
    const crossing=candidates[Math.min(alternate,candidates.length-1)].i;
    result.push([crossing%w,Math.floor(crossing/w),true],[core.x,core.y]);
    map[crossing]='.';position=at(core);
  }
  result.push([scene.hammer.x,scene.hammer.y]);
  if(strategy==='hammer')for(const core of [...scene.cores].reverse())result.push([core.x,core.y]);
  result.push([scene.goal.x,scene.goal.y]);
  return result;
}
function run({preset,alternate=0,delay=0,dodge=false,recoveryExit=0,strategy='cores',nearHammer=false,recoveryWait=0}={}){
  const initial=n.start('practice',{preset});n.setPreferences({dodge});
  const scene=n.options().layouts.find(l=>l.id===initial.layout),plan=makePlan(scene,alternate,strategy,nearHammer),log=[];
  for(let stage=0;stage<plan.length;stage++){
    if(stage===1&&delay)step(delay);
    const target=plan[stage];let result=action(...target);
    log.push({target,result,lives:n.view().lives,time:+n.view().elapsed.toFixed(2)});
    while(result==='caught'&&n.view().lives>0){
      n.resumeRecovery();step(.8+recoveryWait);
      const exit=scene.recoveryExits[recoveryExit%scene.recoveryExits.length];
      result=action(exit.x,exit.y);
      if(result==='caught')continue;
      if(result!=='arrived')break;
      result=action(...target);log.push({retry:target,result,lives:n.view().lives,time:+n.view().elapsed.toFixed(2)});
    }
    if(!['arrived','won'].includes(result))break;
  }
  const state=n.view();return {preset,layout:state.layout,alternate,delay,dodge,recoveryExit,strategy,nearHammer,recoveryWait,status:state.status,lives:state.lives,cores:state.cores.filter(c=>c.collected).length,upgrade:state.upgrade,hammer:state.hammer.collected,charged:state.hammer.charged,elapsed:+state.elapsed.toFixed(2),losses:state.losses,log};
}
if(require.main===module){
  const audit=process.argv.includes('--audit');
  const selected=process.argv.find(arg=>presets.includes(arg));
  const recipes=audit?[...verifiedRecipes,...diagnosticRecipes]:selected?[verifiedRecipes.find(r=>r.preset===selected)||diagnosticRecipes.find(r=>r.preset===selected)]:verifiedRecipes;
  for(const recipe of recipes){
    const result=run(recipe);
    console.log(JSON.stringify(result));
    if(!verifiedRecipes.includes(recipe))continue;
    assert.equal(result.status,'won',`${recipe.preset} escape with optional Dodge on`);
    assert.equal(result.upgrade,4);assert.equal(result.cores,4);assert.equal(result.hammer,true);assert.equal(result.charged,true);
    assert.equal(n.returnToWoods(),true);assert.equal(S.stormHammer,true);
  }
}
module.exports={run,makePlan,verifiedRecipes,diagnosticRecipes};
