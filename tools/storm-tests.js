'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const game=require('./harness'),n=game.NetherTrial;
const KEY='tn.d7.shapes.v1',scene=n.options().layouts[0];
const tick=s=>{for(let i=0;i<Math.ceil(s/.05);i++)n.step(.05);};
function restore(s){global.localStorage.setItem(KEY,JSON.stringify(s));assert.equal(n.resume(),true,'synthetic Continue fixture accepted');n.setPaused(false);}
function openScenario(){
 const s=n.start();s.upgrade=4;s.hammer.collected=true;
 for(const l of scene.layers)s.map[l.y1*45+19]='.';s.breaches=4;
 s.enemies.forEach(e=>{e.released=true;e.wake=.85;});
 return s;
}
test('recommended mix starts normal outside with rush monsters only in middle two layers',()=>{
 const s=n.start();assert.equal(s.pursuer,'middle');
 assert.deepEqual(s.enemies.map(e=>e.kind),['goofy','goofy','runner','runner','runner','runner','runner','goofy','goofy','goofy']);
 const d=n.start('practice',{pursuer:'deep'});assert.ok(d.enemies.filter(e=>e.layer<3).every(e=>e.kind==='goofy'));assert.ok(d.enemies.filter(e=>e.layer>=3).every(e=>e.kind==='runner'));
});
test('refuge expires after eight seconds, pauses, and leaving requires fifteen seconds to recharge',()=>{
 n.start();tick(7);assert.ok(n.view().refuge.remaining>.9);n.setPaused(true);tick(20);assert.ok(n.view().refuge.remaining>.9);n.setPaused(false);tick(1.05);assert.equal(n.view().refuge.remaining,0);
 assert.equal(n.aim(1,33),true);tick(.3);assert.ok(n.view().refuge.cooldown>14.8);tick(14);assert.ok(n.view().refuge.cooldown>0);tick(1);assert.equal(n.view().refuge.cooldown,0);assert.equal(n.view().refuge.remaining,8);
});
test('monsters can pass through the refuge corner, and exhausted protection no longer prevents a catch',()=>{
 const s=openScenario();s.refuge.remaining=.05;s.enemies[0]={...s.enemies[0],x:1,y:34,wake:0,notice:1,path:[]};restore(s);n.step(.05);assert.equal(n.view().lives,2);assert.equal(n.view().refuge.remaining,8,'next life gets bounded recovery protection');
});
test('a dormant hammer strikes just one forward monster and leaves the opposite side dangerous',()=>{
 const s=openScenario();s.hero={x:19,y:5,path:[]};s.refuge={remaining:0,cooldown:10,inside:false};s.hammer.faceX=1;s.hammer.faceY=0;
 s.enemies[0]={...s.enemies[0],x:20,y:5,wake:0};s.enemies[1]={...s.enemies[1],x:18.5,y:5,wake:0};restore(s);
 assert.equal(n.swingHammer(),true);assert.equal(n.view().enemies.filter(e=>e.stun>0).length,1);assert.equal(n.view().enemies[0].stun,.85);assert.equal(n.view().enemies[1].stun,0);assert.equal(n.view().hammer.charged,false);assert.equal(n.swingHammer(),false,'cannot spam both sides');
 n.step(.05);assert.equal(n.view().lives,2,'the unstruck monster can still catch the hero');assert.equal(n.view().hammer.collected,true,'carried prize survives a life loss');
});
test('a wall blocks a physical hammer hit, and pause blocks swings',()=>{
 const s=openScenario();s.hero={x:19,y:3.4,path:[]};s.enemies[0]={...s.enemies[0],x:19,y:4.6,wake:0};s.map[4*45+19]='b';s.breaches=3;restore(s);
 assert.equal(n.swingHammer({x:0,y:1}),true);assert.equal(n.view().enemies[0].stun,0);const opened=n.view();opened.map[4*45+19]='.';opened.breaches=4;opened.hammer.cooldown=0;restore(opened);assert.equal(n.swingHammer({x:0,y:1}),true);assert.equal(n.view().enemies[0].stun,.85,'same reachable distance is struck when passage opens');n.setPaused(true);assert.equal(n.swingHammer(),false);
});
test('hammer only charges at the physical exit, persists, and powers actual woods attacks',()=>{
 const s=openScenario();s.cores.forEach(c=>c.collected=true);s.hero={x:43,y:2,path:[]};restore(s);n.step(.05);assert.equal(n.view().hammer.charged,false);assert.equal(n.returnToWoods(),false);
 assert.equal(n.aim(43,1),true);tick(.3);assert.equal(n.view().status,'won');assert.equal(n.view().hammer.charged,true);n.leave();assert.equal(n.resume(),true);assert.equal(n.view().hammer.charged,true);
 assert.equal(n.returnToWoods(),true);assert.equal(n.isActive(),false);assert.equal(game.S.stormHammer,true);assert.equal(game.S.running,true);
 const h=game.S.hero,m={kind:'shuffler',hp:2,plates:0,fx:h.fx+2,fy:h.fy,cx:h.fx+2,cy:h.fy,prog:0};game.S.monsters=[m];h.cd=0;game.updateHero(.05);assert.equal(game.S.monsters.length,0);assert.ok(game.S.tracers.some(t=>t.lightning));
 game.save();game.S.stormHammer=false;assert.equal(game.load(),true);assert.equal(game.S.stormHammer,true);
});
test('old games remain intact and new state survives Continue without timer resets',()=>{
 global.localStorage.setItem('tn.d4.rectangular.v1','older-game');n.start();tick(3);const before=n.view();n.leave();assert.equal(n.resume(),true);assert.deepEqual(n.view().refuge,before.refuge);assert.deepEqual(n.view().hammer,before.hammer);assert.equal(global.localStorage.getItem('tn.d4.rectangular.v1'),'older-game');
 const notes=JSON.parse(n.exportNotes({note:'test'}));assert.equal(notes.attempt.monsterMix.filter(e=>e.kind==='runner').length,5);assert.equal(notes.trialDefaults.refuge.recharge,15);
});
