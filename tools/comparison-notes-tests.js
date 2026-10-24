const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const n=require('./harness').NetherTrial;
const element=id=>global.document.getElementById(id);
const change=(id,type='change')=>{for(const listener of element(id).listeners[type]||[])listener({preventDefault(){}});};
const choose=(pair,side)=>{element('nPair'+pair[0].toUpperCase()+pair.slice(1)).click();element('nVariant'+side.toUpperCase()).click();element('nStart').click();};

async function downloadedBy(buttonId){
  let blob=null,anchor=null;
  const make=global.document.createElement,create=global.URL.createObjectURL;
  global.document.createElement=(tag)=>{const node=make(tag);if(tag==='a')anchor=node;return node;};
  global.URL.createObjectURL=(value)=>{blob=value;return 'blob:local-test';};
  try{element(buttonId).click();}
  finally{global.document.createElement=make;global.URL.createObjectURL=create;}
  assert.ok(blob);assert.ok(anchor);
  return {notes:JSON.parse(await blob.text()),filename:anchor.download};
}

test('the graphical A/B choices launch every named variant and keep separate adventures',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  for(const id of ['nVariantA','nVariantB','nHistory','nSavedDownloadNotes','nHistoryDownload'])assert.match(html,new RegExp('id="'+id+'"'));
  for(const pair of ['controls','brains','walls','layers','cues']){
    for(const side of ['a','b']){
      choose(pair,side);
      assert.equal(n.view().trial.preset,pair+'-'+side);
      assert.equal(n.view().lives,3);
      assert.equal(n.view().preferences.dodge,false);
      const id=n.view().attemptId;
      element('nEndMenu').click();
      assert.equal(element('nHistory').value,id);
    }
  }
  assert.equal(n.history().length,10);
});

test('a stopped A adventure retains exact notes and progress after starting B',()=>{
  global.localStorage.setItem('tn.d3.combined.v1','CANDIDATE_1_PRESERVED');
  global.localStorage.setItem('tn.d5.storm.v1','STORM_HAMMER_PRESERVED');
  choose('controls','a');
  assert.equal(n.aim(3,3),true);
  for(let i=0;i<180;i++)n.step(.05);
  const a=n.view();assert.equal(a.upgrade,1);
  element('nSettingsOpen').click();element('nMenu').click();
  assert.equal(element('nContinuePanel').classList.contains('hidden'),false);
  element('nSavedMoment').value='A made the route exciting.';change('nSavedMoment','input');
  const notes=JSON.parse(n.exportSavedNotes({},a.attemptId));
  assert.equal(notes.attempt.id,a.attemptId);
  assert.equal(notes.attempt.trial.preset,'controls-a');
  assert.equal(notes.attempt.recordedAs,'stopped-for-comparison');
  assert.deepEqual(notes.attempt.events,a.events);
  assert.equal(notes.attempt.upgrade,1);
  assert.equal(notes.feedback.note,'A made the route exciting.');
  assert.match(notes.build,/comparison-lab-1$/);
  choose('controls','b');
  assert.notEqual(n.view().attemptId,a.attemptId);
  assert.equal(n.view().trial.preset,'controls-b');
  element('nEndMenu').click();element('nHistory').value=a.attemptId;change('nHistory');element('nResume').click();
  assert.equal(n.view().attemptId,a.attemptId);
  assert.equal(n.view().upgrade,1);assert.equal(n.view().paused,true);
  assert.equal(element('nFeedbackNote').value,'A made the route exciting.');
  assert.equal(global.localStorage.getItem('tn.d3.combined.v1'),'CANDIDATE_1_PRESERVED');
  assert.equal(global.localStorage.getItem('tn.d5.storm.v1'),'STORM_HAMMER_PRESERVED');
});

test('visible saved-run and comparison download buttons export the selected adventure and all runs',async()=>{
  choose('walls','b');
  assert.equal(n.aim(3,3),true);for(let i=0;i<180;i++)n.step(.05);
  element('nSettingsOpen').click();element('nMenu').click();
  const a=n.view();
  element('nSavedMoment').value='A good surprise at the first cracked wall.';change('nSavedMoment','input');
  choose('brains','b');const b=n.view();element('nEndMenu').click();
  element('nHistory').value=a.attemptId;change('nHistory');
  const {notes,filename}=await downloadedBy('nSavedDownloadNotes');
  assert.equal(filename,'nether-comparison-'+a.attemptId+'-notes.json');
  assert.equal(notes.attempt.id,a.attemptId);
  assert.equal(notes.attempt.recordedAs,'stopped-for-comparison');
  assert.equal(notes.feedback.note,'A good surprise at the first cracked wall.');
  assert.equal(notes.attempt.trial.weakSpots,true);
  assert.equal(element('nSavedExportStatus').textContent,'Notes downloaded. Nothing was sent.');
  const all=await downloadedBy('nHistoryDownload');
  assert.equal(all.filename,'nether-comparisons-notes.json');
  assert.equal(all.notes.attempts.find(run=>run.attempt.id===a.attemptId).feedback.note,notes.feedback.note);
  assert.equal(all.notes.attempts.find(run=>run.attempt.id===b.attemptId).attempt.trial.preset,'brains-b');
});

test('custom dials and the Map button use the requested mix and restore a useful close view',()=>{
  element('nCustomControl').value='swipe';element('nCustomBrain').value='tracking';element('nCustomLayers').value='three';element('nCustomWalls').value='weak';element('nCustomCues').value='off';element('nCustomStart').click();
  const t=n.view().trial;
  assert.equal(t.preset,'custom');assert.equal(t.control,'swipe');assert.equal(t.brain,'tracking');assert.equal(t.pursuer,'three');assert.equal(t.weakSpots,true);assert.equal(t.cues,false);
  n.setPreferences({zoom:1,closeView:false});
  assert.equal(element('nCameraToggle').textContent,'Close view');element('nCameraToggle').click();
  assert.equal(n.preferences().closeView,true);assert.equal(n.preferences().zoom,2.2);
  assert.equal(element('nCameraToggle').textContent,'Map');element('nCameraToggle').click();assert.equal(n.preferences().closeView,false);
});
