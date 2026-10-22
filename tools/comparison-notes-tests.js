const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const n=require('./harness').NetherTrial;

test('a stopped first chase offers its exact notes before the second chase replaces the current save',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
  assert.equal(html.includes('<button id="nSavedDownloadNotes" class="nButton nButtonQuiet" type="button">Download notes for this adventure</button>'),true);
  global.localStorage.setItem('tn.d3.combined.v1','CANDIDATE_1_PRESERVED');
  n.start('practice',{pursuer:'goofy'});
  assert.equal(n.aim(3,3),true);
  for(let i=0;i<180;i++)n.step(.05);
  const a=n.view();assert.equal(a.upgrade,1);
  n.setPaused(true);n.leave();
  assert.equal(global.document.getElementById('nContinuePanel').classList.contains('hidden'),false);
  const notes=JSON.parse(n.exportSavedNotes({note:'PICK 1 made the route exciting.'}));
  assert.equal(notes.attempt.id,a.attemptId);
  assert.equal(notes.attempt.pursuer,'goofy');
  assert.equal(notes.attempt.status,'playing');
  assert.equal(notes.attempt.recordedAs,'stopped-for-comparison');
  assert.deepEqual(notes.attempt.events,a.events);
  assert.equal(notes.attempt.upgrade,1);
  assert.equal(notes.feedback.note,'PICK 1 made the route exciting.');
  assert.match(notes.build,/rectangular-2$/);
  const query=global.document.querySelector;
  global.document.querySelector=(selector)=>selector==='input[name="nPursuer"]:checked'?{value:'runner'}:query(selector);
  try{global.document.getElementById('nStart').click();}
  finally{global.document.querySelector=query;}
  assert.notEqual(n.view().attemptId,a.attemptId);
  assert.equal(JSON.parse(n.exportNotes()).attempt.pursuer,'runner');
  assert.equal(notes.attempt.pursuer,'goofy');
  assert.equal(global.localStorage.getItem('tn.d3.combined.v1'),'CANDIDATE_1_PRESERVED');
});

test('the visible menu button downloads the saved first attempt, not a stale or later state',async()=>{
  n.start('practice',{pursuer:'goofy'});
  assert.equal(n.aim(3,3),true);for(let i=0;i<180;i++)n.step(.05);
  global.document.getElementById('nSettingsOpen').click();
  global.document.getElementById('nMenu').click();
  assert.equal(n.isActive(),false);
  const a=n.view();
  const panel=global.document.getElementById('nContinuePanel');
  assert.equal(panel.classList.contains('hidden'),false);
  global.document.getElementById('nSavedMoment').value='A good surprise at the first wall.';
  let blob=null,anchor=null;
  const make=global.document.createElement,create=global.URL.createObjectURL;
  global.document.createElement=(tag)=>{const node=make(tag);if(tag==='a')anchor=node;return node;};
  global.URL.createObjectURL=(value)=>{blob=value;return 'blob:local-test';};
  try{global.document.getElementById('nSavedDownloadNotes').click();}
  finally{global.document.createElement=make;global.URL.createObjectURL=create;}
  assert.ok(blob);assert.ok(anchor);
  const notes=JSON.parse(await blob.text());
  assert.equal(anchor.download,'nether-goofy-'+a.attemptId+'-notes.json');
  assert.equal(notes.attempt.id,a.attemptId);
  assert.equal(notes.attempt.recordedAs,'stopped-for-comparison');
  assert.equal(notes.feedback.note,'A good surprise at the first wall.');
  assert.equal(global.document.getElementById('nSavedExportStatus').textContent,'Notes downloaded. Nothing was sent.');
  const query=global.document.querySelector;
  global.document.querySelector=(selector)=>selector==='input[name="nPursuer"]:checked'?{value:'runner'}:query(selector);
  try{global.document.getElementById('nStart').click();}
  finally{global.document.querySelector=query;}
  assert.notEqual(n.view().attemptId,a.attemptId);
  assert.equal(notes.attempt.pursuer,'goofy');
  assert.equal(global.document.getElementById('nSavedMoment').value,'');
});
