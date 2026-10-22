'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {NetherTrial:n}=require('./harness.js');
// A valid saved corridor scenario isolates relative chase speed. This is a
// deterministic physics fixture, separate from full action-driven completion.
function corridor(){
 n.start('practice',{pursuer:'runner'});
 const s=n.view();s.preferences.dodge=false;
 s.upgrade=1;s.map[229]='.';s.breaches=1;
 s.hero={x:1,y:9,path:[]};
 s.enemies[0]={...s.enemies[0],x:1,y:13,path:[541,496,451,406],released:true,wake:0,phase:'burst',phaseTime:1.1};
 global.localStorage.setItem('tn.d4.rectangular.v1',JSON.stringify(s));
 assert.equal(n.resume(),true);n.setPaused(false);assert.equal(n.aim(1,2),true);
}
test('a rushing Runner visibly closes on a fleeing player and keeps chasing beyond the old target',()=>{
 corridor();
 for(let i=0;i<8;i++)n.step(.05);
 let s=n.view();let gap=s.enemies[0].y-s.hero.y;
 assert.equal(s.awaitingReturn,false);
 assert.ok(gap<=2.8,`rush should close at least 1.2 tiles in 0.4 seconds; gap=${gap}`);
 for(let i=0;i<6;i++)n.step(.05);
 s=n.view();assert.ok(s.enemies[0].y<8,`rush must follow beyond the old target at y=9; actual y=${s.enemies[0].y}`);
});

test('the faster rush catches a nearby fleeing player but a four-tile head start survives into recovery',()=>{
 corridor();let close=n.view();close.hero.y=10;close.hero.path=[];close.target=null;
 global.localStorage.setItem('tn.d4.rectangular.v1',JSON.stringify(close));
 assert.equal(n.resume(),true);n.setPaused(false);n.aim(1,2);
 for(let i=0;i<20&&!n.view().awaitingReturn;i++)n.step(.05);
 assert.equal(n.view().lives,2);assert.equal(n.view().lastLoss,'caught');
 assert.equal(n.view().awaitingReturn,true);
 corridor();
 for(let i=0;i<24;i++)n.step(.05);
 assert.equal(n.view().enemies[0].phase,'rest');assert.equal(n.view().lives,3);
});
