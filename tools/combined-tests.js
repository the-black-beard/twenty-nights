const {test}=require('node:test');
const assert=require('node:assert/strict');
const n=require('./harness').NetherTrial;
const tick=(seconds)=>{for(let i=0;i<Math.ceil(seconds/.05);i++)n.step(.05);};
const go=(x,y,limit=30)=>{
  assert.equal(n.aim(x,y),true,`reachable ${x},${y}`);
  for(let i=0;i<limit/.05;i++){
    n.step(.05);const s=n.view();
    if(s.awaitingReturn||s.status!=='playing')return s;
    if(Math.hypot(s.hero.x-x,s.hero.y-y)<.01&&!s.mining)return s;
  }
  throw Error(`did not arrive at ${x},${y}`);
};

test('the first reachable upgrade opens tier one, while the stronger wall still requires tier two',()=>{
  n.start();
  assert.equal(n.aim(3,5),false);
  go(2,2);
  assert.equal(n.view().upgrade,1);
  assert.equal(n.aim(7,8),false);
  go(2,5);
  assert.equal(n.aim(3,5),true);tick(2);
  const s=n.view();assert.equal(s.map[5*20+3],'.');
  assert.equal(s.enemies.filter(e=>e.released).length,1);
  assert.equal(s.enemies[1].released,false);
});

test('a void fall keeps the fixed maze and upgrade, and only the third loss ends the adventure',()=>{
  n.start();go(2,2);const fixed=n.view().map;
  for(let life=2;life>=0;life--){
    go(1,1);
    const s=n.view();assert.equal(s.lives,life);assert.equal(s.upgrade,1);assert.deepEqual(s.map,fixed);
    if(life){assert.equal(s.awaitingReturn,true);tick(10);assert.equal(n.view().lives,life);n.resumeRecovery();tick(.8);}
    else{assert.equal(s.status,'lost');assert.equal(n.aim(17,2),false);tick(10);assert.equal(n.view().lives,0);}
  }
});

const {action,run,step:advance}=require('./route-sweep');
const savedKey='tn.d3.combined.v2';
const roundtrip=()=>{assert.equal(n.persist(),true);n.leave();assert.equal(n.resume(),true);n.setPaused(false);};
function openFirst(mode='goofy'){
 n.setPreferences({dodge:true});n.start('practice',{pursuer:mode});
 for(const a of [[2,2],[3,5,true],[5,5],[14,14]])assert.equal(action(...a),'arrived');
}

test('opening an unconnected corner does not wake a monster, and upgrades are reusable on weaker walls',()=>{
 n.start();go(2,2);assert.equal(action(3,3,true),'arrived');
 assert.equal(n.view().enemies.some(e=>e.released),false);
 assert.equal(action(3,5,true),'arrived');assert.equal(n.view().enemies.filter(e=>e.released).length,1);
 go(5,5);go(14,14);assert.equal(n.view().upgrade,2);
 assert.equal(action(16,14,true),'arrived');assert.equal(n.view().upgrade,2);
 assert.equal(n.view().enemies.filter(e=>e.released).length,1);
});

test('both chase choices collect real cores and require a physical exit, with the same map and roster',()=>{
 let initial=[];
 for(const mode of ['goofy','runner']){n.start('practice',{pursuer:mode});initial.push(n.view());go(17,2);assert.equal(n.view().status,'playing');}
 assert.deepEqual(initial[0].map,initial[1].map);assert.deepEqual(initial[0].enemies,initial[1].enemies);assert.deepEqual(initial[0].cores,initial[1].cores);
 const a=run('goofy',[10,12,true],[[16,14,true]],[3,17]);assert.equal(a.status,'won');assert.equal(a.lives,3);
 const b=run('runner',[7,11,true],[],[3,17]);assert.equal(b.status,'won');assert.equal(b.lives,2);
 for(const result of [a,b])assert.ok(result.log.some(row=>row.includes('won')));
 const s=n.view();assert.equal(s.cores.every(c=>c.collected),true);assert.equal(s.enemies.every(e=>e.released),true);assert.ok(Math.hypot(s.hero.x-17,s.hero.y-2)<.2);
});

test('one collected core does not unlock the physical exit',()=>{
 n.start();for(const a of [[2,2],[3,5,true],[5,5]])assert.equal(action(...a),'arrived');
 let r=action(17,2);
 if(r==='caught'){n.resumeRecovery();advance(.8);r=action(17,2);}
 assert.equal(r,'arrived');assert.equal(n.view().cores.filter(c=>c.collected).length,1);assert.equal(n.view().status,'playing');
});

