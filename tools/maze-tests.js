'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const n=require('./harness').NetherTrial;
const SAVE_KEY='tn.d4.rectangular.v1';
const scene=()=>n.options().layouts[0];
const at=(s,x,y)=>y*s.width+x;
const pointCell=(s,p)=>at(s,p.x,p.y);
const tick=seconds=>{for(let i=0;i<Math.ceil(seconds/.05);i++)n.step(.05);};

// Geometry is read from the public options API. This independent flood fill
// checks level connectivity, rather than reusing the game's route algorithm.
function component(s,map,start){
  const seen=new Set(),queue=[pointCell(s,start)];
  if(map[queue[0]]!=='.')return seen;
  seen.add(queue[0]);
  for(let head=0;head<queue.length;head++){
    const cell=queue[head],x=cell%s.width,y=Math.floor(cell/s.width);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,j=at(s,nx,ny);
      if(nx>=0&&nx<s.width&&ny>=0&&ny<s.height&&map[j]==='.'&&!seen.has(j)){seen.add(j);queue.push(j);}
    }
  }
  return seen;
}
function chambers(s){
  const remaining=new Set(s.map.flatMap((tile,i)=>tile==='.'?[i]:[])),result=[];
  while(remaining.size){const i=remaining.values().next().value,c=component(s,s.map,{x:i%s.width,y:Math.floor(i/s.width)});result.push(c);for(const cell of c)remaining.delete(cell);}
  return result;
}
function launch(mode='runner'){
  n.setPreferences({dodge:false,showRoute:true,closeView:false,highContrast:false,reducedMotion:false});
  return n.start('practice',{pursuer:mode});
}
function restoreFixture(state){
  // Synthetic scenarios are deliberately saved through the same validation seam
  // as Continue. They isolate a state transition; they are not full-run proof.
  global.localStorage.setItem(SAVE_KEY,JSON.stringify(state));
  assert.equal(n.resume(),true,'scenario must pass the real save validator');
  n.setPaused(false);
}
function arrive(x,y,maxSeconds=90){
  assert.equal(n.aim(x,y),true,`target ${x},${y} is reachable`);
  for(let i=0;i<maxSeconds/.05;i++){
    n.step(.05);const state=n.view();
    assert.equal(state.awaitingReturn,false,'route unexpectedly lost a life');
    const gap=Math.hypot(state.hero.x-x,state.hero.y-y);
    if((gap<.01&&!state.mining)||(state.status==='won'&&gap<.2))return state;
  }
  assert.fail(`did not reach ${x},${y}`);
}
function connectedFixture(mode='runner'){
  const state=launch(mode),s=scene();
  state.upgrade=4;
  for(const layer of s.layers)state.map[at(s,19,layer.y1)]='.';
  state.breaches=4;
  state.cores.forEach(core=>{core.collected=true;});
  state.enemies.forEach((enemy,i)=>{
    enemy.released=true;enemy.path=[];enemy.phase=['stalk','windup','burst','rest'][i%4];
    enemy.phaseTime=.3+(i%4)*.2;enemy.notice=.2+(i%4)*.2;enemy.wake=(i%3)*.1;enemy.wrongTurn=i%2===0;
  });
  return state;
}

test('the map has four rectangular closed shells and five connected narrow loop chambers',()=>{
  const s=scene();assert.equal(s.width,45);assert.equal(s.height,37);assert.equal(s.map.length,45*37);
  assert.equal(s.layers.length,4);assert.equal(s.upgrades.length,4);assert.equal(s.cores.length,4);assert.equal(s.enemies.length,10);
  for(const [i,l] of s.layers.entries()){
    assert.equal(l.tier,i+1);assert.notEqual(l.x2-l.x1,l.y2-l.y1,'a shell must be rectangular, not square');
    for(let x=l.x1;x<=l.x2;x++){assert.equal(s.map[at(s,x,l.y1)],l.tile);assert.equal(s.map[at(s,x,l.y2)],l.tile);}
    for(let y=l.y1;y<=l.y2;y++){assert.equal(s.map[at(s,l.x1,y)],l.tile);assert.equal(s.map[at(s,l.x2,y)],l.tile);}
    if(i){const outer=s.layers[i-1];assert.ok(l.x1>outer.x1&&l.y1>outer.y1&&l.x2<outer.x2&&l.y2<outer.y2);}
  }
  for(let y=0;y<s.height-1;y++)for(let x=0;x<s.width-1;x++)
    assert.equal([at(s,x,y),at(s,x+1,y),at(s,x,y+1),at(s,x+1,y+1)].every(i=>s.map[i]==='.'),false,`open 2x2 arena at ${x},${y}`);
  const groups=chambers(s);assert.equal(groups.length,5,'entrance plus one connected chamber per tier');
  for(const group of groups){
    let edges=0;for(const i of group){if(i%s.width<s.width-1&&group.has(i+1))edges++;if(group.has(i+s.width))edges++;}
    assert.ok(edges>=group.size,'every chamber must contain a loop, not just a dead-end chain');
  }
  assert.deepEqual(s.layers.map(l=>s.enemies.filter(e=>e.layer===l.tier).length),[2,2,3,3]);
});

