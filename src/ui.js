  let settingsOpen=false,settingsWasPaused=false,focusBack=null,lastModal=null;
  let comparisonPair='paths',comparisonSide='a',selectedHistoryId=null,historySignature='',feedbackDirty=false,savedFeedbackDirty=false;
  const UI_LAYOUTS=new Map(options().layouts.map(candidate=>[candidate.id,candidate]));
  const PAIR_UI={
    paths:{question:'Which pathways make the best chase?',impact:'Changes: turns, junctions and escape loops',try:'Start with Current loops, then try Loop islands. Can you fool a rusher and still find your way back?',variants:[
      {id:'shape-current',layout:'rectangular-descent-v1',label:'Current loops',tag:'Familiar starting point',description:'The familiar narrow loops and forked corridors. Use this to remember how the current maze feels.'},
      {id:'shape-islands',layout:'loop-islands-v1',label:'Loop islands',tag:'Recommended next',description:'Pac-Man-style lanes around solid islands. More ways to circle a monster and choose another turn.'},
      {id:'shape-snake',layout:'snake-race-v1',label:'Snake race',tag:'Try the timing',description:'Longer winding lanes with tight turns. Test how far ahead you need to plan when a rusher commits.'}
    ]},
    boundaries:{question:'What if the layers bend with the maze?',impact:'Changes: corners, mining choices and the return route',try:'Try Rectangle islands first, then Stepped islands. Do the bends help you trick monsters or make you lose your way?',variants:[
      {id:'shape-islands',layout:'loop-islands-v1',label:'Rectangle islands',tag:'Same Loop islands map',description:'Straight rectangular layer walls around the island pathways. This is the baseline for comparing boundary shapes.'},
      {id:'shape-steps',layout:'stepped-islands-v1',label:'Stepped islands',tag:'Recommended next',description:'Continuous walls step in and out around the maze. Compare the extra corners and possible ways through.'},
      {id:'shape-castle',layout:'castle-islands-v1',label:'Castle islands',tag:'Try the alcoves',description:'Continuous walls form castle-like bends and pockets. Are those useful escape choices, or places to get cornered?'}
    ]}
  };
  function comparisonArt(id){
    const s=UI_LAYOUTS.get(id);if(!s)return '';
    const colors={'#':'#4b606a',b:'#dc986f',c:'#bd90e8',d:'#8cc9e5',e:'#f0928e',v:'#a88ed8','.':'#10262e'},paths={};
    for(let i=0;i<s.map.length;i++)(paths[s.map[i]]??=[]).push('M'+i%s.width+' '+Math.floor(i/s.width)+'h1v1h-1z');
    let drawing=Object.entries(paths).map(([tile,commands])=>'<path fill="'+(colors[tile]||'#10262e')+'" d="'+commands.join('')+'"/>').join('');
    const halo=(x,y,color)=>'<circle cx="'+(x+.5)+'" cy="'+(y+.5)+'" r="1.3" fill="#08191f" stroke="'+color+'" stroke-width=".25"/>';
    for(const enemy of s.enemies)drawing+='<g transform="translate('+(enemy.x+.5)+' '+(enemy.y+.5)+')"><path d="M-.8.8V-.1a.8.8 0 0 1 1.6 0V.8L.4.5 0 .8-.4.5Z" fill="#ffca64" stroke="#172832" stroke-width=".2"/><circle cx="-.3" cy="-.1" r=".17" fill="#172832"/><circle cx=".3" cy="-.1" r=".17" fill="#172832"/></g>';
    for(const core of s.cores)drawing+=halo(core.x,core.y,'#d1fff4')+'<path d="M'+(core.x+.5)+' '+(core.y-.35)+'l.7.85-.7.85-.7-.85Z" fill="#b4fff1"/>';
    for(const tool of s.upgrades){const color=['','#dc986f','#bd90e8','#8cc9e5','#f0928e'][tool.tier];drawing+=halo(tool.x,tool.y,color)+'<path d="m'+(tool.x-.15)+' '+(tool.y+1.3)+' 1.15-1.45m-1.3.2q.7-.9 1.6-.25" stroke="'+color+'" stroke-width=".35" fill="none"/>';}
    if(s.hammer)drawing+=halo(s.hammer.x,s.hammer.y,'#edf4ff')+'<g transform="translate('+(s.hammer.x+.5)+' '+(s.hammer.y+.5)+')"><path d="M0-.5V1" stroke="#c9a372" stroke-width=".4"/><rect x="-1" y="-.9" width="2" height=".8" rx=".2" fill="#d3e6ff"/></g>';
    drawing+=halo(s.goal.x,s.goal.y,'#a4efcc')+'<ellipse cx="'+(s.goal.x+.5)+'" cy="'+(s.goal.y+.5)+'" rx=".55" ry=".9" fill="#6bcba9"/>';
    drawing+='<circle cx="'+(s.start.x+.5)+'" cy="'+(s.start.y+.5)+'" r=".8" fill="#eef9ff" stroke="#4094e5" stroke-width=".4"/>';
    return '<svg data-layout="'+s.id+'" data-map-cells="'+s.map.length+'" viewBox="0 0 '+s.width+' '+s.height+'" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'+drawing+'</svg>';
  }
  function comparisonVariant(){return PAIR_UI[comparisonPair].variants['abc'.indexOf(comparisonSide)];}
  function mapName(id){return UI_LAYOUTS.get(id)?.name||id;}
  function renderComparison(){
    const meta=PAIR_UI[comparisonPair];
    for(const pair of Object.keys(PAIR_UI))$('nPair'+pair[0].toUpperCase()+pair.slice(1)).setAttribute('aria-pressed',String(pair===comparisonPair));
    for(const side of ['a','b','c']){const upper=side.toUpperCase(),variant=meta.variants['abc'.indexOf(side)];
      put('nVariant'+upper+'Label',variant.label);put('nVariant'+upper+'Description',variant.description);
      $('nVariant'+upper+'Art').innerHTML=comparisonArt(variant.layout);
      $('nVariant'+upper).setAttribute('aria-pressed',String(side===comparisonSide));
      put('nVariant'+upper+'Tag',variant.tag);
    }
    put('nPairQuestion',meta.question);put('nPairImpact',meta.impact);put('nPairTry',meta.try);
    put('nStart','Play '+comparisonVariant().label+' ↗');
  }
  function saveFeedbackDraft(){
    if(active&&state&&feedbackDirty){recordFeedback({feeling:selected('nFeeling',''),note:$('nFeedbackNote').value});feedbackDirty=false;}
    if(!active&&selectedHistoryId&&savedFeedbackDirty){recordFeedback({note:$('nSavedMoment').value},selectedHistoryId);savedFeedbackDirty=false;}
  }
  function loadFeedbackDraft(){
    const feedback=state?.feedback||{};
    for(const [id,value] of [['nFeelFun','fun'],['nFeelTense','tense'],['nFeelUnfair','unfair']])$(id).checked=feedback.feeling===value;
    $('nFeedbackNote').value=feedback.note||'';feedbackDirty=false;
  }
  function syncHistory(){
    const runs=history(),signature=JSON.stringify(runs);
    if(!runs.some(run=>run.id===selectedHistoryId))selectedHistoryId=runs[0]?.id||null;
    if(signature!==historySignature){historySignature=signature;const select=$('nHistory');select.innerHTML='';
      for(const run of runs){const option=document.createElement('option');option.value=run.id;option.textContent=(run.layoutName||run.label)+' · '+(run.status==='playing'?'In progress':run.status==='won'?'Escaped':'Caught')+' · '+Math.round(run.elapsed)+'s';select.appendChild(option);}
    }
    $('nHistory').value=selectedHistoryId||'';
    const saved=runs.find(run=>run.id===selectedHistoryId);
    $('nContinuePanel').classList.toggle('hidden',!saved);$('nResume').classList.toggle('hidden',!saved);
    if(saved){put('nSavedSummary',(saved.layoutName||saved.label)+' · '+saved.lives+' lives left · '+saved.cores+'/4 cores'+(saved.hammer?' · Hammer collected':''));put('nResume',saved.status==='playing'?'Continue adventure':'Review adventure');if(!savedFeedbackDirty&&document.activeElement!==$('nSavedMoment'))$('nSavedMoment').value=saved.feedback?.note||'';}
  }
  const put=(id,value)=>{if($(id).textContent!==value)$(id).textContent=value;};
  function topModal(){return settingsOpen?'nSettings':active&&state.awaitingReturn?'nReturn':active&&state.status!=='playing'?'nEnd':null;}
  function syncFocus(){
    const current=topModal();
    const setup=!active&&!$('title').classList.contains('hidden');
    for(const id of ['nHud','nHelp','stage','title','nSettings','nReturn','nEnd'])$(id).inert=!!current&&id!==current;
    for(const id of ['top','bottom','actionRow','stage'])$(id).inert=!!current||setup;
    if(current!==lastModal){
      lastModal=current;
      const target={nSettings:'nSettingsClose',nReturn:'nReturnContinue',nEnd:state?.status==='won'?'nReturnWoods':'nReplay'}[current];
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
      $('title').classList.remove('hidden');syncHistory();
      put('nTitleNote',storageOK?'Every new try starts fresh. Earlier adventures stay saved on this browser.':'Saving is unavailable here. Download your notes before closing this tab.');
      syncFocus();return;
    }
    $('title').classList.add('hidden');$('intro').classList.add('hidden');$('win').classList.add('hidden');$('opts').classList.add('hidden');
    const lit=state.cores.filter(b=>b.collected).length,e=state.enemies.find(e=>e.released&&e.phase==='burst')||state.enemies.find(e=>e.released&&e.phase==='windup')||state.enemies.find(e=>e.released)||state.enemies[0];
    put('nMode',mapName(state.layout)+' · '+PURSUERS.find(p=>p.id===state.pursuer).name+(state.origin==='woods'?' · After Night 20':''));
    put('nLives','♥'.repeat(state.lives)+'♡'.repeat(3-state.lives)+'  '+state.lives+'/3');$('nLives').setAttribute('aria-label',state.lives+' of 3 lives');
    const toolName=['','Copper','Crystal','Iron','Obsidian'][state.upgrade];
    put('nTool',toolName?toolName+' pickaxe':'Pickaxe needed');$('nTool').dataset.material=toolName.toLowerCase();
    put('nBeacons',lit===4&&state.hammer.collected?'4/4 · Portal ready':lit+'/4 cores');
    const h=state.hammer,face=h.faceY<0?'↑':h.faceY>0?'↓':h.faceX<0?'←':'→';
    const faceName=h.faceY<0?'up':h.faceY>0?'down':h.faceX<0?'left':'right';
    $('nHammer').disabled=!h.collected||h.cooldown>0||state.paused||state.awaitingReturn||state.status!=='playing';
    put('nHammer',h.cooldown>0?'Ready in '+h.cooldown.toFixed(1)+'s':'Swing '+face);
    $('nHammer').setAttribute('aria-label','Swing hammer '+faceName+(h.cooldown>0?', recharging':''));
    $('nHammer').dataset.ready=String(h.collected&&h.cooldown<=0);
    put('nHammerState',!h.collected?'Storm Hammer awaits at the centre':h.charged?'Lightning awakened!':'Storm Hammer · lightning asleep');
    put('nHammerHint',h.collected?'Facing '+faceName+' '+face+' · one monster per swing · lightning wakes at the portal.':'Claim it at the centre. Carry it out to awaken its lightning.');
    const refuge=state.refuge;
    put('nRefuge',refuge.inside&&refuge.remaining>0&&refuge.cooldown<=0?'Shield '+Math.ceil(refuge.remaining)+'s':refuge.inside&&refuge.remaining<=0?'Shield spent · leave refuge':refuge.cooldown>0?'Refuge recharge '+Math.ceil(refuge.cooldown)+'s':'Refuge ready · 8s');
    $('nRefuge').dataset.state=refuge.inside&&refuge.remaining>0&&refuge.cooldown<=0?'protected':refuge.inside&&refuge.remaining<=0?'spent':refuge.cooldown>0?'recharging':'ready';
    const released=state.enemies.filter(e=>e.released).length;
    const threat=!e.released?'All contained':e.wake>0?'Waking up':e.phase==='windup'?'Winding up!':e.phase==='burst'?'Rushing!':e.phase==='rest'?'Catching breath':'Hunting';
    put('nThreat',released+'/10 awake · '+(released&&state.elapsed%16>=12?'Patrolling · make an opening':state.pursuer==='goofy'&&released?'Goofy chase':threat));$('nThreat').dataset.state=!e.released?'contained':e.phase==='windup'?'warning':'hunting';
    const stages=[state.upgrade>=1,state.upgrade===4,lit===4&&state.hammer.collected,state.status==='won'];let first=true;
    ['nObjectiveTool','nObjectiveBreach','nObjectiveBeacons','nObjectiveExit'].forEach((id,i)=>{
      $(id).dataset.state=stages[i]?'done':first?'current':'waiting';if(!stages[i])first=false;
    });
    put('nMessage',state.paused&&!settingsOpen?'Paused. Resume when you are ready.':state.message);
    put('nPause',state.paused?'Resume':'Pause');put('nCameraToggle',prefs.closeView?'Map':'Close view');
    $('nCameraToggle').setAttribute('aria-pressed',String(prefs.closeView));
    $('nCameraToggle').setAttribute('aria-label',prefs.closeView?'Show the whole maze':'Return to close view');
    put('nControlHint',(state.trial?.control==='swipe'?'Swipe to turn · tap floor to stop':'Tap or drag to move')+' · tap matching wall to mine · two fingers: look / pinch: zoom');
    put('nStorage',storageOK?'Autosaved on this browser.':'Saving unavailable — keep this tab open.');$('nStorage').dataset.state=storageOK?'ok':'error';
    if(state.awaitingReturn){
      put('nReturnTitle',state.lastLoss==='void'?'A fall. Another chance.':'Caught. Still in the game.');
      put('nReturnLine',state.lastLoss==='void'?'Purple cracks mark the void. Your next route can go around it.':'Watch where the monsters wait. You have eight seconds of refuge protection after you continue.');
      put('nReturnLives','♥'.repeat(state.lives)+'♡'.repeat(3-state.lives)+' · '+state.lives+' lives left');
      put('nReturnKept',(toolName?toolName+' pickaxe':'Pickaxe still to find')+' · '+state.breaches+' openings · '+lit+'/4 cores'+(state.hammer.collected?' · Storm Hammer':''));
    }
    if(state.status!=='playing'){
      $('nEnd').dataset.outcome=state.status;
      $('nReturnWoods').classList.toggle('hidden',state.status!=='won');
      put('nEndTitle',state.status==='won'?'The storm is yours.':'Three lives. One more idea?');
      put('nEndLine',state.status==='won'?'You carried the hammer and four cores to the portal. Lightning has awakened. Take it into the woods!' :scene.hint);
      put('nEndStats',mapName(state.layout)+' · '+PURSUERS.find(p=>p.id===state.pursuer).name+' · '+state.lives+' lives left · '+state.breaches+' openings · '+Math.round(state.elapsed)+'s played');
    }
    syncFocus();
  }
  function chooseCamera(closeView){setPreferences({closeView,...(closeView&&prefs.zoom<=1.01?{zoom:2.2}:{})});}
  function openSettings(){focusBack=document.activeElement;settingsWasPaused=!!state?.paused;settingsOpen=true;if(active)setPaused(true);syncUI();}
  function closeSettings(){settingsOpen=false;if(active&&!state.awaitingReturn)setPaused(settingsWasPaused);syncUI();focusBack?.focus?.();}
  function selected(name,fallback){return document.querySelector('input[name="'+name+'"]:checked')?.value||fallback;}
  function resetFeedback(){for(const id of ['nFeelFun','nFeelTense','nFeelUnfair'])$(id).checked=false;$('nFeedbackNote').value='';$('nSavedMoment').value='';feedbackDirty=false;savedFeedbackDirty=false;put('nFeedbackStatus','Saved here. Nothing is sent.');put('nSavedExportStatus','Notes stay on this browser. Nothing is sent.');}
  function downloadNotes(json,attempt,statusId){
    const a=document.createElement('a'),url=URL.createObjectURL(new Blob([json],{type:'application/json'}));
    a.href=url;a.download=attempt?'nether-'+(attempt.pursuer||'comparison')+'-'+(attempt.attemptId||attempt.id)+'-notes.json':'nether-comparisons-notes.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);put(statusId,'Notes downloaded. Nothing was sent.');
  }
  function bindUI(){
    function launch(selection){saveFeedbackDraft();audioInit();closeIntro();resetFeedback();start('practice',selection);cv.focus?.();}
    $('nStart').addEventListener('click',()=>launch({preset:comparisonVariant().id}));
    for(const pair of Object.keys(PAIR_UI))$('nPair'+pair[0].toUpperCase()+pair.slice(1)).addEventListener('click',()=>{comparisonPair=pair;comparisonSide='a';renderComparison();});
    for(const side of ['a','b','c'])$('nVariant'+side.toUpperCase()).addEventListener('click',()=>{comparisonSide=side;renderComparison();});
    $('nCustomStart').addEventListener('click',()=>launch({layout:$('nCustomLayout').value,control:$('nCustomControl').value,brain:$('nCustomBrain').value,pursuer:$('nCustomLayers').value,weakSpots:$('nCustomWalls').value==='weak',cues:$('nCustomCues').value==='on'}));
    $('nHistory').addEventListener('change',()=>{saveFeedbackDraft();selectedHistoryId=$('nHistory').value;syncHistory();});
    $('nSavedMoment').addEventListener('input',()=>{savedFeedbackDirty=true;saveFeedbackDraft();put('nSavedExportStatus',storageOK?'Note saved here. Nothing is sent.':'Saving unavailable. Download your notes.');});
    $('nFeedbackNote').addEventListener('input',()=>{feedbackDirty=true;saveFeedbackDraft();put('nFeedbackStatus',storageOK?'Note saved here. Nothing is sent.':'Saving unavailable. Download your notes.');});
    for(const id of ['nFeelFun','nFeelTense','nFeelUnfair'])$(id).addEventListener('change',()=>{feedbackDirty=true;saveFeedbackDraft();});
    $('nResume').addEventListener('click',()=>{saveFeedbackDraft();audioInit();closeIntro();if(resume(selectedHistoryId)){loadFeedbackDraft();cv.focus?.();}else put('nTitleNote','The saved adventure could not be loaded. Choose a fresh challenge.');});
    $('nHammer').addEventListener('click',()=>{audioInit();swingHammer();cv.focus?.();});
    $('nReturnWoods').addEventListener('click',()=>{audioInit();returnToWoods();});
    $('nPause').addEventListener('click',()=>setPaused(!state.paused));
    for(const id of ['nSettingsOpen','nSetupSettings'])$(id).addEventListener('click',openSettings);
    for(const id of ['nSettingsClose','nSettingsDone'])$(id).addEventListener('click',closeSettings);
    for(const id of ['nMenu','nEndMenu'])$(id).addEventListener('click',()=>{saveFeedbackDraft();selectedHistoryId=state?.attemptId||selectedHistoryId;settingsOpen=false;leave();$('nStart').focus?.();});
    $('nReplay').addEventListener('click',()=>{saveFeedbackDraft();resetFeedback();replay();cv.focus?.();});
    $('nReturnContinue').addEventListener('click',()=>{resumeRecovery();cv.focus?.();});
    $('nCameraToggle').addEventListener('click',()=>chooseCamera(!prefs.closeView));
    $('nSound').addEventListener('click',()=>{muted=!muted;store.set('tn.mute',muted?'1':'0');audioInit();syncUI();});
    for(const [id,key] of [['nDodge','dodge'],['nRoute','showRoute'],['nContrast','highContrast'],['nReducedMotion','reducedMotion']])$(id).addEventListener('change',()=>setPreferences({[key]:$(id).checked}));
    for(const id of ['nCameraWhole','nCameraClose'])$(id).addEventListener('change',()=>chooseCamera($('nCameraClose').checked));
    $('nFeedback').addEventListener('submit',event=>event.preventDefault());
    $('nSavedDownloadNotes').addEventListener('click',()=>{
      saveFeedbackDraft();const saved=history().find(run=>run.id===selectedHistoryId),json=exportSavedNotes({},selectedHistoryId);
      if(!saved||!json){put('nSavedExportStatus','The saved adventure could not be read. Its data was left untouched.');return;}
      downloadNotes(json,saved,'nSavedExportStatus');
    });
    $('nHistoryDownload').addEventListener('click',()=>{saveFeedbackDraft();downloadNotes(exportHistory(),null,'nSavedExportStatus');});
    $('nDownloadNotes').addEventListener('click',()=>{
      saveFeedbackDraft();const json=exportNotes({feeling:selected('nFeeling',''),note:$('nFeedbackNote').value});
      downloadNotes(json,state,'nFeedbackStatus');
    });
    window.addEventListener('blur',()=>{if(active)setPaused(true);});
    document.addEventListener('visibilitychange',()=>{if(active&&document.hidden)setPaused(true);});
    window.addEventListener('pagehide',()=>{saveFeedbackDraft();if(active)persist();});
    document.addEventListener('keydown',event=>{if(settingsOpen&&!active)key(event);});
    cv.setAttribute('tabindex','0');renderComparison();syncUI();
  }
