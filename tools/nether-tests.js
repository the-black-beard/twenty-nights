const assert = require('node:assert/strict');
const test = require('node:test');
const g = require('./harness.js');

test('finishing the woods enters a separate three-life Nether attempt and preserves its checkpoint', () => {
  assert.equal(typeof g.NetherTrial, 'object', 'real game must expose its Nether phase through the existing harness');
  g.newGame(); g.S.day = 20; g.S.pips = Array(20).fill(1); g.S.wood = 41;
  g.NetherTrial.enterFromWoods();
  const v = g.NetherTrial.view();
  assert.equal(v.lives, 3); assert.equal(v.status, 'playing'); assert.equal(v.origin, 'woods');
  const woods = JSON.parse(g.store.get('tn.woods-complete'));
  assert.equal(woods.day, 20); assert.equal(woods.wood, 41); assert.deepEqual(woods.pips, Array(20).fill(1));
  assert.equal(g.S.running, false, 'woods clock must stop during the Nether');
});

function walkTo(x,y,stopWhen) {
  assert.equal(g.NetherTrial.aim(x,y), true, `target ${x},${y} should be reachable`);
  for(let i=0;i<1600;i++){
    g.NetherTrial.step(.025);
    const v=g.NetherTrial.view();
    if(stopWhen ? stopWhen(v) : Math.hypot(v.hero.x-x,v.hero.y-y)<.01) return v;
    assert.equal(v.status,'playing','route ended before reaching its destination');
  }
  assert.fail(`did not reach ${x},${y}`);
}

test('a reachable upgrade unlocks a deliberately chosen permanent wall opening', () => {
  const n=g.NetherTrial;n.start();
  assert.equal(n.aim(5,6),false);assert.match(n.view().message,/upgrade/i);
  walkTo(3,3,v=>v.upgrade===1);
  assert.equal(n.view().upgrade,1);
  assert.equal(n.aim(5,6),true);
  for(let i=0;i<800 && n.view().map[g.idx(5,6)]!=='.';i++)n.step(.025);
  assert.equal(n.view().map[g.idx(5,6)],'.','the selected brick is now a shared passage');
  assert.equal(n.view().upgrade,1,'opening a passage does not consume the upgrade');
});

test('the released pursuer follows the opening; a catch costs one life and retains earned state', () => {
  const n=g.NetherTrial;n.start();walkTo(3,3,v=>v.upgrade===1);n.aim(5,6);
  for(let i=0;i<800 && n.view().map[g.idx(5,6)]!=='.';i++)n.step(.025);
  for(let i=0;i<1000 && n.view().lives===3;i++)n.step(.025);
  let v=n.view();assert.equal(v.lives,2);assert.equal(v.returns,1);assert.equal(v.upgrade,1);
  assert.equal(v.map[g.idx(5,6)],'.');assert.equal(v.enemy.released,true);
  assert.deepEqual([v.hero.x,v.hero.y],[2,16]);
  const enemyAtReturn=[v.enemy.x,v.enemy.y];
  for(let i=0;i<100;i++)n.step(.025);
  v=n.view();assert.equal(v.lives,2,'safe recovery does not chain another loss');
  assert.notDeepEqual([v.enemy.x,v.enemy.y],enemyAtReturn,'the released enemy is still active outside the refuge');
});

test('three void falls exhaust the budget; waiting and re-aiming cannot revive a lost attempt', () => {
  const n=g.NetherTrial;n.start();
  for(const remaining of [2,1,0]){
    for(let i=0;i<40;i++)n.step(.025);
    walkTo(16,5,v=>v.lives===remaining);
  }
  assert.equal(n.view().status,'lost');assert.equal(n.view().lives,0);
  const ended=n.view();assert.equal(n.aim(3,3),false);
  for(let i=0;i<100;i++)n.step(.025);
  assert.deepEqual(n.view(),ended);
});

