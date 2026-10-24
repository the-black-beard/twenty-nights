'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const n=require('./harness').NetherTrial;
const KEY='tn.d7.shapes.v1';
const tick=s=>{for(let i=0;i<Math.ceil(s/.05);i++)n.step(.05);};
const restore=s=>{localStorage.setItem(KEY,JSON.stringify(s));assert.equal(n.resume(),true);n.setPaused(false);};
test('each A/B pair changes exactly one gameplay dial',()=>{
 const presets=n.options().presets.filter(p=>!p.id.startsWith('shape-'));assert.equal(presets.length,10);
 for(const pair of ['controls','brains','walls','layers','cues']){
  const a=n.start('practice',{preset:pair+'-a'}),b=n.start('practice',{preset:pair+'-b'});
  assert.equal(['control','brain','weakSpots','cues','pursuer'].filter(k=>a.trial[k]!==b.trial[k]).length,1);
  assert.deepEqual(a.map,b.map);assert.equal(a.rng,b.rng);assert.equal(a.preferences.dodge,false);
 }
});
test('starting B retains A including feedback and exact progress; continue does not reset either',()=>{
 const a=n.start('practice',{preset:'controls-a'});n.aim(3,3);tick(9);n.recordFeedback({note:'Good surprise'});
 const progress=n.view();n.start('practice',{preset:'controls-b'});const b=n.view();
 assert.ok(n.history().some(r=>r.id===a.attemptId));assert.equal(n.resume(a.attemptId),true);
 assert.equal(n.view().paused,true);assert.equal(n.view().upgrade,progress.upgrade);assert.deepEqual(n.view().map,progress.map);
 const notes=JSON.parse(n.exportHistory());assert.ok(notes.attempts.some(r=>r.attempt.id===a.attemptId&&r.feedback.note==='Good surprise'));
 assert.equal(n.resume(b.attemptId),true);assert.equal(n.view().trial.control,'swipe');
});
test('buffered swipe holds a turn until the junction and preserves hero travel speed',()=>{
 let s=n.start('practice',{preset:'controls-b'});s.hero={x:1,y:20,path:[]};s.refuge={remaining:0,cooldown:0,inside:false};restore(s);
 assert.equal(n.queueTurn(0,-1),true);tick(1);assert.ok(Math.abs(n.view().hero.y-15.4)<.001,'swipes must travel at the same 4.6 tiles/second');
 n.queueTurn(1,0);tick(.5);const h=n.view().hero;assert.ok(Number.isInteger(h.x)||Number.isInteger(h.y),'never turn diagonally through a wall');
 n.stopWalking();tick(.3);const stopped=n.view().hero;tick(1);assert.deepEqual(n.view().hero,stopped);
});
test('optional weak spots speed up a break while all other matching walls stay mineable',()=>{
 const run=(preset,x)=>{const s=n.start('practice',{preset});s.upgrade=1;s.hero={x,y:3,path:[]};s.refuge={remaining:0,cooldown:0,inside:false};restore(s);assert.equal(n.aim(x,4),true);tick(1);return n.view();};
 assert.equal(run('walls-a',19).breaches,0);assert.equal(run('walls-b',19).breaches,1);assert.equal(run('walls-b',20).breaches,0);tick(.9);assert.equal(n.view().breaches,1);
});
test('committed rush retains its warning-time target through a full-speed burst',()=>{
 const s=n.start('practice',{pursuer:'runner',brain:'committed'});s.upgrade=1;s.map[4*45+19]='.';s.breaches=1;s.hero={x:19,y:3,path:[]};s.refuge={remaining:0,cooldown:0,inside:false};s.elapsed=6;
 const e=s.enemies[0];Object.assign(e,{x:10,y:5,released:true,wake:0,phase:'stalk',phaseTime:.01});restore(s);n.step(.05);
 const locked=n.view().enemies[0].path;assert.ok(locked.length>0);assert.equal(n.view().enemies[0].phase,'windup');n.aim(3,3);tick(.7);
 const before=n.view().enemies[0];assert.equal(before.phase,'burst');n.step(.05);const after=n.view().enemies[0];assert.ok(Math.abs(Math.hypot(after.x-before.x,after.y-before.y)-.41)<.001,'burst speed stays 8.2');
 assert.deepEqual(after.path,locked.slice(locked.length-after.path.length),'remaining route is the committed route');
});
test('a panic swipe away cancels a long auto-mining approach immediately',()=>{
 const s=n.start('practice',{preset:'controls-b'});s.upgrade=1;s.hero={x:19,y:3,path:[]};restore(s);
 assert.equal(n.aim(30,4),true);n.step(.05);const x=n.view().hero.x;assert.ok(x>19);
 assert.equal(n.queueTurn(-1,0),true);n.step(.05);assert.ok(n.view().hero.x<x);assert.equal(n.view().mining,null);
});
test('storage quota cannot erase a run from this session or its downloadable notes',()=>{
 let fallbackId;const original=localStorage.setItem;localStorage.setItem=function(k,v){if(k.startsWith('tn.d7.shapes.history'))throw new Error('quota');original.call(this,k,v);};
 try{const a=n.start('practice',{preset:'walls-a'});fallbackId=a.attemptId;n.recordFeedback({note:'Keep this'});const b=n.start('practice',{preset:'walls-b'});
 const all=JSON.parse(n.exportHistory()).attempts;assert.ok(all.some(r=>r.attempt.id===a.attemptId&&r.feedback.note==='Keep this'));assert.ok(all.some(r=>r.attempt.id===b.attemptId));assert.equal(n.resume(a.attemptId),true);
 }finally{localStorage.setItem=original;}
 n.persist();assert.ok(localStorage.getItem('tn.d7.shapes.history.v1.'+fallbackId),'storage recovery flushes earlier unsaved runs');
});
