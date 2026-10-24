'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const game=require('./harness'),n=game.NetherTrial;
const send=(kind,id,x,y,extra={})=>n.pointer(kind,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,button:0,preventDefault(){},...extra});
function restore(s){global.localStorage.setItem(n.options().saveKey,JSON.stringify(s));assert.equal(n.resume(),true);n.setPaused(false);}
function screenCell(x,y){const c=n.cameraState();return [(x+.5)*32*c.zoom-c.x*c.zoom+c.offsetX,(y+.5)*32*c.zoom-c.y*c.zoom+c.offsetY];}

test('adding and removing a second finger never sends a walking or mining command',()=>{
  n.start();n.setPreferences({closeView:false});
  // (1,30) is reachable floor in the full 45 × 37 map, letterboxed in 640 px.
  send('down',1,22,490);
  assert.equal(n.view().target,null,'the first contact waits for a complete tap');
  send('down',2,150,490);send('move',2,240,490);
  send('up',2,240,490);send('move',1,22,460);send('up',1,22,460);
  assert.equal(n.view().target,null);assert.equal(n.view().mining,null);
});

test('pinching keeps the selected zoom after release, while look-ahead returns smoothly',()=>{
  let now=0;global.performance.now=()=>now;
  n.start();n.setPreferences({closeView:true,zoom:2.2,reducedMotion:false});
  const before=n.cameraState();
  send('down',1,180,320);send('down',2,380,320);
  send('move',1,100,300);send('move',2,420,300);
  const held=n.cameraState();
  assert.ok(held.multiplier>before.multiplier,'spreading two fingers zooms in');
  assert.ok(Math.hypot(held.panX,held.panY)>0,'two-finger translation looks beyond the hero');
  send('up',1,100,300);send('up',2,420,300);
  const released=n.cameraState();now=225;const halfway=n.cameraState();
  assert.ok(Math.hypot(halfway.panX,halfway.panY)<Math.hypot(released.panX,released.panY),'return eases toward the hero');
  assert.ok(Math.hypot(halfway.panX,halfway.panY)>0,'return is animated');
  now=500;const settled=n.cameraState();
  assert.equal(settled.panX,0);assert.equal(settled.panY,0);
  assert.equal(settled.multiplier,held.multiplier,'chosen zoom is retained');
  assert.equal(n.view().target,null);
});

test('nearby cues show two corridor approaches without revealing monsters behind sealed walls',()=>{
  const s=n.start('practice',{preset:'cues-b'});s.hero={...s.hero,x:19,y:5,path:[]};
  s.enemies.forEach(e=>{e.released=false;e.wake=0;});
  Object.assign(s.enemies[0],{x:21,y:5,released:true});
  Object.assign(s.enemies[1],{x:17,y:5,released:true});
  Object.assign(s.enemies[2],{x:19,y:9,released:true});
  Object.assign(s.enemies[3],{x:29,y:5,released:true});
  restore(s);
  const cues=n.threatIndicators();
  assert.equal(cues.length,2);assert.deepEqual(cues.map(c=>[c.dx,c.dy]).sort(),[[-1,0],[1,0]]);
  assert.ok(cues.every(c=>c.distance<=7));
  assert.ok(cues.every(c=>!['nibble','goggle'].includes(c.enemy)),'sealed and distant threats keep their surprise');
  n.start('practice',{preset:'cues-a'});assert.deepEqual(n.threatIndicators(),[]);
});

test('an adjacent monster is indicated on its actual side between tile centres',()=>{
  const s=n.start('practice',{preset:'cues-b'});s.hero={...s.hero,x:19.8,y:5,path:[]};
  s.enemies.forEach(e=>{e.released=false;e.wake=0;});Object.assign(s.enemies[0],{x:19.6,y:5,released:true});restore(s);
  assert.equal(n.threatIndicators()[0].dx,-1,'the nearby monster is left, even when both actors round to the right cell');
});

test('an interrupted gesture cannot mine; a fresh single tap still opens a matching wall',()=>{
  const s=n.start();s.upgrade=1;s.hero={...s.hero,x:19,y:5,path:[]};restore(s);
  n.setPreferences({closeView:false});const [x,y]=screenCell(19,4);
  send('down',1,x,y);send('down',2,x+60,y);send('up',2,x+60,y);send('up',1,x,y);
  assert.equal(n.view().mining,null,'adding a finger never begins mining');
  send('down',3,x,y);send('cancel',3,x,y);assert.equal(n.view().paused,true);
  n.setPaused(false);send('up',3,x,y);assert.equal(n.view().mining,null,'stale release is discarded');
  send('down',4,x,y);send('up',4,x,y);assert.equal(n.view().mining.cell,4*45+19);
});

test('reduced motion recentres immediately and pinch cannot exceed the zoom limits',()=>{
  n.start();n.setPreferences({closeView:true,zoom:2.2,reducedMotion:true});
  send('down',1,250,300);send('down',2,300,300);send('move',1,5,260);send('move',2,635,260);
  assert.equal(n.cameraState().multiplier,3.2);
  send('up',1,5,260);send('up',2,635,260);
  assert.equal(n.cameraState().panX,0);assert.equal(n.cameraState().panY,0);assert.equal(n.cameraState().returning,false);
  send('down',3,50,300);send('down',4,600,300);send('move',3,300,300);send('move',4,301,300);
  send('up',3,300,300);send('up',4,301,300);
  assert.equal(n.cameraState().multiplier,1);assert.equal(n.preferences().closeView,false);
});

test('a one-finger swipe queues movement while a two-finger gesture does not turn the hero',()=>{
  n.start('practice',{preset:'controls-b'});n.setPreferences({closeView:false});
  send('down',1,300,400);send('up',1,300,330);n.step(.05);
  const after=n.view();assert.ok(after.hero.y<34,'upward swipe starts travelling up the corridor');
  send('down',2,250,300);send('down',3,350,300);send('move',2,180,300);send('up',2,180,300);send('up',3,350,300);
  n.step(.05);assert.equal(n.view().hero.x,1);assert.ok(n.view().hero.y<after.hero.y,'existing travel continues during camera use');
});