test('a catch after both cores retains all progress, freezes pursuers, and cannot count as escape',()=>{
 openFirst('runner');assert.equal(action(7,11,true),'arrived');assert.equal(action(11,8),'arrived');
 const before=n.view();assert.equal(before.enemies.every(e=>e.released),true);
 assert.equal(action(17,2),'caught');const caught=n.view();
 assert.equal(caught.status,'playing');assert.equal(caught.lives,2);assert.equal(caught.upgrade,2);assert.deepEqual(caught.map,before.map);assert.deepEqual(caught.cores,before.cores);
 assert.equal(caught.hero.x,2);assert.equal(caught.hero.y,17);assert.equal(caught.enemies.every(e=>e.released),true);
 advance(20);assert.deepEqual(n.view().enemies,caught.enemies);assert.equal(n.view().lives,2);
 assert.equal(n.persist(),true);n.leave();assert.equal(n.resume(),true);const continued=n.view();
 assert.equal(continued.attemptId,caught.attemptId);assert.deepEqual(continued.map,caught.map);assert.deepEqual(continued.enemies,caught.enemies);assert.deepEqual(continued.cores,caught.cores);
 assert.equal(continued.awaitingReturn,true);n.resumeRecovery();advance(.8);
 advance(10);assert.equal(n.view().lives,2);assert.equal(n.view().status,'playing');
 assert.equal(action(3,17),'arrived');assert.equal(n.view().lives,2);
});

test('Continue preserves active movement and chase phases, while pausing until the player resumes',()=>{
 openFirst('runner');assert.equal(n.aim(13,13),true);tick(.3);const before=n.view();
 n.persist();n.leave();assert.equal(n.resume(),true);const after=n.view();
 assert.equal(after.paused,true);assert.deepEqual(after.enemies,before.enemies);assert.deepEqual(after.hero,before.hero);assert.deepEqual(after.events,before.events);
 tick(10);assert.deepEqual(n.view().hero,after.hero);n.setPaused(false);tick(.2);assert.notDeepEqual(n.view().hero,after.hero);
});

test('notes identify the exact adventure, rules, setting changes and a single design question',()=>{
 n.setPreferences({dodge:true});n.start();const first=n.view().attemptId;
 n.setPreferences({dodge:false});go(2,2);
 const notes=JSON.parse(n.exportNotes({feeling:'exciting',note:'The deeper wall moment.'}));
 assert.equal(notes.attempt.id,first);assert.match(notes.build,/TN-D3-01/);assert.equal(notes.attempt.layout,'nested-loops-v1');assert.equal(notes.attempt.initialPreferences.dodge,true);assert.equal(notes.attempt.preferences.dodge,false);
 assert.deepEqual(notes.attempt.settingChanges[0].changed.dodge,{from:true,to:false});assert.match(notes.question,/deeper wall/);assert.equal(notes.attempt.events[0].type,'upgrade');
 n.start();assert.notEqual(n.view().attemptId,first);n.setPreferences({dodge:true});
});

test('new save identities preserve all previous games and reject malformed attempts without erasing them',()=>{
 for(const key of ['tn.d2.lab.v2','tn.d2.lab.preferences.v1','tn.d2lab.tn.save','tn.d3.combined.v1'])global.localStorage.setItem(key,'PRESERVED');
 n.start();go(2,2);roundtrip();
 for(const key of ['tn.d2.lab.v2','tn.d2.lab.preferences.v1','tn.d2lab.tn.save','tn.d3.combined.v1'])assert.equal(global.localStorage.getItem(key),'PRESERVED');
 const valid=n.view();
 for(const change of [s=>s.map[0]='.',s=>s.enemies[0].phaseTime=999,s=>s.cores[0].x=18,s=>s.lives=9,s=>{s.status='won';s.cores.forEach(c=>c.collected=true);}]){
  const bad=structuredClone(valid);change(bad);const text=JSON.stringify(bad);global.localStorage.setItem(savedKey,text);assert.equal(n.resume(),false);assert.equal(global.localStorage.getItem(savedKey),text);
 }
});

test('the close camera draws the two-layer overview with both monsters and collectible cores',()=>{
 n.start();n.setPreferences({closeView:true});assert.doesNotThrow(()=>n.draw());n.setPreferences({closeView:false});
});
