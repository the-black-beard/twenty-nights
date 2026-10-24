'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const n=require('./harness').NetherTrial;
test('shape comparisons select their own maze and retain earlier maps through Continue',()=>{
 const a=n.start('practice',{preset:'shape-islands'});assert.equal(a.layout,'loop-islands-v1');
 n.recordFeedback({note:'One good loop'});n.step(.05);const before=n.view();
 const b=n.start('practice',{preset:'shape-steps'});assert.equal(b.layout,'stepped-islands-v1');assert.notDeepEqual(b.map,a.map);
 assert.equal(n.resume(a.attemptId),true);assert.equal(n.view().layout,a.layout);assert.deepEqual(n.view().map,before.map);assert.equal(n.view().paused,true);
 assert.equal(n.resume(b.attemptId),true);assert.equal(n.view().layout,b.layout);
 const history=JSON.parse(n.exportHistory()).attempts;assert.ok(history.some(r=>r.attempt.id===a.attemptId&&r.feedback.note==='One good loop'));assert.ok(history.some(r=>r.attempt.id===b.attemptId));
});
test('all shape presets keep gameplay dials and seed fixed while maps differ',()=>{
 const records=n.options().presets.filter(p=>p.id.startsWith('shape-')).map(p=>n.start('practice',{preset:p.id}));assert.equal(records.length,5);
 const rules=s=>({control:s.trial.control,brain:s.trial.brain,weakSpots:s.trial.weakSpots,cues:s.trial.cues,pursuer:s.pursuer,lives:s.lives,rng:s.rng});
 for(const s of records)assert.deepEqual(rules(s),rules(records[0]));
 assert.equal(new Set(records.map(s=>s.map.join(''))).size,5);
});
test('music stays outside a shaped wall when the hero stands in its inward bay',()=>{
 for(const [layout,x,y] of [['stepped-islands-v1',5,5],['castle-islands-v1',5,15]]){
  const s=n.start('practice',{layout});assert.equal(s.map[y*45+x],'.');
  s.hero={x,y,path:[]};localStorage.setItem(n.options().saveKey,JSON.stringify(s));
  assert.equal(n.resume(),true);assert.equal(n.musicState().depth,0);
 }
});
test('notes and Continue bind holes, returns and physical audio depth to each selected map',()=>{
 const ids=[];
 for(const l of n.options().layouts){
  const s=n.start('practice',{layout:l.id}),cell=l.weakCells[0];s.upgrade=1;s.map[cell]='.';s.breaches=1;
  localStorage.setItem(n.options().saveKey,JSON.stringify(s));assert.equal(n.resume(),true);n.persist();ids.push({id:s.attemptId,layout:l.id,cell});
  for(const c of l.cores){const v=n.view();v.hero={x:c.x,y:c.y,path:[]};localStorage.setItem(n.options().saveKey,JSON.stringify(v));assert.equal(n.resume(),true);assert.equal(n.musicState().depth,c.tier,'core is inside its own chamber');}
 }
 const notes=JSON.parse(n.exportHistory()).attempts;
 for(const r of ids){const a=notes.find(a=>a.attempt.id===r.id).attempt;assert.equal(a.layout,r.layout);assert.deepEqual(a.openings,[{x:r.cell%45,y:Math.floor(r.cell/45),tier:1}]);assert.equal(n.resume(r.id),true);assert.equal(n.view().map[r.cell],'.');}
 const invalid=n.view();invalid.layout='missing-map';localStorage.setItem(n.options().saveKey,JSON.stringify(invalid));assert.equal(n.resume(),false);assert.equal(JSON.parse(localStorage.getItem(n.options().saveKey)).layout,'missing-map','rejected source left untouched');
});
