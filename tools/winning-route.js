// Verified action-only Goofy replay. No injected hero positions or earned state.
const assert=require('node:assert/strict');
const n=require('./harness').NetherTrial,{action,step}=require('./maze-playthrough');
const plan=[[3, 3], [40, 29, true], [5, 29], [40, 29, true], [37, 7], [36, 11, true], [35, 11], [8, 25, true], [11, 25], [12, 21, true], [13, 21], [29, 21], [28, 19, true], [23, 19], [43, 1]];
n.setPreferences({dodge:true});n.start('practice',{pursuer:'goofy'});
for(const [i,target] of plan.entries()){
  if(i===1)step(12);
  let result=action(...target);
  while(result==='caught'&&n.view().lives>0){
    n.resumeRecovery();step(.8);
    step((12-n.view().elapsed%16+16)%16+.1);
    assert.equal(action(1,31),'arrived');
    result=action(...target);
  }
  assert.ok(['arrived','won'].includes(result),JSON.stringify({target,result}));
}
const s=n.view();assert.equal(s.status,'won');assert.equal(s.lives,2);
assert.equal(s.upgrade,4);assert.equal(s.cores.filter(c=>c.collected).length,4);
assert.equal(s.enemies.filter(e=>e.released).length,10);
assert.ok(Math.hypot(s.hero.x-43,s.hero.y-1)<.2);
console.log(JSON.stringify({build:s.build,status:s.status,lives:s.lives,upgrades:s.upgrade,cores:4,monsters:10,elapsed:s.elapsed}));
