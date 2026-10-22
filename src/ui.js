  let settingsOpen=false,settingsWasPaused=false,focusBack=null,lastModal=null;
  const put=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
  function topModal(){return settingsOpen?'nSettings':active&&state.awaitingReturn?'nReturn':active&&state.status!=='playing'?'nEnd':null;}
  function syncFocus(){
    const current=topModal();
    const setup=!active&&!$('title').classList.contains('hidden');
    for(const id of ['nHud','nHelp','stage','title','nSettings','nReturn','nEnd'])$(id).inert=!!current&&id!==current;
    for(const id of ['top','bottom','actionRow','stage'])$(id).inert=!!current||setup;
    if(current!==lastModal){
      lastModal=current;
      const target={nSettings:'nSettingsClose',nReturn:'nReturnContinue',nEnd:'nReplay'}[current];
      if(target)$(target).focus?.();
    }
  }
  function prepareWoods(){
    if(active)leave();
    $('title').classList.add('hidden');
    for(const id of ['top','bottom','actionRow','stage'])$(id).inert=false;
  }
  function syncUI(){
    document.body.classList.toggle('nether-active',active);
    document.body.classList.toggle('nHighContrast',prefs.highContrast);
    document.body.classList.toggle('nReducedMotion',prefs.reducedMotion);
    $('nHud').classList.toggle('hidden',!active);$('nHelp').classList.toggle('hidden',!active);
    $('nSettings').classList.toggle('hidden',!settingsOpen);
    $('nReturn').classList.toggle('hidden',!active||!state.awaitingReturn);
    $('nEnd').classList.toggle('hidden',!active||state.status==='playing');
    $('nMenu').classList.toggle('hidden',!active);
    put('nSound',muted?'Sound off':'Sound on');$('nSound').setAttribute('aria-pressed',String(!muted));
    for(const [id,key] of [['nDodge','dodge'],['nRoute','showRoute'],['nContrast','highContrast'],['nReducedMotion','reducedMotion']])$(id).checked=prefs[key];
    $('nCameraWhole').checked=!prefs.closeView;$('nCameraClose').checked=prefs.closeView;
    put('nSettingsStatus',active?'The chase is paused while this is open.':'Choose the controls and display you like. Every challenge keeps three lives.');
    if(!active){
      $('title').classList.remove('hidden');const saved=savedAttempt();
      $('nContinuePanel').classList.toggle('hidden',!saved);$('nResume').classList.toggle('hidden',!saved);
      if(saved){const l=layout(saved.layout),p=PURSUERS.find(v=>v.id===saved.pursuer);
        put('nSavedSummary',l.name+' · '+p.name+' · '+saved.lives+' lives left · '+saved.cores.filter(b=>b.collected).length+'/2 cores');
        put('nResume',saved.status==='playing'?'Continue adventure':'Review last adventure');}
      put('nTitleNote',storageOK?'A new adventure starts with three lives and replaces the current saved attempt.':'Saving is unavailable here. Keep this tab open to keep your adventure.');
      syncFocus();return;
    }
    $('title').classList.add('hidden');$('intro').classList.add('hidden');$('win').classList.add('hidden');$('opts').classList.add('hidden');
    const lit=state.cores.filter(b=>b.collected).length,e=state.enemies.find(e=>e.released&&e.phase==='burst')||state.enemies.find(e=>e.released&&e.phase==='windup')||state.enemies.find(e=>e.released)||state.enemies[0];
    put('nMode',scene.name+' · '+PURSUERS.find(p=>p.id===state.pursuer).name+(state.origin==='woods'?' · After Night 20':''));
    put('nLives','♥'.repeat(state.lives)+'♡'.repeat(3-state.lives)+'  '+state.lives+'/3');$('nLives').setAttribute('aria-label',state.lives+' of 3 lives');
    put('nTool',state.upgrade?'Pickaxe '+state.upgrade+'/2':'Pickaxe needed');put('nBeacons',lit===2?'2/2 · Exit open':lit+'/2 cores');
    const released=state.enemies.filter(e=>e.released).length;
    const threat=!e.released?'Both contained':e.wake>0?'Waking up':e.phase==='windup'?'Winding up!':e.phase==='burst'?'Rushing!':e.phase==='rest'?'Catching breath':'Hunting';
    put('nThreat',released+'/2 awake · '+(state.pursuer==='goofy'&&released?'Goofy chase':threat));$('nThreat').dataset.state=!e.released?'contained':e.phase==='windup'?'warning':'hunting';
    const stages=[state.upgrade>=1,state.upgrade===2,lit===2,state.status==='won'];let first=true;
    ['nObjectiveTool','nObjectiveBreach','nObjectiveBeacons','nObjectiveExit'].forEach((id,i)=>{
      $(id).dataset.state=stages[i]?'done':first?'current':'waiting';if(!stages[i])first=false;
    });
    put('nMessage',state.paused&&!settingsOpen?'Paused. Resume when you are ready.':state.message);
    put('nPause',state.paused?'Resume':'Pause');put('nCameraToggle',prefs.closeView?'Overview':'Zoom');
    $('nCameraToggle').setAttribute('aria-pressed',String(prefs.closeView));
    $('nCameraToggle').setAttribute('aria-label',prefs.closeView?'Show the whole maze':'Zoom in on the board');
    put('nControlHint','Drag or tap to move · tap a numbered wall to mine · touch cores to collect'+(prefs.dodge?' · Dodge on':''));
    put('nStorage',storageOK?'Autosaved on this browser.':'Saving unavailable — keep this tab open.');$('nStorage').dataset.state=storageOK?'ok':'error';
    if(state.awaitingReturn){
      put('nReturnTitle',state.lastLoss==='void'?'A fall. Another chance.':'Caught. Still in the game.');
      put('nReturnLine',state.lastLoss==='void'?'Purple cracks mark the void. Your next route can go around it.':'Watch where the pursuer waits. The blue refuge gives you time to plan.');
      put('nReturnLives','♥'.repeat(state.lives)+'♡'.repeat(3-state.lives)+' · '+state.lives+' lives left');
      put('nReturnKept',(state.upgrade?'Pickaxe tier '+state.upgrade:'Pickaxe still to find')+' · '+state.breaches+' openings · '+lit+'/2 cores');
    }
    if(state.status!=='playing'){
      $('nEnd').dataset.outcome=state.status;
      put('nEndTitle',state.status==='won'?'You made it through.':'Three lives. One more idea?');
      put('nEndLine',state.status==='won'?'Two cores carried through the exit on foot.':scene.hint);
      put('nEndStats',scene.name+' · '+PURSUERS.find(p=>p.id===state.pursuer).name+' · '+state.lives+' lives left · '+state.breaches+' openings · '+Math.round(state.elapsed)+'s played');
    }
    syncFocus();
  }
  function openSettings(){focusBack=document.activeElement;settingsWasPaused=!!state?.paused;settingsOpen=true;if(active)setPaused(true);syncUI();}
  function closeSettings(){settingsOpen=false;if(active&&!state.awaitingReturn)setPaused(settingsWasPaused);syncUI();focusBack?.focus?.();}
  function selected(name,fallback){return document.querySelector('input[name="'+name+'"]:checked')?.value||fallback;}
  function resetFeedback(){for(const id of ['nFeelFun','nFeelTense','nFeelUnfair'])$(id).checked=false;$('nFeedbackNote').value='';$('nSavedMoment').value='';put('nFeedbackStatus','Stays here. Nothing is sent.');put('nSavedExportStatus','Download notes before trying another chase. Nothing is sent.');}
  function downloadNotes(json,attempt,statusId){
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    a.href=url;a.download='nether-'+attempt.pursuer+'-'+attempt.attemptId+'-notes.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);put(statusId,'Notes downloaded. Nothing was sent.');
  }
  function renderPreviews(){
    const canvas=$('nPreview-nested-loops-v1'),c=canvas.getContext('2d');if(!c)return;
    const s=layout(),scale=4,ox=40;c.clearRect(0,0,160,80);
    for(let i=0;i<400;i++){c.fillStyle={'#':'#64747c',b:'#dc986f',c:'#bd90e8',v:'#b291dd','.':'#26383e'}[s.map[i]];c.fillRect(ox+(i%20)*scale,Math.floor(i/20)*scale,scale-1,scale-1);}
    for(const [p,color] of [[s.start,'#2c7be5'],[s.goal,'#7eefac'],...s.upgrades.map(p=>[p,'#ffe29b']),...s.cores.map(p=>[p,'#cafff3']),...s.enemies.map(p=>[p,'#f68c90'])]){c.fillStyle=color;c.fillRect(ox+p.x*scale,p.y*scale,4,4);}
  }
  function bindUI(){
    $('nStart').addEventListener('click',()=>{audioInit();closeIntro();resetFeedback();start('practice',{pursuer:selected('nPursuer','goofy')});cv.focus?.();});
    $('nResume').addEventListener('click',()=>{audioInit();closeIntro();if(!resume())put('nTitleNote','The saved adventure could not be loaded. Choose a fresh challenge.');});
    $('nPause').addEventListener('click',()=>setPaused(!state.paused));
    for(const id of ['nSettingsOpen','nSetupSettings'])$(id).addEventListener('click',openSettings);
    for(const id of ['nSettingsClose','nSettingsDone'])$(id).addEventListener('click',closeSettings);
    for(const id of ['nMenu','nEndMenu'])$(id).addEventListener('click',()=>{settingsOpen=false;leave();$('nStart').focus?.();});
    $('nReplay').addEventListener('click',()=>{resetFeedback();replay();cv.focus?.();});
    $('nReturnContinue').addEventListener('click',()=>{resumeRecovery();cv.focus?.();});
    $('nCameraToggle').addEventListener('click',()=>setPreferences({closeView:!prefs.closeView}));
    $('nSound').addEventListener('click',()=>{muted=!muted;store.set('tn.mute',muted?'1':'0');audioInit();syncUI();});
    for(const [id,key] of [['nDodge','dodge'],['nRoute','showRoute'],['nContrast','highContrast'],['nReducedMotion','reducedMotion']])$(id).addEventListener('change',()=>setPreferences({[key]:$(id).checked}));
    for(const id of ['nCameraWhole','nCameraClose'])$(id).addEventListener('change',()=>setPreferences({closeView:$('nCameraClose').checked}));
    $('nFeedback').addEventListener('submit',event=>event.preventDefault());
    $('nSavedDownloadNotes').addEventListener('click',()=>{
      const saved=savedAttempt(),json=exportSavedNotes({note:$('nSavedMoment').value});
      if(!saved||!json){put('nSavedExportStatus','The saved adventure could not be read. Its data was left untouched.');return;}
      downloadNotes(json,saved,'nSavedExportStatus');
    });
    $('nDownloadNotes').addEventListener('click',()=>{
      const json=exportNotes({feeling:selected('nFeeling',''),note:$('nFeedbackNote').value});
      downloadNotes(json,state,'nFeedbackStatus');
    });
    window.addEventListener('blur',()=>{if(active)setPaused(true);});
    document.addEventListener('visibilitychange',()=>{if(active&&document.hidden)setPaused(true);});
    window.addEventListener('pagehide',()=>{if(active)persist();});
    document.addEventListener('keydown',event=>{if(settingsOpen&&!active)key(event);});
    cv.setAttribute('tabindex','0');renderPreviews();syncUI();
  }