test('each upgrade is reachable before its own wall, while its core and monsters remain inside',()=>{
  const s=scene(),map=s.map.slice();
  for(const layer of s.layers){
    const accessible=component(s,map,s.start),upgrade=s.upgrades.find(u=>u.tier===layer.tier);
    assert.ok(accessible.has(pointCell(s,upgrade)),`tier ${layer.tier} upgrade must precede its wall`);
    for(const core of s.cores.filter(c=>c.tier===layer.tier))assert.equal(accessible.has(pointCell(s,core)),false);
    for(const enemy of s.enemies.filter(e=>e.layer===layer.tier))assert.equal(accessible.has(pointCell(s,enemy)),false);
    map[at(s,19,layer.y1)]='.';
    const opened=component(s,map,s.start);
    for(const core of s.cores.filter(c=>c.tier===layer.tier))assert.ok(opened.has(pointCell(s,core)));
    assert.equal(s.enemies.filter(e=>opened.has(pointCell(s,e))).length,[2,4,7,10][layer.tier-1]);
  }
});

test('the real entrance route reaches the first tool and an empty exit does not win',()=>{
  launch();const s=scene(),first=s.upgrades[0];
  assert.equal(n.aim(19,s.layers[0].y1),false,'unupgraded pickaxe cannot mine tier one');
  const picked=arrive(first.x,first.y);assert.equal(picked.upgrade,1);assert.equal(picked.enemies.some(e=>e.released),false);
  const exit=arrive(s.goal.x,s.goal.y);assert.equal(exit.status,'playing');assert.equal(exit.cores.some(c=>c.collected),false);
  for(const p of [[-1,1],[s.width,1],[1,s.height],[1,-1]])assert.equal(n.aim(...p),false);
});

test('matching upgrades gate mining, and actual permanent breaches release exactly 2, 4, 7, then 10 monsters',()=>{
  launch();const s=scene();
  for(const layer of s.layers){
    let fixture=n.view();fixture.hero={x:19,y:layer.y1-1,path:[]};fixture.target=null;fixture.mining=null;
    fixture.enemies.forEach(e=>{e.path=[];e.wake=.85;e.phase='windup';e.phaseTime=.7;e.notice=1;});
    restoreFixture(fixture);assert.equal(n.aim(19,layer.y1),false,`tier ${layer.tier} wall rejects a weaker tool`);
    // Collect the authored pickup through simulation before returning to the
    // isolated mining approach. The geometry test proves their real connection.
    const upgrade=s.upgrades.find(u=>u.tier===layer.tier);
    fixture=n.view();fixture.hero={x:upgrade.x,y:upgrade.y,path:[]};restoreFixture(fixture);n.step(.05);
    assert.equal(n.view().upgrade,layer.tier);
    fixture=n.view();fixture.hero={x:19,y:layer.y1-1,path:[]};fixture.enemies.forEach(e=>{e.path=[];e.wake=.85;e.phase='windup';e.phaseTime=.7;});restoreFixture(fixture);
    assert.equal(n.aim(19,layer.y1),true);
    for(let frame=0;frame<60&&n.view().map[at(s,19,layer.y1)]!=='.';frame++)n.step(.05);
    const opened=n.view();assert.equal(opened.awaitingReturn,false);assert.equal(opened.map[at(s,19,layer.y1)],'.');
    assert.equal(opened.breaches,layer.tier);assert.equal(opened.upgrade,layer.tier,'mining does not consume the upgrade');
    assert.equal(opened.enemies.filter(e=>e.released).length,[2,4,7,10][layer.tier-1]);
    assert.equal(opened.enemies.filter(e=>e.layer>layer.tier).some(e=>e.released),false);
    for(const enemy of opened.enemies.filter(e=>e.layer===layer.tier))assert.ok(enemy.path.includes(at(s,19,layer.y1)),'newly released monsters route through the same breach');
  }
  const opened=n.view().map;tick(.1);assert.deepEqual(n.view().map,opened,'openings remain permanently passable');
});