test('save and continue preserve a spent life, upgrade, opening and active pursuer; replay resets them', () => {
  const n=g.NetherTrial;n.start();walkTo(3,3,v=>v.upgrade===1);n.aim(5,6);
  for(let i=0;i<1200 && n.view().lives===3;i++)n.step(.025);
  const before=n.view();assert.equal(before.lives,2);
  global.localStorage.setItem('tn.save','ORIGINAL_WOODS_SENTINEL');
  assert.equal(n.persist(),true);n.leave();assert.equal(n.resume(),true);
  const restored=n.view();assert.equal(restored.lives,2);assert.equal(restored.upgrade,1);
  assert.deepEqual(restored.map,before.map);assert.deepEqual(restored.enemy,before.enemy);
  assert.equal(global.localStorage.getItem('tn.save'),'ORIGINAL_WOODS_SENTINEL');
  n.replay();assert.equal(n.view().lives,3);assert.equal(n.view().upgrade,0);
  assert.equal(n.view().map[g.idx(5,6)],'b');assert.equal(n.view().enemy.released,false);
});

test('an interrupted route reverses immediately and finishes the final fraction of its destination tile', () => {
  const n=g.NetherTrial;n.start();n.aim(2,12);n.step(.05);const y=n.view().hero.y;
  n.aim(2,16);n.step(.025);assert.ok(n.view().hero.y>y,'reverse should not finish the wrong-way tile');
  for(let i=0;i<20;i++)n.step(.025);
  assert.equal(n.view().hero.y,16);
  n.aim(2,15);n.step(.05);n.aim(2,16);
  for(let i=0;i<20;i++)n.step(.025);
  assert.equal(n.view().hero.y,16,'an empty tile-level route still covers the final fraction');
});

test('the reachable inner destination completes this layer without awarding an unbuilt hammer or Swarm', () => {
  const n=g.NetherTrial;n.start();walkTo(3,3,v=>v.upgrade===1);n.aim(8,14);
  for(let i=0;i<1000 && n.view().map[g.idx(8,14)]!=='.';i++)n.step(.025);
  walkTo(10,12,v=>v.status==='won');
  assert.equal(n.view().status,'won');assert.ok(n.view().lives>0);
  assert.match(n.view().message,/first layer complete/i);assert.equal(n.view().hammer,undefined);
});

test('invalid saves are rejected without turning a zero-life attempt into a new one', () => {
  const n=g.NetherTrial;const key='tn.d2.nether.v1';
  global.localStorage.setItem(key,'{"version":1,"lives":0}');
  assert.equal(n.resume(),false);
  n.start();for(const remaining of [2,1,0]){
    for(let i=0;i<40;i++)n.step(.025);walkTo(16,5,v=>v.lives===remaining);
  }
  n.leave();assert.equal(n.resume(),true);assert.equal(n.view().status,'lost');assert.equal(n.view().lives,0);
});

test('blocked browser storage does not crash local play or silently report a successful save', () => {
  const original=global.localStorage.setItem;
  try{
    global.localStorage.setItem=()=>{throw new Error('blocked storage');};
    assert.doesNotThrow(()=>g.NetherTrial.start());
    assert.equal(g.NetherTrial.persist(),false);
    assert.equal(g.NetherTrial.view().lives,3);
  }finally{global.localStorage.setItem=original;}
});

test('the actual Night-20 dawn transition enters the Nether and preserves all twenty Pips', async () => {
  g.newGame();g.S.day=20;g.S.phase='night';g.S.pips=Array(20).fill(1);g.S.wood=37;
  g.dawn(true,false);
  await new Promise(resolve=>setTimeout(resolve,2350));
  assert.equal(g.NetherTrial.isActive(),true);assert.equal(g.NetherTrial.view().origin,'woods');
  const checkpoint=JSON.parse(g.store.get('tn.woods-complete'));
  assert.equal(checkpoint.day,20);assert.equal(checkpoint.wood,37);assert.deepEqual(checkpoint.pips,Array(20).fill(1));
});
