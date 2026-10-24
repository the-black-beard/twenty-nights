/* Action-only Storm Hammer audition; no state writes, teleports or earned items injected.
   This proves full routes exist with the default Dodge off and optional Dodge on,
   not that their difficulty or iPad controls feel fair. */
const assert=require('node:assert/strict');
const {NetherTrial:n,S}=require('./harness');
const plan=[[3,3],[40,29,true],[5,29],[40,29,true],[37,7],[36,11,true],[35,11],[8,25,true],[11,25],[12,21,true],[13,21],[29,21],[28,19,true],[23,19],[43,1]];

function defend(){
  const s=n.view();
  if(!s.hammer.collected||s.hammer.cooldown>0)return;
  const nearby=s.enemies.filter(e=>e.released&&e.stun<=0&&Math.hypot(e.x-s.hero.x,e.y-s.hero.y)<1.3)
    .sort((a,b)=>Math.hypot(a.x-s.hero.x,a.y-s.hero.y)-Math.hypot(b.x-s.hero.x,b.y-s.hero.y));
  if(nearby.length)n.swingHammer({x:nearby[0].x-s.hero.x,y:nearby[0].y-s.hero.y});
}
function step(seconds,hammer=true){for(let i=0;i<Math.ceil(seconds/.05);i++){if(hammer)defend();n.step(.05);}}
function action(x,y,mine=false,hammer=true){
  if(!n.aim(x,y))return 'blocked';
  for(let i=0;i<3000;i++){
    if(hammer)defend();n.step(.05);const s=n.view();
    if(s.status!=='playing')return s.status;
    if(s.awaitingReturn)return 'caught';
    if(mine?s.map[y*45+x]==='.':Math.hypot(s.hero.x-x,s.hero.y-y)<.15)return 'arrived';
  }
  return 'timeout';
}
function run({mode='middle',delay=4,recoveryWait=0,recoveryExit=[1,31],route=plan,hammer=true,dodge=true}={}){
  n.start('practice',{pursuer:mode});n.setPreferences({dodge});const log=[];
  for(const [i,target] of route.entries()){
    if(i===1)step(delay,hammer);
    let result=action(target[0],target[1],target[2]||false,hammer);
    log.push({target,result,lives:n.view().lives,time:+n.view().elapsed.toFixed(2)});
    while(result==='caught'&&n.view().lives>0){
      n.resumeRecovery();step(.8+recoveryWait,hammer);
      if(recoveryExit){const escaped=action(...recoveryExit,false,hammer);log.push({exit:recoveryExit,result:escaped,lives:n.view().lives,time:+n.view().elapsed.toFixed(2)});if(escaped==='caught')continue;if(escaped!=='arrived'){result=escaped;break;}}
      result=action(target[0],target[1],target[2]||false,hammer);log.push({retry:target,result,lives:n.view().lives,time:+n.view().elapsed.toFixed(2)});
    }
    if(!['arrived','won'].includes(result))break;
  }
  const s=n.view();
  return {mode,delay,recoveryWait,recoveryExit,dodge,build:s.build,status:s.status,lives:s.lives,upgrade:s.upgrade,cores:s.cores.filter(c=>c.collected).length,hammer:s.hammer,monsters:s.enemies.filter(e=>e.released).length,elapsed:+s.elapsed.toFixed(2),losses:s.losses,swings:s.events.filter(e=>e.type==='hammer-swing').length,hits:s.events.filter(e=>e.type==='hammer-swing'&&e.enemy).length,exit:s.events.find(e=>e.type==='escaped-on-foot')||null,log};
}
if(require.main===module)for(const recipe of [{mode:'middle',delay:4,dodge:true},{mode:'goofy',delay:12,dodge:true},{mode:'middle',delay:2,dodge:false}]){
  const result=run(recipe);
  assert.equal(result.status,'won',JSON.stringify(result));
  assert.ok(result.lives>0);assert.equal(result.upgrade,4);assert.equal(result.cores,4);assert.equal(result.monsters,10);
  assert.equal(result.hammer.collected,true);assert.equal(result.hammer.charged,true);
  assert.ok(result.exit&&Math.hypot(result.exit.x-43,result.exit.y-1)<.2);
  assert.ok(result.hits>0,'a deliberate physical hammer swing hits one monster');
  assert.equal(n.returnToWoods(),true,'earned exit enables the explicit return action');
  assert.equal(S.stormHammer,true,'the isolated woods receives the earned charged hammer');
  console.log(JSON.stringify({...result,woodsReturn:'charged hammer received'}));
}
module.exports={run,action,step,plan};