test('opening an isolated shell corner never releases monsters by time or breach count',()=>{
  const fixture=launch(),s=scene(),wall=s.layers[0];fixture.upgrade=1;fixture.hero={x:wall.x1-1,y:wall.y1,path:[]};
  restoreFixture(fixture);assert.equal(n.aim(wall.x1,wall.y1),true);tick(2);
  assert.equal(n.view().map[at(s,wall.x1,wall.y1)],'.');assert.equal(n.view().breaches,1);
  tick(15);assert.equal(n.view().enemies.some(e=>e.released),false);assert.equal(n.view().lives,3);
});

test('Continue retains all ten identities, roles, phases, paths and earned progress and pauses the chase',()=>{
  const fixture=connectedFixture(),s=scene();
  for(const enemy of fixture.enemies){
    const next=[[enemy.x+1,enemy.y],[enemy.x-1,enemy.y],[enemy.x,enemy.y+1],[enemy.x,enemy.y-1]].find(([x,y])=>fixture.map[at(s,x,y)]==='.');
    assert.ok(next,'enemy has a real adjacent route step');enemy.path=[at(s,...next)];
  }
  restoreFixture(fixture);assert.equal(n.aim(s.recoveryExits[0].x,s.recoveryExits[0].y),true);const before=n.view();
  assert.ok(before.hero.path.length);assert.ok(before.enemies.every(e=>e.path.length));
  n.persist();n.leave();assert.equal(n.resume(),true);const after=n.view();
  assert.equal(after.paused,true);assert.equal(after.attemptId,before.attemptId);
  for(const key of ['map','hero','enemies','cores','events','rng','breaches','upgrade'])assert.deepEqual(after[key],before[key],key);
  assert.equal(new Set(after.enemies.map(e=>e.id)).size,10);assert.equal(new Set(after.enemies.map(e=>e.role)).size,3);
  tick(10);assert.deepEqual(n.view().enemies,after.enemies);n.setPaused(false);tick(.1);assert.notDeepEqual(n.view().enemies,after.enemies);
});

test('a catch with all four cores retains progress and every monster, freezes recovery, and never counts as escape',()=>{
  const fixture=connectedFixture(),s=scene();
  fixture.hero={x:19,y:5,path:[]};fixture.enemies[0]={...fixture.enemies[0],x:19,y:5,wake:0,phase:'stalk',phaseTime:1,path:[]};
  restoreFixture(fixture);n.step(.05);const caught=n.view();
  assert.equal(caught.lives,2);assert.equal(caught.status,'playing');assert.equal(caught.awaitingReturn,true);
  assert.deepEqual(caught.map,fixture.map);assert.deepEqual(caught.cores,fixture.cores);assert.equal(caught.upgrade,4);
  assert.equal(caught.enemies.length,10);assert.ok(caught.enemies.every(e=>e.released));
  assert.deepEqual({x:caught.hero.x,y:caught.hero.y},s.start);assert.equal(caught.events.some(e=>e.type==='escaped-on-foot'),false);
  tick(20);assert.deepEqual(n.view().enemies,caught.enemies);assert.equal(n.view().lives,2);
  n.persist();n.leave();assert.equal(n.resume(),true);assert.deepEqual(n.view().enemies,caught.enemies);assert.equal(n.view().awaitingReturn,true);
  assert.equal(n.resumeRecovery(),true);tick(.8);assert.equal(n.view().status,'playing');assert.equal(n.view().lives,2);
});

test('touching each authored core collects it, and zero through three cores cannot open the exit',()=>{
  let fixture=connectedFixture();fixture.cores.forEach(c=>{c.collected=false;});const s=scene();
  for(let count=0;count<4;count++){
    fixture.hero={...s.goal,path:[]};fixture.target=null;restoreFixture(fixture);n.step(.05);
    assert.equal(n.view().status,'playing',`${count} cores must not escape`);
    fixture=n.view();const core=fixture.cores[count];fixture.hero={x:core.x,y:core.y,path:[]};
    fixture.enemies.forEach(e=>{e.wake=.85;});restoreFixture(fixture);n.step(.05);fixture=n.view();
    assert.equal(fixture.cores.filter(c=>c.collected).length,count+1);assert.equal(fixture.cores[count].collected,true);
    assert.equal(fixture.events.at(-1).type,'core');
  }
});

test('only the third actual catch ends the attempt and all-core victory requires reaching the exit on foot',()=>{
  let fixture=connectedFixture();
  for(let remaining=2;remaining>=0;remaining--){
    fixture.hero={x:19,y:5,path:[]};fixture.target=null;fixture.awaitingReturn=false;fixture.recovery=0;
    fixture.enemies[0]={...fixture.enemies[0],x:19,y:5,wake:0,phase:'stalk',phaseTime:1,path:[]};
    restoreFixture(fixture);n.step(.05);fixture=n.view();assert.equal(fixture.lives,remaining);
    assert.equal(fixture.losses.length,3-remaining);assert.equal(fixture.status,remaining?'playing':'lost');
    if(remaining){n.resumeRecovery();tick(.8);fixture=n.view();}
  }
  const terminal=n.view();tick(10);assert.deepEqual(n.view(),terminal);assert.equal(n.aim(scene().goal.x,scene().goal.y),false);
  fixture=connectedFixture();const s=scene();fixture.hero={x:s.goal.x-1,y:s.goal.y,path:[]};restoreFixture(fixture);
  assert.equal(n.view().status,'playing');const won=arrive(s.goal.x,s.goal.y);assert.equal(won.status,'won');
  assert.ok(Math.hypot(won.hero.x-s.goal.x,won.hero.y-s.goal.y)<.2);assert.equal(won.events.at(-1).type,'escaped-on-foot');
});

test('four-layer settings, HUD and notes report the actual totals without changing earned state',()=>{
  restoreFixture(connectedFixture('goofy'));const before=n.view();
  n.setPreferences({dodge:true,closeView:true,highContrast:true,reducedMotion:true});const after=n.view();
  for(const key of ['attemptId','map','lives','enemies','cores','upgrade'])assert.deepEqual(after[key],before[key]);
  assert.equal(global.document.getElementById('nBeacons').textContent,'4/4 · Exit open');
  assert.match(global.document.getElementById('nThreat').textContent,/10\/10 awake/);
  const feedback={note:'Test fixture: fourth layer feedback.'},notes=JSON.parse(n.exportNotes(feedback));
  assert.match(notes.build,/TN-D4/);assert.equal(notes.version,4);assert.equal(notes.attempt.layout,scene().id);
  assert.equal(notes.trialDefaults.layers,4);assert.equal(notes.trialDefaults.monsters,10);assert.equal(notes.trialDefaults.cores,4);assert.equal(notes.trialDefaults.lives,3);
  assert.equal(notes.attempt.cores.length,4);assert.deepEqual(notes.attempt.openings.map(o=>o.tier),[1,2,3,4]);
  assert.equal(notes.attempt.settingChanges.at(-1).changed.dodge.to,true);assert.deepEqual(notes.feedback,feedback);
  assert.doesNotThrow(()=>n.draw());n.setPreferences({closeView:false});assert.doesNotThrow(()=>n.draw());
});

test('the incompatible maze save preserves prior games and rejects malformed geometry, roster and wins without erasure',()=>{
  const oldKeys=['tn.d2.lab.v2','tn.d2.lab.preferences.v1','tn.d2lab.tn.save','tn.d3.combined.v1','tn.d3.combined.v2'];
  for(const key of oldKeys)global.localStorage.setItem(key,'PRESERVED');
  const valid=connectedFixture();restoreFixture(valid);n.persist();n.leave();assert.equal(n.resume(),true);
  for(const key of oldKeys)assert.equal(global.localStorage.getItem(key),'PRESERVED');
  for(const change of [
    s=>s.map.pop(),s=>s.map[0]='.',s=>s.enemies.pop(),s=>s.enemies[0].role='teleporter',s=>s.enemies[0].phaseTime=99,
    s=>s.enemies[0].path=[0],s=>s.cores.pop(),s=>s.upgrade=5,s=>s.breaches=0,s=>s.hero.x=44,
    s=>{s.status='won';s.hero={...scene().start,path:[]};}
  ]){
    const invalid=structuredClone(valid);change(invalid);const json=JSON.stringify(invalid);global.localStorage.setItem(SAVE_KEY,json);
    assert.equal(n.resume(),false);assert.equal(global.localStorage.getItem(SAVE_KEY),json,'invalid save must remain available for recovery');
  }
});
